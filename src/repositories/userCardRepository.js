import { prisma } from '../configs/prismaClient.js';

const userCardRepository = {
  findUserCards(userId, filters) {
    const { keyword, grade, genre } = filters;

    const where = {
      userId: userId,
      photoCard: {},
    };

    if (keyword) {
      where.photoCard.name = { contains: keyword, mode: 'insensitive' };
    }

    if (grade) {
      let gradeArray = [];
      if (Array.isArray(grade)) {
        gradeArray = grade;
      } else if (typeof grade === 'string') {
        gradeArray = grade.split(',');
      }
      if (gradeArray.length > 0) {
        where.photoCard.grade = { in: gradeArray };
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
        where.photoCard.genre = { in: genreArray };
      }
    }

    return prisma.userCard.findMany({
      where,
      include: {
        user: {
          select: { nickname: true },
        },
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
        photoCard: true,
      },
    });
  },

  updateCardStatus(userCardId, status, tx = prisma) {
    return tx.userCard.update({
      where: { id: userCardId },
      data: { status: status },
    });
  },
};

export default userCardRepository;
