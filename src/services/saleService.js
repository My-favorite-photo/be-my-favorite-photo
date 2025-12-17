import { BadRequestException } from '../common/exceptions/badRequestException.js';
import { ConflictException } from '../common/exceptions/conflictException.js';
import { ForbiddenException } from '../common/exceptions/forbiddenException.js';
import { NotFoundException } from '../common/exceptions/notFoundException.js';
import { UnAuthorizedException } from '../common/exceptions/unAuthorizedException.js';
import { prisma } from '../configs/prismaClient.js';
import { CardStatus, SaleStatus } from '../generated/enums.ts';
import saleRepository from '../repositories/saleRepository.js';

async function registerSale(sellerId, saleData) {
  const { userCardId, quantity, price, description, grade, genre } = saleData;

  if (quantity <= 0) {
    throw new BadRequestException('판매 수량은 1장 이상이어야 합니다.');
  }

  return prisma.$transaction(async (tx) => {
    const userCard = await saleRepository.findUserCard(sellerId, userCardId, tx);

    if (!userCard) {
      throw new NotFoundException('해당 판매자에게 등록된 카드가 없거나 접근 권한이 없습니다.');
    }

    if (userCard.status !== CardStatus.OWNED) {
      throw new BadRequestException('해당 카드는 현재 판매 가능한 상태(OWNED)가 아닙니다.');
    }

    if (userCard.totalQuantity < quantity) {
      throw new BadRequestException(`판매 가능 수량(${userCard.totalQuantity}장)을 초과했습니다.`);
    }

    // 중복 판매 등록 여부를 조사하자
    const existingSale = await saleRepository.findActiveSale(sellerId, userCardId, tx);
    if (existingSale) {
      throw new BadRequestException(
        '이미 해당 카드(UserCard)에 대한 판매가 등록 되어있는 상태입니다.  기존 판매를 취소하거나 수정 후 다시 시도해주시기 바랍니다.',
      );
    }

    // 검사완료후 차감액션
    const newQuantity = userCard.totalQuantity - quantity; // 등록된 수만큼 userCard의 totalQuantity가 줄어들게한다.
    await saleRepository.updateUserCardQuantity(userCard.id, newQuantity, tx);

    const newSale = await saleRepository.createSale(
      {
        userCardId: userCardId,
        sellerId: sellerId,
        quantity: quantity,
        remainingQuantity: quantity,
        price: price,
        description: description,
        grade: grade,
        genre: genre,
      },
      tx,
    );

    //세일 히스토리 생성
    await tx.saleHistory.create({
      data: {
        saleId: newSale.id,
        userCardId: userCard.id,
        quantity: quantity,
      },
    });

    if (newQuantity === 0) {
      await tx.userCard.update({
        where: { id: userCard.id },
        data: { status: CardStatus.ON_SALE },
      });
    }

    return newSale;
  });
}

async function closeSale(saleId, sellerId) {
  const sale = await saleRepository.findActiveSaleBySaleId(saleId);
  if (!sale) {
    throw new NotFoundException('존재하지 않는 판매글입니다.');
  }

  if (sale.sellerId !== sellerId) {
    throw new ForbiddenException('판매 종료 권한이 없습니다.');
  }

  if (sale.status === SaleStatus.CANCELLED) {
    throw new ConflictException('이미 종료된 판매 입니다.');
  }

  console.log('Sale', sale);
  return await saleRepository.cancelAndRestoreStock(
    saleId,
    sellerId,
    sale.userCardId,
    sale.quantity,
  );
}

async function updateSale(saleId, sellerId, updateData) {
  const sale = await saleRepository.findActiveSaleBySaleId(saleId);
  if (!sale) throw new NotFoundException('존재하지 않는 판매글입니다.');

  if (sale.sellerId !== sellerId) {
    throw new UnAuthorizedException('수정 권한이 없습니다.');
  }

  let quantityDiff = 0;
  let newRemainingQuantity = undefined;

  if (updateData.quantity != undefined) {
    const soldQuantity = sale.quantity - sale.remainingQuantity;
    if (updateData.quantity < soldQuantity) {
      throw new BadRequestException(
        `이미 ${soldQuantity}장이 판매되어 그 이하로 수량을 줄일 수 없습니다.`,
      );
    }
    // 차이 계산: 기존 4장 -> 수정 1장 일 경우 diff는 3 (3장을 인벤토리로 환원)
    quantityDiff = sale.quantity - updateData.quantity;
    // 새남은 수량 = 새 전체 수량 - 이미 팔린 수량
    newRemainingQuantity = updateData.quantity - soldQuantity;
  }

  const data = {
    price: updateData.price,
    quantity: updateData.quantity,
    remainingQuantity: newRemainingQuantity,
    description: updateData.description,
    grade: updateData.grade,
    genre: updateData.genre,
  };

  return await saleRepository.updateWithStockRecovery(saleId, sale.userCardId, data, quantityDiff);
}

const saleService = {
  registerSale,
  closeSale,
  updateSale,
};

export default saleService;
