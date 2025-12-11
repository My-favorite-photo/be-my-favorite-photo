import { NotFoundException } from '../common/exceptions/notFoundException.js';
import userCardRepository from '../repositories/userCardRepository.js';

// 마이갤러리 - 유저카드
async function getMyCards(userId, filters) {
  return userCardRepository.findUserCards(userId, filters);
}

// 마이갤러리 - 유저카드 상세조회
async function getMyCardDetail(userId, userCardId, filters) {
  const card = await userCardRepository.findUserCardDetail(userId, userCardId, filters);

  if (!card) {
    throw new NotFoundException('해당카드를 찾을수 없습니다!');
  }
  return card;
}

const userCardService = {
  getMyCards,
  getMyCardDetail,
};

export default userCardService;
