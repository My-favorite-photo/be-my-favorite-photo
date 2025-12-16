import { BadRequestException } from '../common/exceptions/badRequestException.js';
import { ForbiddenException } from '../common/exceptions/forbiddenException.js';
import { NotFoundException } from '../common/exceptions/notFoundException.js';
import { prisma } from '../configs/prismaClient.js';
import { CardStatus, TradeItemType, TradeStatus } from '../generated/enums.ts';
import saleRepository from '../repositories/saleRepository.js';
import tradeRepository from '../repositories/tradeRepository.js';
import userCardRepository from '../repositories/userCardRepository.js';

/**
 *  구매자의 교환 요청
 * @param {string} applicantId -  교환을 신청하는 사용자 ID (로그인된 사용자)
 * @param {object} tradeData - saleId, offeredUserCardId, description 등
 */
async function requestTradeCard({ applicantId, saleId, offeredUserCardId, description }) {
  if (!saleId || !offeredUserCardId) {
    throw new NotFoundException('필수 교환 정보(판매 ID, 제시 카드 ID)가 누락되었습니다.');
  }

  const offeredCard = await userCardRepository.findUserCardDetail(applicantId, offeredUserCardId);
  if (!offeredCard || offeredCard.userId !== applicantId) {
    throw new ForbiddenException('제시된 카드에 대한 소유권이 없습니다.');
  }

  if (offeredCard.status !== CardStatus.OWNED) {
    throw new BadRequestException('제시된 카드는 현재 판매 또는 교환 중이 입니다.');
  }

  // 교환 대상 Sale  정보 확인
  const targetSale = await saleRepository.findActiveSaleBySaleId(saleId);
  if (!targetSale || targetSale.status !== 'ON_SALE') {
    throw new NotFoundException('교환 대상 카드가 판매 중이 아니거나 존재하지 않습니다.');
  }
  if (targetSale.sellerId === applicantId) {
    throw new BadRequestException('자신의 판매 카드에 교환을 요청할 수 없습니다.');
  }

  return prisma.$transaction(async (tx) => {
    const newTrade = await tradeRepository.requestTrade(
      {
        applicantId: applicantId,
        ownerId: targetSale.sellerId,
        saleId: saleId,
        description: description,
        userCardId: targetSale.userCardId,
      },
      tx,
    );

    const tradeId = newTrade.id;

    // history에 기록 (신청자가 게시하는 카드)
    await tradeRepository.addTradeItem(tradeId, offeredUserCardId, TradeItemType.OFFERED, tx);
    // history에 기록 (신청자가  원하는 카드)
    await tradeRepository.addTradeItem(tradeId, targetSale.userCardId, TradeItemType.TARGET, tx);

    await userCardRepository.updateCardStatus(offeredUserCardId, CardStatus.TRADING, tx);

    // notification 새 교환 요청이 도착하였다. 여기쯤
    return newTrade;
  });
}

async function cancelTradeOffer(tradeId, applicantId) {
  const trade = await tradeRepository.findTradeById(tradeId);

  if (!trade) {
    throw new NotFoundException('해당 교환 요청을 찾을 수 없습니다.');
  }

  if (trade.applicantId !== applicantId) {
    throw new ForbiddenException('이 교환 요청을 취소할 권한이 없습니다.');
  }

  if (trade.status !== TradeStatus.PENDING) {
    throw new ForbiddenException(`현재 상태(${trade.status})에서는 취소할 수 없습니다.`);
  }
  //  취소요청 (상태 변경 시킴)
  const updateTrade = await tradeRepository.updateTradeStatus(tradeId, TradeStatus.CANCELLED);
  return updateTrade;
}

async function rejectTradeOffer(tradeId, ownerId) {
  const trade = await tradeRepository.findTradeById(tradeId);

  if (!trade) {
    throw new NotFoundException('해당 교환 요청을 찾을 수 없습니다.');
  }

  if (trade.ownerId !== ownerId) {
    throw new ForbiddenException('이 교환 요청을 취소할 권한이 없습니다.');
  }

  if (trade.status !== TradeStatus.PENDING) {
    throw new ForbiddenException(`현재 상태(${trade.status})에서는 취소할 수 없습니다.`);
  }
  //  취소요청 (상태 변경 시킴)
  const updateTrade = await tradeRepository.updateTradeStatus(tradeId, TradeStatus.REJECTED);
  return updateTrade;
}

async function approveTradeOffer(tradeId, ownerId) {
  try {
    const trade = await tradeRepository.findTradeById(tradeId);

    if (!trade) {
      throw new NotFoundException('해당 교환 요청을 찾을 수 없습니다.');
    }

    if (trade.ownerId !== ownerId) {
      throw new ForbiddenException('이 교환 요청을 취소할 권한이 없습니다.');
    }

    if (trade.status !== TradeStatus.PENDING) {
      throw new ForbiddenException(`현재 상태(${trade.status})에서는 취소할 수 없습니다.`);
    }

    const completedTrade = await tradeRepository.approveTradeTransaction(tradeId, trade.saleId);
    return completedTrade;
  } catch (error) {
    console.error('Trade Transaction Failed:', error);
    throw error;
  }
}

const tradeService = {
  requestTradeCard,
  cancelTradeOffer,
  rejectTradeOffer,
  approveTradeOffer,
};

export default tradeService;
