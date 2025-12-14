import { ForbiddenException } from '../common/exceptions/forbiddenException.js';
import { NotFoundException } from '../common/exceptions/notFoundException.js';
import { prisma } from '../configs/prismaClient.js';
import { SaleStatus, TradeItemType, TradeStatus } from '../generated/enums.ts';

const tradeRepository = {
  requestTrade(data, tx = prisma) {
    return tx.trade.create({
      data: {
        ...data,
        status: TradeStatus.PENDING, // Sale 테이블 상태를 ON_SALE로 설정
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

  updateTradeStatus(tradeId, newStatus) {
    return prisma.trade.update({
      where: { id: tradeId },
      data: {
        status: newStatus,
      },
      include: {
        applicant: { select: { nickname: true } },
      },
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
        select: { userCardId: true, sellerId: true, quantity: true, status: true },
      });

      if (!trade || !sale) throw new NotFoundException('trade or sale 데이터를 찾을수 없습니다.');

      if (trade.status !== TradeStatus.PENDING) {
        throw new ForbiddenException(`Trade가 PENDING 상태가 아닙니다: ${trade.status}`);
      }

      if (sale.quantity < 1 || sale.status !== SaleStatus.ON_SALE) {
        throw new ForbiddenException('판매글이 내려간 상태거나 sold out 되었습니다.');
      }

      const buyerOfferedCardId = trade.tradeHistories[0]?.userCardId;
      const sellerCardId = sale.userCardId;

      // sellerId와 applicantId는 소유권 이전에 사용됩니다.
      const sellerId = sale.sellerId;
      const applicantId = trade.applicantId;

      if (!buyerOfferedCardId || !sellerCardId)
        throw new NotFoundException('요청자와 대상카드 아이디를 찾을수 없습니다.');

      // 소유 권 교환
      // buyer -> seller move
      await tx.userCard.update({
        where: { id: buyerOfferedCardId },
        data: { userId: sellerId },
      });

      // seller 카드 소유권 -> buyer 에게 소유권 이전
      await tx.userCard.update({
        where: { id: sellerCardId },
        data: { userId: applicantId },
      });

      //  판매글 재고 차감
      const newSaleStatus = sale.quantity === 1 ? SaleStatus.SOLD_OUT : SaleStatus.ON_SALE;
      await tx.sale.update({
        where: { id: saleId },
        data: {
          quantity: { decrement: 1 },
          // 재고가 1이면 또 1개 감소 후 0 -> SOLD_OUT으로 업데이트
          status: newSaleStatus,
        },
      });

      // 교환status 를 -> COMPLETED로 변경
      const updatedTrade = await tx.trade.update({
        where: { id: tradeId },
        data: {
          status: TradeStatus.COMPLETED,
        },
      });

      return updatedTrade;
    });
    return result;
  },
};

export default tradeRepository;
