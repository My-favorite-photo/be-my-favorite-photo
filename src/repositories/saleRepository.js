import { prisma } from '../configs/prismaClient.js';

const saleRepository = {
  /**
   * 특정 판매자의 UserCard를 조회합니다.
   * @param {string} sellerId - 판매자 ID
   * @param {string} userCardId - 포토카드 ID
   * @param {object} tx - Prisma 트랜잭션 클라이언트
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
   * @param {object} tx - Prisma 트랜잭션 클라이언트
   * @returns {Promise<object>} 업데이트된 UserCard 객체
   */
  updateUserCardQuantity(userCardId, newQuantity, tx = prisma) {
    return tx.userCard.update({
      where: { id: userCardId },
      data: {
        totalQuantity: newQuantity,
        // 등록된 카드가 남아 있다면 OWNED를 유지하거나, 요구사항에 따라 ON_SALE로 변경 가능
        status: 'ON_SALE',
      },
    });
  },

  /**
   * Sale 테이블에 새 판매 항목을 생성합니다.
   * @param {object} data - 판매 등록 데이터
   * @param {object} tx - Prisma 트랜잭션 클라이언트
   * @returns {Promise<object>} 생성된 Sale 객체
   */
  createSale(data, tx = prisma) {
    return tx.sale.create({
      data: {
        ...data,
        status: 'ON_SALE', // Sale 테이블 상태를 ON_SALE로 설정
      },
    });
  },
};

export default saleRepository;
