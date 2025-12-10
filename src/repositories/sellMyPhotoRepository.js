import { prisma } from '../configs/prismaClient.js';

const sellMyPhotoRepository = {
  findMyPhotoCards(userId, filters) {
    // 추후 판매방법, 매진여부 필터 기능 추가
    // 현재는 디자인시안에 검색, 등급, 장르 만있음
    const { keyword, grade, genre } = filters;
    const where = {
      userId: userId,
      status: 'ON_SALE',
    };

    if (keyword) {
      where.name = { contains: keyword, mode: 'insensitive' };
    }
    if (grade) {
      where.grade = grade;
    }
    if (genre) {
      where.genre = genre;
    }

    where.status = 'ON_SALE';

    return prisma.userCard.findMany({
      where,
      include: {
        photoCard: true,
      },
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
