import { NotFoundException } from '../common/exceptions/notFoundException.js';
import { prisma } from '../configs/prismaClient.js';
import photoCardRepository from '../repositories/photoCardRepository.js';

// 새 카드 생성
async function createNewCard(creatorId, data) {
  return prisma.$transaction(async (tx) => {
    // PhotoCard 원본/도안 생성
    const newPhotoCard = await tx.photoCard.create({
      data: {
        creatorId: creatorId,
        name: data.name,
        imageUrl: data.imageUrl,
        grade: data.grade,
        genre: data.genre,
        price: data.price,
        totalQuantity: data.totalQuantity,
        description: data.description,
      },
    });

    // UserCard (실물) 생성 및 작성자에게 소유권 부여
    // 발행된 카드의 첫 번째 실물은 발행자 소유
    const newUserCard = await tx.userCard.create({
      data: {
        userId: creatorId,
        photoCardId: newPhotoCard.id,
        status: 'OWNED',
        price: data.price,
        totalQuantity: data.totalQuantity,
      },
    });

    return {
      photoCard: newPhotoCard,
      firstUserCard: newUserCard,
    };
  });
}

// 마켓플레이스 - 전체 카드 도감 목록 조회
async function getMarketplaceCards(filters) {
  return photoCardRepository.findPhotoCards(filters);
}

// 마켓플레이스 - 카드 상세 조회
async function getCardDetail(photoCardId) {
  const card = await photoCardRepository.findPhotoCardById(photoCardId);

  if (!card) {
    throw new NotFoundException('카드를 찾을수 없습니다.');
  }

  return card;
}

const photoCardService = {
  createNewCard,
  getMarketplaceCards,
  getCardDetail,
};

export default photoCardService;
