import { NotFoundException } from '../common/exceptions/notFoundException.js';
import marketSaleRepository from '../repositories/marketSaleRepository.js';

// 마켓플레이스 - 전체 카드 목록 조회
async function getSalesCards(filters) {
  return marketSaleRepository.findSales(filters);
}

// 마켓플레이스 - 카드 상세 조회
async function getSaleDetail(saleCardId) {
  const card = await marketSaleRepository.findSaleById(saleCardId);

  if (!card) {
    throw new NotFoundException('카드를 찾을수 없습니다.');
  }

  return card;
}

const marketSaleService = {
  getSalesCards,
  getSaleDetail,
};

export default marketSaleService;
