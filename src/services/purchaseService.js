import { BadRequestException } from '../common/exceptions/badRequestException.js';
import { ConflictException } from '../common/exceptions/conflictException.js';
import { ForbiddenException } from '../common/exceptions/forbiddenException.js';
import { NotFoundException } from '../common/exceptions/notFoundException.js';
import { prisma } from '../configs/prismaClient.js';
import { SaleStatus } from '../generated/enums.ts';
import pointService from './pointService.js';
import notificationRepository from '../repositories/notificationRepository.js';

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
      select: {
        id: true,
        sellerId: true,
        price: true,
        status: true,
        remainingQuantity: true,
      },
    });

    if (!sale) throw new NotFoundException('존재하지 않는 판매글입니다!');
    if (sale.status !== SaleStatus.ON_SALE)
      throw new ConflictException('판매중이 아닌 상품입니다!');
    if (sale.sellerId === buyerId)
      throw new ForbiddenException('본인의 상품은 구매할 수 없습니다!');
    if (sale.remainingQuantity < quantity) throw new ConflictException('판매 수량이 부족합니다!');

    // 재고 차감
    const dec = await tx.sale.updateMany({
      where: {
        id: saleId,
        status: SaleStatus.ON_SALE,
        remainingQuantity: { gte: quantity },
      },
      data: { remainingQuantity: { decrement: quantity } },
    });
    if (dec.count !== 1) throw new ConflictException('구매 처리 중 판매 상태가 변경되었습니다.');

    // 실제 카드 확보
    const saleHistories = await tx.saleHistory.findMany({
      where: { saleId },
      take: quantity,
      select: { userCardId: true },
    });
    if (saleHistories.length !== quantity)
      throw new ConflictException('판매 카드 재고가 부족합니다.');
    const userCardIds = saleHistories.map((x) => x.userCardId);

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

    // 카드 소유권 이전
    const moved = await tx.userCard.updateMany({
      where: { id: { in: userCardIds }, userId: sale.sellerId, status: SaleStatus.ON_SALE },
      data: { userId: buyerId, status: 'OWNED' },
    });
    if (moved.count !== quantity) throw new ConflictException('카드 소유권 이전에 실패했습니다.');

    // 세일 히스토리 정리
    await tx.saleHistory.deleteMany({ where: { saleId, userCardId: { in: userCardIds } } });

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
    const card = await tx.userCard.findFirst({
      where: {
        id: { in: userCardIds },
      },
      select: {
        photoCard: {
          select: {
            grade: true,
            name: true,
          },
        },
      },
    });

    await notificationRepository.create(
      {
        userId: sale.sellerId,
        content: `${buyer.nickname}님이 [${card.photoCard.grade} | ${card.photoCard.name}]을 ${quantity}장 구매했습니다.`,
      },
      tx,
    );

    await notificationRepository.create(
      {
        userId: buyerId,
        content: `[${card.photoCard.grade} | ${card.photoCard.name}] ${quantity}장 구매가 성공적으로 완료되었습니다.`,
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
