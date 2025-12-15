import express from 'express';

import auth from '../middlewares/auth.js';
import purchaseService from '../services/purchaseService.js';

const purchaseRouter = express.Router();
const { verifyAccessToken } = auth;

purchaseRouter.post('/:saleId', verifyAccessToken, async (req, res, next) => {
  console.log('BUYER ID:', req.user.id);
  try {
    const buyerId = req.user.id;
    const saleId = req.params.saleId;
    const quantity = Number(req.body.quantity ?? 1);

    const result = await purchaseService.purchase({
      saleId,
      buyerId,
      quantity,
    });

    res.status(200).json({
      success: true,
      message: '구매완료',
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

export default purchaseRouter;
