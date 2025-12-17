
import { BadRequestException } from '../common/exceptions/badRequestException.js';
import { ForbiddenException } from '../common/exceptions/forbiddenException.js';
import { NotFoundException } from '../common/exceptions/notFoundException.js';
import { prisma } from '../configs/prismaClient.js';
import { CardStatus, TradeItemType, TradeStatus } from '../generated/enums.ts';
import saleRepository from '../repositories/saleRepository.js';
import tradeRepository from '../repositories/tradeRepository.js';
import userCardRepository from '../repositories/userCardRepository.js';
import notificationRepository from '../repositories/notificationRepository.js';

// 구매자 교환 요청
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
        applicantId,
        ownerId: targetSale.sellerId,
        saleId,
        description,
        userCardId: targetSale.userCardId,
      },
      tx,
    );

    const tradeId = newTrade.id;

    // history에 기록
    await tradeRepository.addTradeItem(tradeId, offeredUserCardId, TradeItemType.OFFERED, tx);
    await tradeRepository.addTradeItem(tradeId, targetSale.userCardId, TradeItemType.TARGET, tx);

    await userCardRepository.updateCardStatus(offeredUserCardId, CardStatus.TRADING, tx);

    // 알림 생성
    const applicant = await tx.user.findUnique({
      where: { id: applicantId },
      select: { nickname: true },
    });

    const saleCard = await tx.userCard.findUnique({
      where: { id: targetSale.userCardId },
      include: { photoCard: true },
    });

    await notificationRepository.create(
      {
        userId: targetSale.sellerId,
        content: `${applicant.nickname}님이 [${saleCard.photoCard.grade} | ${saleCard.photoCard.name}] 포토카드 교환을 제안했습니다.`,
      },
      tx,
    );

    return newTrade;
  });
}

async function cancelTradeOffer(tradeId, applicantId) {
  const trade = await tradeRepository.findTradeById(tradeId);

  if (!trade) throw new NotFoundException('해당 교환 요청을 찾을 수 없습니다.');
  if (trade.applicantId !== applicantId) throw new ForbiddenException('취소 권한이 없습니다.');
  if (trade.status !== TradeStatus.PENDING)
    throw new ForbiddenException(`현재 상태(${trade.status})에서는 취소할 수 없습니다.`);

  return prisma.$transaction(async (tx) => {
    const tradeWithHistory = await tx.trade.findUnique({
      where: { id: tradeId },
      include: { tradeHistories: { where: { type: TradeItemType.OFFERED } } },
    });

    if (tradeWithHistory?.tradeHistories[0]?.userCardId) {
      await userCardRepository.updateCardStatus(
        tradeWithHistory.tradeHistories[0].userCardId,
        CardStatus.OWNED,
        tx,
      );
    }

    const updateTrade = await tradeRepository.updateTradeStatus(tradeId, TradeStatus.CANCELLED);

    // 알림
    const applicant = await tx.user.findUnique({
      where: { id: applicantId },
      select: { nickname: true },
    });
    await notificationRepository.create(
      {
        userId: trade.ownerId,
        content: `${applicant.nickname}님이 교환 요청을 취소했습니다.`,
      },
      tx,
    );

    return updateTrade;
  });
}

async function rejectTradeOffer(tradeId, ownerId) {
  const trade = await tradeRepository.findTradeById(tradeId);

  if (!trade) throw new NotFoundException('해당 교환 요청을 찾을 수 없습니다.');
  if (trade.ownerId !== ownerId) throw new ForbiddenException('거절 권한이 없습니다.');
  if (trade.status !== TradeStatus.PENDING)
    throw new ForbiddenException(`현재 상태(${trade.status})에서는 거절할 수 없습니다.`);

  return prisma.$transaction(async (tx) => {
    const updateTrade = await tradeRepository.updateTradeStatus(tradeId, TradeStatus.REJECTED, tx);

    //  알림
    const tradeDetail = await tx.trade.findUnique({
      where: { id: tradeId },
      include: { applicant: { select: { nickname: true, id: true } } },
    });
    const owner = await tx.user.findUnique({ where: { id: ownerId }, select: { nickname: true } });

    await notificationRepository.create(
      {
        userId: tradeDetail.applicant.id,
        content: `${owner.nickname}님이 교환 요청을 거절했습니다.`,
      },
      tx,
    );

    return updateTrade;
  });
}

async function approveTradeOffer(tradeId, ownerId) {
  const trade = await tradeRepository.findTradeById(tradeId);

  if (!trade) throw new NotFoundException('해당 교환 요청을 찾을 수 없습니다.');
  if (trade.ownerId !== ownerId) throw new ForbiddenException('승인 권한이 없습니다.');
  if (trade.status !== TradeStatus.PENDING)
    throw new ForbiddenException(`현재 상태(${trade.status})에서는 승인할 수 없습니다.`);

  return prisma.$transaction(async (tx) => {
    const completedTrade = await tradeRepository.approveTradeTransaction(tradeId, trade.saleId);

    // 알림: 교환 성사
    const tradeDetail = await tx.trade.findUnique({
      where: { id: tradeId },
      include: {
        applicant: { select: { id: true, nickname: true } },
        owner: { select: { id: true, nickname: true } },
        sale: { include: { userCard: { include: { photoCard: true } } } },
      },
    });

    const card = tradeDetail.sale.userCard.photoCard;

    await notificationRepository.create(
      {
        userId: tradeDetail.applicant.id,
        content: `${tradeDetail.owner.nickname}님과의 [${card.grade} | ${card.name}] 포토카드 교환이 성사되었습니다.`,
      },
      tx,
    );
    await notificationRepository.create(
      {
        userId: tradeDetail.owner.id,
        content: `${tradeDetail.applicant.nickname}님과의 [${card.grade} | ${card.name}] 포토카드 교환이 성사되었습니다.`,
      },
      tx,
    );

    return completedTrade;
  });
}

const tradeService = {
  requestTradeCard,
  cancelTradeOffer,
  rejectTradeOffer,
  approveTradeOffer,
};

export default tradeService;
