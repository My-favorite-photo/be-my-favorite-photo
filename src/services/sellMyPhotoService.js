import sellMyPhotoRepository from '../repositories/sellMyPhotoRepository.js';
// 나의 판매 포토카드 - 유저 판매 카드 중 판매상태인 카드 목록 조회
async function getMarketplaceCards(userId, filters) {
  return sellMyPhotoRepository.findMyPhotoCards(userId, filters);
}

const sellMyPhotoCardService = {
  getMarketplaceCards,
};

export default sellMyPhotoCardService;
