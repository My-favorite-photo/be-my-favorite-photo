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
    const refreshToken = authService.createToken(user);
    await authService.updateUser(user.id, { refreshToken });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
    });
    res.json({ ...user, accessToken });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      const error = new Error('Refresh token 이 필요합니다.');
      error.code = 401;
      throw error;
    }

    const { newAccessToken, newRefreshToken } = await authService.refreshToken(refreshToken);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
    });

    return res.json({ accessToken: newAccessToken });
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', authMiddleware.verifyAccessToken, async (req, res) => {
  return res.json({
    user: req.user,
  });
});

authRouter.post('/logout', authMiddleware.verifyAccessToken, async (req, res, next) => {
  try {
    const userId = req.user.id;

    await authRepository.updateUser(userId, { refreshToken: null });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
    });

    return res.json({ nickname: req.user.nickname, message: '로그아웃 성공' });
  } catch (error) {
    next(error);
  }
});

export default authRouter;
