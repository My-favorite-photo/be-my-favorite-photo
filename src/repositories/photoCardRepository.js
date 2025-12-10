import { prisma } from '../configs/prismaClient.js';

const photoCardRepository = {
  createPhotoCard(cardData) {
    return prisma.photoCard.create({
      data: cardData,
    });
  },

  findPhotoCards(filters) {
    const { keyword, grade, genre, sort } = filters;
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

    let orderBy = { createdAt: 'desc' };
    if (sort === 'low') orderBy = { price: 'asc' };
    if (sort === 'high') orderBy = { price: 'desc' };
    if (sort === 'latest') orderBy = { createdAt: 'desc' };

    return prisma.photoCard.findMany({
      where,
      orderBy,
      include: {
        creator: { select: { nickname: true } }, // creator(User) nickname 포함
        userCards: { select: { status: true, totalQuantity: true } }, // userCards(UserCard) status 포함
      },
    });
  },

  findPhotoCardById(id) {
    return prisma.photoCard.findUnique({
      where: { id },
      include: {
        creator: { select: { nickname: true } },
        userCards: { select: { totalQuantity: true } },
      },
    });
  },
};

// console.log(await prisma.photoCard.findMany({ include: { creator: true, userCards: true } }));
export default photoCardRepository;
