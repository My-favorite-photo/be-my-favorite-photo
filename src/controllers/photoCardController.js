import { NotFoundException } from '../common/exceptions/notFoundException.js';
import photoCardService from '../services/photoCardService.js';

// 전체 카드 조회
export async function getMarketplaceCards(req, res, next) {
  try {
    const { keyword, grade, genre, sort } = req.query;

    const cards = await photoCardService.getMarketplaceCards({ keyword, grade, genre, sort });

    res.status(200).json({
      success: true,
      message: '전체 데이터 불러오기 성공',
      cards,
    });
  } catch (error) {
    next(error);
  }
}

// 상세 카드 조회
export async function getCardDetail(req, res, next) {
  try {
    const { photoCardId } = req.params;
    const card = await photoCardService.getCardDetail(photoCardId);

    res.status(200).json({
      success: true,
      message: '상세 데이터 불러오기 성공',
      card,
    });
  } catch (error) {
    if (error instanceof NotFoundException) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
}
