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

tradeRouter.post('/:tradeId/reject', auth.verifyAccessToken, async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { tradeId } = req.params;

    const rejectTrade = await tradeService.rejectTradeOffer(tradeId, ownerId);

    res.status(200).json({
      success: true,
      message: '교환 요청을 성공적으로 거절하였습니다.',
      trade: rejectTrade,
    });
  } catch (error) {
    next(error);
  }
});

tradeRouter.post('/:tradeId/approve', auth.verifyAccessToken, async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { tradeId } = req.params;

    const approvedtTrade = await tradeService.approveTradeOffer(tradeId, ownerId);

    res.status(200).json({
      success: true,
      message: '교환 요청을 성공적으로 승인하고 거래를 완료하였습니다.',
      trade: approvedtTrade,
    });
  } catch (error) {
    next(error);
  }
});

export default tradeRouter;
