import { prisma } from '../configs/prismaClient.js';

const sellMyPhotoRepository = {
  findMyPhotoCards(userId, filters) {
    // 추후 판매방법, 매진여부 필터 기능 추가
    // 현재는 디자인시안에 검색, 등급, 장르 만있음
    const { keyword, grade, genre } = filters;

    const where = {
      userId: userId,
      status: { in: ['ON_SALE', 'TRADING'] },
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
      include: { photoCard: true },
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

export default sellMyPhotoRepository;
