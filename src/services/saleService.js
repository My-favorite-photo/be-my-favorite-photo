import { BadRequestException } from '../common/exceptions/badRequestException.js';
import { NotFoundException } from '../common/exceptions/notFoundException.js';
import { prisma } from '../configs/prismaClient.js';
import saleRepository from '../repositories/saleRepository.js';
// 나의 판매 포토카드 - 유저 판매 카드 중 판매상태인 카드 목록 조회
async function registerSale(sellerId, saleData) {
  const { userCardId, quantity, price, description, grade, genre } = saleData;

  return prisma.$transaction(async (tx) => {
    console.log('Seller ID:', sellerId);
    console.log('PhotoCard ID (from request):', userCardId);
    const userCard = await saleRepository.findUserCard(sellerId, userCardId, tx);

    if (!userCard) {
      throw new NotFoundException('해당 판매자에게 등록된 카드가 없거나 접근 권한이 없습니다.');
    }
    if (userCard.totalQuantity < quantity) {
      throw new BadRequestException(`판매 가능 수량(${userCard.totalQuantity}장)을 초과했습니다.`);
    }

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

    return newSale;
  });
}

const saleService = {
  registerSale,
};

export default saleService;
