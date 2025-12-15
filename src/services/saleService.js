import { BadRequestException } from '../common/exceptions/badRequestException.js';
import { NotFoundException } from '../common/exceptions/notFoundException.js';
import { prisma } from '../configs/prismaClient.js';
import saleRepository from '../repositories/saleRepository.js';

async function registerSale(sellerId, saleData) {
  const { userCardId, quantity, price, description, grade, genre } = saleData;

  return prisma.$transaction(async (tx) => {
    const userCard = await saleRepository.findUserCard(sellerId, userCardId, tx);

    if (!userCard) {
      throw new NotFoundException('해당 판매자에게 등록된 카드가 없거나 접근 권한이 없습니다.');
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

    //실제 판매에 사용할 카드(유저카드) 확보
    const saleUserCards = await tx.userCard.findMany({
      where: {
        userId: sellerId,
        photoCardId: userCard.photoCardId,
        status: 'OWNED',
      },
      take: quantity,
    });

    if (saleUserCards.length !== quantity) {
      throw new BadRequestException('판매 가능한 카드 수량이 부족합니다.');
    }

    // 검사완료후 차감액션
    const newQuantity = userCard.totalQuantity - quantity;

    // 등록된 수만큼 userCard의 totalQuantity가 줄어들게한다.
    await saleRepository.updateUserCardQuantity(userCard.id, newQuantity, tx);

    const newSale = await saleRepository.createSale(
      {
        userCardId: userCardId,
        sellerId: sellerId,
        quantity: quantity,
        price: price,
        description: description,
        grade: grade,
        genre: genre,
      },
      tx,
    );

    //세일 히스토리 생성
    await tx.saleHistory.createMany({
      data: saleUserCards.map((card) => ({
        saleId: newSale.id,
        userCardId: card.id,
      })),
    });

    //판매 중인 카드 상태 변경
    await tx.userCard.updateMany({
      where: {
        id: { in: saleUserCards.map((c) => c.id) },
      },
      data: {
        status: 'ON_SALE',
      },
    });

    return newSale;
  });
}

const saleService = {
  registerSale,
};

export default saleService;
