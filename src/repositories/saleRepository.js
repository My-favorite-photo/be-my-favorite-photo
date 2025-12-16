import { prisma } from '../configs/prismaClient.js';
import { CardStatus, SaleStatus } from '../generated/enums.ts';

const saleRepository = {
  /**
   * 특정 판매자의 UserCard를 조회합니다.
   * @param {string} sellerId - 판매자 ID
   * @param {string} userCardId - 포토카드 ID
   * @param {object} tx - saleService에서 받은 트렌젝션 컨텍스트
   * @returns {Promise<object | null>} UserCard 객체
   */
  findUserCard(sellerId, userCardId, tx = prisma) {
    return tx.userCard.findFirst({
      where: {
        userId: sellerId,
        id: userCardId,
      },
    });
  },

  /**
   * UserCard의 수량을 감소시키고 상태를 업데이트합니다.
   * @param {string} userCardId - UserCard의 ID
   * @param {number} newQuantity - 업데이트할 새로운 totalQuantity
   * @param {object} tx - saleService에서 받은 트렌젝션 컨텍스트
   * @returns {Promise<object>} 업데이트된 UserCard 객체
   */
  updateUserCardQuantity(userCardId, newQuantity, tx = prisma) {
    return tx.userCard.update({
      where: { id: userCardId },
      data: {
        totalQuantity: newQuantity,
        // 등록된 카드가 남아 있다면 OWNED를 유지하거나, 요구사항에 따라 ON_SALE로 변경 가능
        status: CardStatus.ON_SALE,
      },
    });
  },

  /**
   * Sale 테이블에 새 판매 항목을 생성합니다.
   * @param {object} data - 판매 등록 데이터
   * @param {object} tx - saleService에서 받은 트렌젝션 컨텍스트
a 트랜잭션 클라이언트
   * @returns {Promise<object>} 생성된 Sale 객체
   */
  createSale(data, tx = prisma) {
    return tx.sale.create({
      data: {
        ...data,
        status: SaleStatus.ON_SALE, // Sale 테이블 상태를 ON_SALE로 설정
      },
    });
  },

  findActiveSale(sellerId, userCardId, tx = prisma) {
    return tx.sale.findFirst({
      where: {
        sellerId: sellerId,
        userCardId: userCardId,
        status: SaleStatus.ON_SALE, // ON_SALE 상태인 레코드만 확인해줍시다.
      },
    });
  },

  /**
   * Sale Id 기준으로 활성화된 Sale 정보를 찾는다.
   * @param {String} saleId  - 찾고자 하는 Sale 레코드의 고유 ID
   */
  findActiveSaleBySaleId(saleId, tx = prisma) {
    return tx.sale.findFirst({
      where: {
        id: saleId,
        status: SaleStatus.ON_SALE,
      },
    });
  },

  findSaleByPhotoCardId(photoCardId) {
    return prisma.sale.findFirst({
      where: {
        status: 'ON_SALE',
        userCard: {
          photoCardId: photoCardId,
        },
      },
      include: {
        userCard: {
          include: {
            photoCard: {
              include: {
                creator: { select: { nickname: true } },
                userCards: { select: { totalQuantity: true } },
              },
            },
          },
        },
      },
    });
  },
};

export default saleRepository;
