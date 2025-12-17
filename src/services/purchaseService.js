import { BadRequestException } from '../common/exceptions/badRequestException.js';
import { ConflictException } from '../common/exceptions/conflictException.js';
import { ForbiddenException } from '../common/exceptions/forbiddenException.js';
import { NotFoundException } from '../common/exceptions/notFoundException.js';
import { prisma } from '../configs/prismaClient.js';
import { CardStatus, SaleStatus } from '../generated/enums.ts';
import notificationRepository from '../repositories/notificationRepository.js';
import pointService from './pointService.js';

async function purchase({ saleId, buyerId, quantity }) {
  if (!saleId || !buyerId) {
    throw new BadRequestException('saleId, buyerId는 필수입니다.');
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new BadRequestException('quantity는 1 이상이어야 합니다.');
  }

  return prisma.$transaction(async (tx) => {
    // 판매글 조회
    const sale = await tx.sale.findUnique({
      where: { id: saleId },
      include: {
        userCard: { select: { photoCard: true, photoCardId: true } },
      },
    });

    if (!sale) throw new NotFoundException('존재하지 않는 판매글입니다!');
    if (sale.status !== SaleStatus.ON_SALE)
      throw new ConflictException('판매중이 아닌 상품입니다!');
    if (sale.sellerId === buyerId)
      throw new ForbiddenException('본인의 상품은 구매할 수 없습니다!');
    if (sale.remainingQuantity < quantity) throw new ConflictException('판매 수량이 부족합니다!');

    // 재고 차감
    await tx.sale.update({
      where: { id: saleId },
      data: {
        remainingQuantity: { decrement: quantity },
        status: sale.remainingQuantity - quantity === 0 ? SaleStatus.SOLD_OUT : SaleStatus.ON_SALE,
      },
    });

    // 결제
    const totalPrice = sale.price * quantity;
    await pointService.deductPoint(tx, buyerId, totalPrice, 'BUY_SPEND', `판매글(${saleId}) 구매`);
    await pointService.addPoint(
      tx,
      sale.sellerId,
      totalPrice,
      'SALE_INCOME',
      `판매글(${saleId}) 판매 수익`,
    );

    // 카드 소유권 이전 (판매자 차감 -> 구매자 합산)
    await tx.userCard.update({
      where: { id: sale.userCardId },
      data: { totalQuantity: { decrement: quantity } },
    });

    const existingBuyerCard = await tx.userCard.findFirst({
      where: { userId: buyerId, photoCardId: sale.userCard.photoCardId },
    });

    if (existingBuyerCard) {
      await tx.userCard.update({
        where: { id: existingBuyerCard.id },
        data: { totalQuantity: { increment: quantity } },
      });
    } else {
      await tx.userCard.create({
        data: {
          userId: buyerId,
          photoCardId: sale.userCard.photoCardId,
          totalQuantity: quantity,
          status: CardStatus.OWNED,
        },
      });
    }
    // SOLD_OUT 처리
    const remainingSale = await tx.sale.findUnique({
      where: { id: saleId },
      select: { remainingQuantity: true },
    });
    if (remainingSale.remainingQuantity === 0) {
      await tx.sale.update({ where: { id: saleId }, data: { status: SaleStatus.SOLD_OUT } });
    }

    // 알림 생성
    const buyer = await tx.user.findUnique({ where: { id: buyerId }, select: { nickname: true } });
    const photoCard = sale.userCard.photoCard;

    await notificationRepository.create(
      {
        userId: sale.sellerId,
        content: `${buyer.nickname}님이 [${photoCard.grade} | ${photoCard.name}]을 ${quantity}장 구매했습니다.`,
      },
      tx,
    );

    await notificationRepository.create(
      {
        userId: buyerId,
        content: `[${photoCard.grade} | ${photoCard.name}] ${quantity}장 구매가 성공적으로 완료되었습니다.`,
      },
      tx,
    );

    // 구매자 포인트 조회
    const buyerPoint = await tx.point.findUnique({
      where: { userId: buyerId },
      select: { balance: true },
    });

    return {
      balance: buyerPoint?.balance ?? 0,
      purchase: { saleId, quantity, totalPrice },
    };
  });
}

export default { purchase };
