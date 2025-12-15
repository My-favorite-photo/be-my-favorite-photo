import { BadRequestException } from '../common/exceptions/badRequestException.js';
import { NotFoundException } from '../common/exceptions/notFoundException.js';

/**
 * 포인트 증가
 *
 * @param {Object} tx - prisma transaction client
 * @param {String} userId - 포인트를 받을 유저id
 * @param {Number} amount - 증가할 포인트
 * @param {String} type - 포인트타입
 * @param {String} description - 포인트 변동 설명
 */

async function addPoint(tx, userId, amount, type, description) {
  if (amount <= 0) {
    throw new BadRequestException('포인트 증가가 0보다 커야합니다.');
  }

  const point = await tx.point.findUnique({
    where: { userId },
  });

  if (!point) {
    throw new NotFoundException('포인트 정보가 존재하지 않습니다.');
  }

  //포인트 테이블 balance 증가
  await tx.point.update({
    where: { userId },
    data: {
      balance: {
        increment: amount,
      },
    },
  });

  await tx.pointHistory.create({
    data: {
      userId,
      amount,
      type,
      description,
    },
  });
}

/**
 * 포인트 차감
 *
 * @param {Object} tx - prisma transaction client
 * @param {String} userId - 포인트를 차감할 유저id
 * @param {Number} amount - 차감할 포인트
 * @param {String} type - 포인트 타입
 * @param {String} description - 포인트 변동 설명
 */

async function deductPoint(tx, userId, amount, type, description) {
  if (amount <= 0) {
    throw new BadRequestException('포인트 차감은 0보다 커야합니다.');
  }

  const point = await tx.point.findUnique({
    where: { userId },
  });

  if (!point) {
    throw new NotFoundException('포인트 정보가 존재하지 않습니다!');
  }

  if (point.balance < amount) {
    throw new BadRequestException('포인트가 부족합니다.');
  }

  await tx.point.update({
    where: { userId },
    data: {
      balance: {
        decrement: amount,
      },
    },
  });

  await tx.pointHistory.create({
    data: {
      userId,
      amount: -amount,
      type,
      description,
    },
  });
}

export default {
  addPoint,
  deductPoint,
};
