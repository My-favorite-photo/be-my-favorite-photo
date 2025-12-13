import { prisma } from '../configs/prismaClient.js';
import { TradeStatus } from '../generated/enums.ts';

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
};

export default tradeRepository;
