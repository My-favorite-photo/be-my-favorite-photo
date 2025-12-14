import express from 'express';

import auth from '../middlewares/auth.js';
import sellMyPhotoCardService from '../services/sellMyPhotoService.js';

const sellMyPhotoRouter = express.Router();

sellMyPhotoRouter.get('/', auth.verifyAccessToken, async (req, res, next) => {
  try {
    // const { userId } = req.user;
    const userId = req.user.id;
    const filter = req.query;
    const cards = await sellMyPhotoCardService.getMarketplaceCards(userId, filter);

    res.status(200).json({
      success: true,
      message: '성공적으로 나의 판매포토카드를  불러왔습니다.',
      cards,
    });
  } catch (error) {
    next(error);
  }
});

export default sellMyPhotoRouter;
