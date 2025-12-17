import express from 'express';

import auth from '../middlewares/auth.js';
import saleService from '../services/saleService.js';

const saleRouter = express.Router();

saleRouter.post('/', auth.verifyAccessToken, async (req, res, next) => {
  const sellerId = req.user.id;
  const { userCardId, quantity, price, description, grade, genre } = req.body;

  if (
    !userCardId ||
    !quantity ||
    !price ||
    !grade ||
    !genre ||
    Number(quantity) <= 0 ||
    Number(price) < 0
  ) {
    return res.status(400).json({ message: '필수 입력  항목이 누락되었거나 유효하지 않습니다.' });
  }

  const saleData = {
    userCardId,
    quantity: Number(quantity),
    price: Number(price),
    description,
    grade,
    genre,
  };
  try {
    const newSale = await saleService.registerSale(sellerId, saleData);

    return res.status(201).json({
      message: '판매 등록이 완료되었습니다.',
      sale: newSale,
    });
  } catch (error) {
    console.error('판매 등록 오류: ', error.message);

    if (error.message.includes('초과했습니다') || error.message.includes('없습니다')) {
      return res.status(400).json({ message: error.message });
    }

    next(error);
  }
});

saleRouter.post('/:saleId/close', auth.verifyAccessToken, async (req, res, next) => {
  try {
    const { saleId } = req.params;
    const sellerId = req.user.id;

    const result = await saleService.closeSale(saleId, sellerId);

    res.status(200).json({
      success: true,
      message: '판매가 종료되었습니다.',
      result,
    });
  } catch (error) {
    next(error);
  }
});

saleRouter.patch('/:saleId/update', auth.verifyAccessToken, async (req, res, next) => {
  try {
    const { saleId } = req.params;
    const sellerId = req.user.id;
    const updateData = req.body;

    const updatedSale = await saleService.updateSale(saleId, sellerId, updateData);

    res.status(200).json({
      success: true,
      message: '판매 정보가 수정되었습니다.',
      updatedSale,
    });
  } catch (error) {
    next(error);
  }
});
export default saleRouter;
