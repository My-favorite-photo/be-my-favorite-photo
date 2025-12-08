import { prisma } from '../configs/prismaClient.js';

const photoCardRepository = {
  createPhotoCard(cardData) {
    return prisma.photoCard.create({
      data: cardData,
    });
  },

  findPhotoCards(filters) {
    const { keyword, grade, genre } = filters;
    const where = {};

    if (keyword) {
      where.name = { contains: keyword, mode: 'insensitive' };
    }
    if (grade) {
      where.grade = grade;
    }
    if (genre) {
      where.genre = genre;
    }

    return prisma.photoCard.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  },

  findPhotoCardById(id) {
    return prisma.photoCard.findUnique({
      where: { id },
      include: { creator: { select: { nickname: true } } }, // 발행자 정보를 포함한다.
    });
  },
};

export default photoCardRepository;
