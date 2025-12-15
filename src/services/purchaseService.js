import { BadRequestException } from '../common/exceptions/badRequestException.js';
import { ConflictException } from '../common/exceptions/conflictException.js';
import { ForbiddenException } from '../common/exceptions/forbiddenException.js';
import { NotFoundException } from '../common/exceptions/notFoundException.js';
import { prisma } from '../configs/prismaClient.js';
import pointService from './pointService.js';

console.log('DATABASE_URL:', process.env.DATABASE_URL);
async function purchase({ saleId, buyerId, quantity }) {
  if (!saleId || !buyerId) {
    throw new BadRequestException('saleId, buyerId는 필수입니다.');
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new BadRequestException('quantity는 1 이상!');
  }

  return prisma.$transaction(async (tx) => {
    //Sale 조회
    console.log('purchase saleId:', saleId);

    const sale = await tx.sale.findUnique({
      where: { id: saleId },
      select: {
        id: true,
        sellerId: true,
        price: true,
        status: true,
        quantity: true,
      },
    });
    console.log('found sale:', sale);

    if (!sale) {
      throw new NotFoundException('존재하지 않는 판매글입니다!');
    }
    if (sale.status !== 'ON_SALE') {
      throw new ConflictException('판매중이 아닌 상품입니다!');
    }
    if (sale.sellerId === buyerId) {
      throw new ForbiddenException('본인의 상품은 구매할 수 없습니다!');
    }
    if (sale.quantity < quantity) {
      throw new ConflictException('판매 수량이 부족합니다!');
    }

    const dec = await tx.sale.updateMany({
      where: {
        id: saleId,
        status: 'ON_SALE',
        quantity: { gte: quantity },
      },
      data: { quantity: { decrement: quantity } },
    });
    if (dec.count !== 1) {
      throw new ConflictException('구매 처리 중 판매 상태가 변경되었습니다.');
    }

    //실제 판매 카드 확보
    const saleHistories = await tx.saleHistory.findMany({
      where: { saleId },
      take: quantity,
      select: { userCardId: true },
    });
    if (saleHistories.length !== quantity) {
      throw new ConflictException('판매 카드 재고가 부족합니다.');
    }
    const userCardIds = saleHistories.map((x) => x.userCardId);

    //결제 금액
    const totalPrice = sale.price * quantity;

    //포인트 이동
    await pointService.deductPoint(tx, buyerId, totalPrice, 'BUY_SPEND', `판매글(${saleId}) 구매`);

    await pointService.addPoint(
      tx,
      sale.sellerId,
      totalPrice,
      'SALE_INCOME',
      `판매글(${saleId}) 판매 수익`,
    );

    //카드 소유권 이전
    const moved = await tx.userCard.updateMany({
      where: {
        id: { in: userCardIds },
        userId: sale.sellerId,
        status: 'ON_SALE',
      },
      data: {
        userId: buyerId,
        status: 'OWNED',
      },
    });
    if (moved.count !== quantity) {
      throw new ConflictException('카드 소유권 이전에 실패했습니다.');
    }

    //세일히스토리 정리
    await tx.saleHistory.deleteMany({
      where: { saleId, userCardId: { in: userCardIds } },
    });

    //솔드아웃 처리
    const left = await tx.sale.findUnique({
      where: { id: saleId },
      select: { quantity: true },
    });
    if (left?.quantity === 0) {
      await tx.sale.update({
        where: { id: saleId },
        data: { status: 'SOLD_OUT' },
      });
    }

    const buyerPoint = await tx.point.findUnique({
      where: { userId: buyerId },
      select: { balance: true },
    });

    return {
      balance: buyerPoint?.balance ?? 0,
      purchase: {
        saleId,
        quantity,
        totalPrice,
      },
    };
  });
}

export default { purchase };
