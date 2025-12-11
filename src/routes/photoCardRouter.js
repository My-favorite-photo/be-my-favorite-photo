import express from 'express';

import { getCardDetail, getMarketplaceCards } from '../controller/photoCardController.js';
import auth from '../middlewares/auth.js';
import { upload } from '../middlewares/multer.js';
import photoCardService from '../services/photoCardService.js';

const photoCardRouter = express.Router();

//유저카드 조회
photoCardRouter.get('/my', auth.verifyAccessToken, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const cards = await photoCardService.getMyCards(userId);

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

    const card = await photoCardService.getMyCardDetail(userId, userCardId);

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
      const imageUrl = req.file.path;
      const creatorId = req.user.id;
      const rawGrade = req.body.grade.toUpperCase();
      const rawGenre = req.body.genre.toUpperCase();
      const rawTotalQuantity = req.body.totalQuantity;
      const totalQuantity = Number(rawTotalQuantity);
      const price = Number(req.body.price);
      const cardData = {
        ...req.body,
        imageUrl: imageUrl,
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

// 전체 카드 도감 조회
// 마켓플레이스에서 모든 카드 목록을 보여줍니다.
// photoCardRouter.get('/', async (req, res, next) => {
//   try {
//     const filters = req.query;
//     const cards = await photoCardService.getMarketplaceCards(filters);
//     res.status(200).json({
//       success: true,
//       message: '성공적으로 마켓플레이스 데이터를 불러왔습니다.',
//       cards,
//     });
//   } catch (error) {
//     next(error);
//   }
// });
photoCardRouter.get('/', getMarketplaceCards);

// 카드 상세 정보 조회
// Marketplace 에서 특정 카드를 클릭했을 때 상세 정보 페이지
// photoCardRouter.get('/:photoCardId', async (req, res, next) => {
//   try {
//     const { photoCardId } = req.params;

//     const cardDetail = await photoCardService.getCardDetail(photoCardId);
//     res.status(200).json({
//       success: true,
//       message: '마켓플레이스 상세 데이터를 불러왔습니다.',
//       cardDetail,
//     });
//   } catch (error) {
//     next(error);
//   }
// });
photoCardRouter.get('/:photoCardId', getCardDetail);

export default photoCardRouter;
