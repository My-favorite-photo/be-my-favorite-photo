import { BadRequestException } from '../common/exceptions/badRequestException.js';
import { NotFoundException } from '../common/exceptions/notFoundException.js';
import { prisma } from '../configs/prismaClient.js';
import pointService from './pointService.js';

async function grantReward({ userId, amount, type, description }) {
  if (!userId || !amount || !type) {
    throw new BadRequestException('userId, amount, type 필수입니다!');
  }

  if (amount <= 0) {
    throw new BadRequestException('지급 포인트는 0보다 커야합니다.');
  }

  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('존재하지 않는 유저입니다.');
    }

    await pointService.addPoint(tx, userId, amount, type, description ?? '이벤트 보상 지급');

    return {
      userId,
      amount,
      type,
      description,
    };
  });
}

export default {
  grantReward,
};
