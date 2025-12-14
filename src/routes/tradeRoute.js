import express from 'express';

import auth from '../middlewares/auth.js';
import tradeService from '../services/tradeService.js';

const tradeRouter = express.Router();

tradeRouter.post('/', auth.verifyAccessToken, async (req, res, next) => {
  const applicantId = req.user.id;
  const { saleId, offeredUserCardId, description } = req.body;
  const DUMMY_SALE_ID = 'cmj2epnf40005qisb4meyq8lk';

  try {
    const newTrade = await tradeService.requestTradeCard({
      applicantId,
      saleId: DUMMY_SALE_ID,
      offeredUserCardId,
      description,
    });

    res.status(201).json({
      message: '교환 요청이 성공적으로 전송되었습니다.',
      trade: newTrade,
    });
  } catch (error) {
    next(error);
  }
});

tradeRouter.post('/:tradeId/cancel', auth.verifyAccessToken, async (req, res, next) => {
  try {
    const applicantId = req.user.id;
    const { tradeId } = req.params;

    const cancelTrade = await tradeService.cancelTradeOffer(tradeId, applicantId);

    res.status(200).json({
      success: true,
      message: '교환 요청이 성공적으로 취소되었습니다.',
      trade: cancelTrade,
    });
  } catch (error) {
    next(error);
  }
});

export default tradeRouter;
