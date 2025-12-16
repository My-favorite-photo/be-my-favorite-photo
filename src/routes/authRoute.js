/**
 * 컨벤션 규칙 예시
 * route: auth.route.js (라우터와 컨트롤러 통합운용)
 * service:  auth.service.js
 * repositories: auth.repositories
 * 요구사항정의는 route  -> repo순
 */

//export const authRouter  = express.Router()

//authRouter("/", ...some middleware... , authService.signOut)

import express from 'express';

import authMiddleware from '../middlewares/auth.js';
import authRepository from '../repositories/authRepository.js';
import authService from '../services/authService.js';

const authRouter = express.Router();

/**
 * @swagger
 * /auth/signup:
 *    post:
 *        $ref: '../swaggerDocs/auth/signup.yaml'
 */
authRouter.post('/signup', async (req, res, next) => {
  try {
    const { email, password, nickname } = req.body;

    if (!email || !password || !nickname) {
      const error = new Error('email, password, nickname 은 모두 필요해요!');
      error.code = 400;
      throw error;
    }
    const user = await authService.createSignup({ email, password, nickname });
    res.status(201).json({ user, message: '회원가입 성공' });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const error = new Error('email, password 가 모두필요합니다.');
      error.code = 400;
      throw error;
    }

    const user = await authService.getUser(email, password);

    const accessToken = authService.createToken(user);
    const refreshToken = authService.createToken(user, 'refresh');
    await authService.updateUser(user.id, { refreshToken });
    res.json({
      user,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: '요청 본문이 없습니다.' });
    }
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        message: 'Refresh token 이 필요합니다.',
      });
    }
    const tokens = await authService.refreshToken(refreshToken);
    return res.json({
      accessToken: tokens.newAccessToken,
      refreshToken: tokens.newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', authMiddleware.verifyAccessToken, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await authService.getMe(userId);

    return res.json({
      user,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout', authMiddleware.verifyAccessToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    await authRepository.updateUser(userId, { refreshToken: null });
    return res.json({
      nickname: req.user.nickname,
      message: '로그아웃 성공',
    });
  } catch (error) {
    next(error);
  }
});

export default authRouter;
