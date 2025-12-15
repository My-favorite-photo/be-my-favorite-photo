import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { BadRequestException } from '../common/exceptions/badRequestException.js';
import { ConflictException } from '../common/exceptions/conflictException.js';
import { InternalServerException } from '../common/exceptions/internalServerException.js';
import { prisma } from '../configs/prismaClient.js';
import authRepository from '../repositories/authRepository.js';

/**
 *
 * @param {*} user
 * 회원가입 로직 트랜잭션으로 수정 추후 로그인, 토큰 관련 리펙토링 예정
 */

async function createSignup(user) {
  try {
    if (!user.email || !user.password || !user.nickname) {
      throw new BadRequestException('이메일, 비밀번호 , 닉네임이 누락되었습니다.');
    }

    const createdUser = await prisma.$transaction(async (tx) => {
      const existedUser = await tx.user.findUnique({
        where: { email: user.email },
      });

      if (existedUser) {
        throw new ConflictException('이미 존재하는 이메일입니다.');
      }

      const hashedPassword = await hashPassword(user.password);

      const newUser = await tx.user.create({
        data: {
          email: user.email,
          password: hashedPassword,
          nickname: user.nickname,
        },
      });

      await tx.point.create({
        data: {
          userId: newUser.id,
          balance: 500,
        },
      });

      await tx.pointHistory.create({
        data: {
          userId: newUser.id,
          amount: 500,
          type: 'JOIN_BONUS',
          description: '회원가입 포인트',
        },
      });

      return newUser;
    });

    return filterSensitiveUserData(createdUser);
  } catch (error) {
    if (error instanceof BadRequestException) throw error;
    if (error instanceof ConflictException) throw error;

    throw new InternalServerException('회원가입 처리 오류 발생');
  }
}

function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

function filterSensitiveUserData(user) {
  const { password, refreshToken, ...rest } = user;
  return rest;
}

// 로그인
async function getUser(email, password) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        point: true,
      },
    });

    if (!user) {
      const error = new Error('존재하지 않는 이메일 입니다.');
      error.code = 401;
      throw error;
    }

    await verifyPassword(password, user.password);

    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      balance: user.point?.balance ?? 0,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
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
  try {
    const updateUser = await authRepository.updateUser(id, data);
    return filterSensitiveUserData(updateUser);
  } catch (error) {
    const customError = new Error('사용자 정보 업데이트 중 오류가 발생했습니다.');
    customError.code = 500;
    throw customError;
  }
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

async function getMe(userId) {
  try {
    const user = await authRepository.findByIdWithPoint(userId);

    if (!user) {
      const error = new Error('존재하지 않는 사용자입니다.');
      error.code = 401;
      throw error;
    }

    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      balance: user.point?.balance ?? 0,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    if (error.code === 401) throw error;

    const customError = new Error('사용자 정보를 가져오는 중 오류가 발생했습니다.');
    customError.code = 500;
    throw customError;
  }
}
const authService = {
  createSignup,
  getUser,
  createToken,
  updateUser,
  refreshToken,
  getMe,
};

export default authService;
