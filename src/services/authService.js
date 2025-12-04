import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import authRepository from '../repositories/authRepository.js';

//회원가입
async function createSignup(user) {
  try {
    const existedUser = await authRepository.findByEmail(user.email);
    if (existedUser) {
      const error = new Error('존재하는 이메일 입니다.');
      error.code = 409;
      error.data = { email: user.email };
      throw error;
    }
    const hashedPassword = await hashPassword(user.password);
    const createdUser = await authRepository.createUser({
      ...user,
      password: hashedPassword,
    });
    return filterSensitiveUserData(createdUser);
  } catch (error) {
    if (error.code === 409) throw error;
    const customError = new Error('데이터베이스 작업 중 오류가 발생했습니다.');
    customError.code = 500;
    throw customError;
  }
}

function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

function filterSensitiveUserData(user) {
  const { password, refreshToken, ...rest } = user;
  return rest;
}

//로그인
async function getUser(email, password) {
  try {
    const user = await authRepository.findByEmail(email);
    if (!user) {
      const error = new Error('존재하지 않는 이메일 입니다.');
      error.code = 401;
      throw error;
    }
    await verifyPassword(password, user.password);
    return filterSensitiveUserData(user);
  } catch (error) {
    if (error.code === 401) throw error;
    const customError = new Error('데이터베이스 작업 중 오류가 발생했습니다.');
    customError.code = 500;
    throw customError;
  }
}

async function verifyPassword(inputPassword, password) {
  const isMatch = await bcrypt.compare(inputPassword, password);
  if (!isMatch) {
    const error = new Error('비밀번호가 일치하지 않습니다.');
    error.code = 401;
    throw error;
  }
}

function createToken(user, type) {
  const payload = { userId: user.id };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: type === 'refresh' ? '1w' : '1h',
  });
  return token;
}

async function updateUser(id, data) {
  const updateUser = await authRepository.updateUser(id, data);
  return filterSensitiveUserData(updateUser);
}
async function refreshToken(oldRefreshToken) {
  try {
    const payload = jwt.verify(oldRefreshToken, process.env.JWT_SECRET);
    const userId = payload.userId;

    const user = await authRepository.findById(userId);
    if (!user || user.refreshToken !== oldRefreshToken) {
      const error = new Error('Unauthorized');
      error.code = 401;
      throw error;
    }

    const safeUser = filterSensitiveUserData(user);

    const newAccessToken = createToken(safeUser);
    const newRefreshToken = createToken(safeUser, 'refresh');

    await authRepository.updateUser(user.id, { refreshToken: newRefreshToken });

    return { newAccessToken, newRefreshToken };
  } catch (error) {
    const err = new Error('Unauthorized');
    err.code = 401;
    throw err;
  }
}
const authService = {
  createSignup,
  getUser,
  createToken,
  updateUser,
  refreshToken,
};

export default authService;
