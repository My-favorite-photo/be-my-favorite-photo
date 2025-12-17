import express from 'express';

import { getCardDetail, getMarketplaceCards } from '../controllers/photoCardController.js';
import auth from '../middlewares/auth.js';
import { upload } from '../middlewares/multer.js';
import photoCardService from '../services/photoCardService.js';
import userCardService from '../services/userCardService.js';

const photoCardRouter = express.Router();

//유저 카드 조회
photoCardRouter.get('/my', auth.verifyAccessToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const filter = req.query;
    const cards = await userCardService.getMyCards(userId, filter);

    return res.status(200).json({
      success: true,
      message: '갤러리를 불러왔습니다!',
      cards,
    });
  } catch (error) {
    next(error);
  }
});

//유저카드 상세 조회
photoCardRouter.get('/my/:userCardId', auth.verifyAccessToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { userCardId } = req.params;

    const card = await userCardService.getMyCardDetail(userId, userCardId);

    return res.status(200).json({
      success: true,
      message: '카드 상세정보를 불러왔습니다!',
      card,
    });
  } catch (error) {
    next(error);
  }
});

// 내 포토카드 판매하기
// 카드 생성 (발행)
photoCardRouter.post(
  '/',
  auth.verifyAccessToken,
  upload.single('uploads'),
  async (req, res, next) => {
    console.log('start');
    try {
      const imageUrl = req.file.key;
      const publicImageUrl = `${process.env.CLOUD_FLARE_R2_PUBLIC_API}/${imageUrl}`;
      console.log(publicImageUrl);
      const creatorId = req.user.id;
      const rawGrade = req.body.grade.toUpperCase();
      const rawGenre = req.body.genre.toUpperCase();
      const rawTotalQuantity = req.body.totalQuantity;
      const totalQuantity = Number(rawTotalQuantity);
      const price = Number(req.body.price);
      const cardData = {
        ...req.body,
        imageUrl: publicImageUrl,
        grade: rawGrade,
        genre: rawGenre,
        totalQuantity: totalQuantity,
        price,
      };

      // if (!cardData) {
      //   console.error('카드데이터가 없습니다.');
      // }

      console.log('Final cardData:', cardData);

      const result = await photoCardService.createNewCard(creatorId, cardData);
      res.status(201).json({
        success: true,
        message: '새로운 카드가 성공적으로 발행되었습니다. 나의 갤러리에 추가되었습니다.',
        result,
      });
    } catch (error) {
      next(error);
    }
  },
);

// 포토카드 전체 조회
photoCardRouter.get('/', getMarketplaceCards);

//  포토카드 상세 조회
photoCardRouter.get('/:photoCardId', getCardDetail);

export default photoCardRouter;
