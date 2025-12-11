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

    /**
     * 단일 선택 & 다중 선택
     *
     * grade 값이 배열이면 그대로 사용 ['COMMON','RARE']
     * grade 값이 문자열이면 배열로 만들기 "COMMON,RARE" → ["COMMON","RARE"]
     * grade 배열이 비어있지 않으면 Prisma 조건으로 설정
     * 배열 안의 값과 일치하는 데이터를 조회
     */

    if (grade) {
      let gradeArray = [];
      if (Array.isArray(grade)) {
        gradeArray = grade;
      } else if (typeof grade === 'string') {
        gradeArray = grade.split(',');
      }
      if (gradeArray.length > 0) {
        where.grade = { in: gradeArray };
      }
    }

    if (genre) {
      let genreArray = [];
      if (Array.isArray(genre)) {
        genreArray = genre;
      } else if (typeof genre === 'string') {
        genreArray = genre.split(',');
      }
      if (genreArray.length > 0) {
        where.genre = { in: genreArray };
      }
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'low') orderBy = { price: 'asc' };
    if (sort === 'high') orderBy = { price: 'desc' };
    if (sort === 'latest') orderBy = { createdAt: 'desc' };

    return prisma.photoCard.findMany({
      where,
      orderBy,
      include: {
        creator: { select: { nickname: true } },
        userCards: { select: { status: true, totalQuantity: true } },
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

  findUserCards(userId) {
    return prisma.userCard.findMany({
      where: { userId },
      include: {
        photoCard: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  findUserCardDetail(userId, userCardId) {
    return prisma.userCard.findUnique({
      where: {
        id: userCardId,
        userId: userId,
      },
      include: {
        user: true,
        photoCard: true,
      },
    });
  },
};

// console.log(await prisma.photoCard.findMany({ include: { creator: true, userCards: true } }));
export default photoCardRepository;
