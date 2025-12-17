import { addMinutes, isAfter } from 'date-fns'; //1분

// import { addHours, isAfter } from 'date-fns'; //1시간
import { prisma } from '../configs/prismaClient.js';

// 랜덤 가능 여부 체크
export async function checkRandomEligibility(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastRandomAt: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.lastRandomAt) {
    return { canTry: true, nextAvailableAt: null };
  }

  // const nextAvailableAt = addHours(user.lastRandomAt, 1); //1시간
  const nextAvailableAt = addMinutes(user.lastRandomAt, 1); // 1분

  if (isAfter(new Date(), nextAvailableAt)) {
    return { canTry: true, nextAvailableAt: null };
  }

  return { canTry: false, nextAvailableAt };
}

// 랜덤 보상
function pickRandomReward() {
  const pool = [0, 1, 2, 5]; //가차
  return pool[Math.floor(Math.random() * pool.length)];
}

// 랜덤 포인트 실행
export async function executeRandomPoint(userId) {
  const eligibility = await checkRandomEligibility(userId);

  if (!eligibility.canTry) {
    const error = new Error('Cooldown not finished');
    error.nextAvailableAt = eligibility.nextAvailableAt;
    throw error;
  }

  const reward = pickRandomReward();
  const now = new Date();
  // const nextAvailableAt = addHours(now, 1);  //1시간
  const nextAvailableAt = addMinutes(now, 1);

  await prisma.$transaction(async (tx) => {
    await tx.point.upsert({
      where: { userId },
      update: {
        balance: { increment: reward },
      },
      create: {
        userId,
        balance: reward,
      },
    });

    await tx.pointHistory.create({
      data: {
        userId,
        amount: reward,
        type: 'RANDOM_EVENT',
        description: '랜덤 포인트 이벤트',
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        lastRandomAt: now,
      },
    });
  });

  return {
    reward,
    nextAvailableAt,
  };
}

export default {
  checkRandomEligibility,
  execute: executeRandomPoint,
};
