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
    const userId = req.user.id;

    const cardDetail = await photoCardService.getCardDetail(photoCardId, userId);

    res.status(200).json({
      success: true,
      message: '상세 데이터 불러오기 성공',
      cardDetail,
    });
  } catch (error) {
    next(error);
  }
}
