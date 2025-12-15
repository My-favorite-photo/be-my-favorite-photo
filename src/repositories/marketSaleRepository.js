import { prisma } from '../configs/prismaClient.js';

const marketSaleRepository = {
  findSales(filters) {
    const { keyword, grade, genre, sort, status } = filters;
    const where = {};

    if (keyword) {
      where.userCard = {
        photoCard: {
          name: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
      };
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

    // 매진 여부
    if (status) {
      // 판매 중
      if (status === 'ON_SALE' || status === 'CANCELLED') {
        where.status = { in: ['ON_SALE', 'CANCELLED'] };
      }

      // 판매 완료
      if (status === 'SOLD_OUT') {
        where.status = { in: ['SOLD_OUT'] };
      }
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'low') orderBy = { price: 'asc' };
    if (sort === 'high') orderBy = { price: 'desc' };
    if (sort === 'latest') orderBy = { createdAt: 'desc' };

    return prisma.sale.findMany({
      where,
      orderBy,
      include: {
        seller: { select: { nickname: true } },
        userCard: {
          include: { photoCard: true },
        },
      },
    });
  },

  findSaleById(id) {
    return prisma.sale.findUnique({
      where: { id },
      include: {
        seller: { select: { nickname: true } },
        userCard: {
          include: {
            photoCard: true,
          },
        },
      },
    });
  },
};

export default marketSaleRepository;
