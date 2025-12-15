import express from 'express';
import marketSaleService from '../services/marketSaleService.js';

const marketRouter = express.Router();

// 전체 카드 조회
marketRouter.get('/', async (req, res, next) => {
  try {
    const { keyword, grade, genre, status, sort } = req.query;

    const cards = await marketSaleService.getSalesCards({ keyword, grade, genre, status, sort });

    res.status(200).json({
      success: true,
      message: '전체 데이터 불러오기 성공',
      cards,
    });
  } catch (error) {
    next(error);
  }
});

// 상세 카드 조회
marketRouter.get('/:saleCardId', async (req, res, next) => {
  try {
    const { saleCardId } = req.params;

    const cardDetail = await marketSaleService.getSaleDetail(saleCardId);

    res.status(200).json({
      success: true,
      message: '상세 데이터 불러오기 성공',
      cardDetail,
    });
  } catch (error) {
    next(error);
  }
});

export default marketRouter;
