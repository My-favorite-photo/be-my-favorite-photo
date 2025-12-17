import { ForbiddenException } from '../common/exceptions/forbiddenException.js';
import { NotFoundException } from '../common/exceptions/notFoundException.js';
import { prisma } from '../configs/prismaClient.js';
import { CardStatus, SaleStatus, TradeItemType, TradeStatus } from '../generated/enums.ts';

const tradeRepository = {
  requestTrade(data, tx = prisma) {
    return tx.trade.create({
      data: {
        ...data,
        status: TradeStatus.PENDING, // trade 테이블 상태를 ON_SALE로 설정
      },
    });
  },

  /**
   * 교환 상태를 업데이트.
   */
  updateTrade(tradeId, status, tx = prisma) {
    return tx.trade.update({
      where: { id: tradeId },
      data: { status: status },
    });
  },

  /**
   *  교환에 포함되는 카드 항목을 기록
   */
  addTradeItem(tradeId, userCardId, type, tx = prisma) {
    return tx.tradeHistory.create({
      data: {
        tradeId: tradeId,
        userCardId: userCardId,
        type: type,
      },
    });
  },

  findTradeById(tradeId) {
    return prisma.trade.findUnique({
      where: { id: tradeId },
    });
  },

  deleteTradeStatus(tradeId) {
    return prisma.trade.delete({
      where: { id: tradeId },
    });
  },

  async approveTradeTransaction(tradeId, saleId) {
    const result = await prisma.$transaction(async (tx) => {
      // 교환 정보 조회 (OFFERED  상태 조회)
      const trade = await tx.trade.findUnique({
        where: { id: tradeId },
        select: {
          id: true,
          status: true,
          applicantId: true,
          tradeHistories: {
            where: { type: TradeItemType.OFFERED },
            select: { userCardId: true },
          },
        },
      });
      // 판매글 정보 조회 (saleId 기준)
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        select: {
          userCardId: true,
          sellerId: true,
          remainingQuantity: true,
          status: true,
          userCard: { select: { photoCardId: true } },
        },
      });

      if (!trade || !sale) throw new NotFoundException('trade or sale 데이터를 찾을수 없습니다.');

      if (trade.status !== TradeStatus.PENDING) {
        throw new ForbiddenException(`Trade가 PENDING 상태가 아닙니다: ${trade.status}`);
      }

      if (sale.remainingQuantity < 1 || sale.status !== SaleStatus.ON_SALE) {
        throw new ForbiddenException('판매글이 내려간 상태거나 sold out 되었습니다.');
      }

      const buyerUserCardId = trade.tradeHistories[0]?.userCardId;
      const sellerUserCardId = sale.userCardId;

      // [구매자 -> 판매자] 이동
      // 구매자 카드 -1
      const buyerCard = await tx.userCard.update({
        where: { id: buyerUserCardId },
        data: { totalQuantity: { decrement: 1 } },
      });

      // 판매자에게 지급 (조회 후 분기)
      const existingCardForSeller = await tx.userCard.findFirst({
        where: { userId: sale.sellerId, photoCardId: buyerCard.photoCardId },
      });

      // 이미 있으면 수량만 +1
      if (existingCardForSeller) {
        await tx.userCard.update({
          where: { id: existingCardForSeller.id },
          data: { totalQuantity: { increment: 1 } },
        });
      } else {
        await tx.userCard.create({
          data: {
            userId: sale.sellerId,
            photoCardId: buyerCard.photoCardId,
            totalQuantity: 1,
            status: CardStatus.OWNED,
          },
        });
      }

      // [판매자 -> 구매자] 이동
      // 판매자 실제 카드 재고 -1
      await tx.userCard.update({
        where: { id: sellerUserCardId },
        data: { totalQuantity: { decrement: 1 } },
      });

      // 구매자에게 지급
      const existingCardForBuyer = await tx.userCard.findFirst({
        where: { userId: trade.applicantId, photoCardId: sale.userCard.photoCardId },
      });

      // 이미 있으면 수량만 +1
      if (existingCardForBuyer) {
        await tx.userCard.update({
          where: { id: existingCardForBuyer.id },
          data: { totalQuantity: { increment: 1 } },
        });
      } else {
        await tx.userCard.create({
          data: {
            userId: trade.applicantId,
            photoCardId: sale.userCard.photoCardId,
            totalQuantity: 1,
            status: CardStatus.OWNED,
          },
        });
      }
      //  판매글 재고 차감 거래 상태 업데이트
      const isLastItem = sale.remainingQuantity === 1;
      await tx.sale.update({
        where: { id: saleId },
        data: {
          remainingQuantity: { decrement: 1 },
          // 재고가 1이면 또 1개 감소 후 0 -> SOLD_OUT으로 업데이트
          status: isLastItem ? SaleStatus.SOLD_OUT : SaleStatus.ON_SALE,
        },
      });

      // 교환 을 삭제
      await tx.trade.delete({
        where: { id: tradeId },
      });

      return { success: true, tradeId };
    });
    return result;
  },
};

export default tradeRepository;
