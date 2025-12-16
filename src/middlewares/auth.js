import jwt from 'jsonwebtoken';

import authRepository from '../repositories/authRepository.js';

function throwUnauthorizedError() {
  const error = new Error('Unauthorized');
  error.code = 401;
  throw error;
}

//Access Token 검증
async function verifyAccessToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throwUnauthorizedError();
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await authRepository.findById(payload.userId);
    if (!user) throwUnauthorizedError();

    req.user = {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
    };

    next();
  } catch (error) {
    next(error);
  }
}

//쿠키에 포함된 Refresh Token 을 검증
async function verifyRefreshToken(req, res, next) {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throwUnauthorizedError();
    }

    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET);

    const user = await authRepository.findById(payload.userId);
    if (!user || user.refreshToken !== refreshToken) {
      throwUnauthorizedError();
    }

    req.user = {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
    };

    next();
  } catch (error) {
    next(error);
  }
}

//로그인 회원가입 유효성검사
function validateEmailAndPassword(req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) {
    const error = new Error('email, password 가 모두 필요합니다.');
    error.code = 422;
    throw error;
  }
  next();
}

export default {
  verifyAccessToken,
  verifyRefreshToken,
  validateEmailAndPassword,
};
