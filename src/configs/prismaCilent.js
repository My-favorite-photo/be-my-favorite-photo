import { exit } from 'node:process';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generated/client.ts';

const getPrismaLogLevel = () => {
  if (process.env.NODE_ENV === 'production') {
    return ['warn', 'error'];
  }
  return ['query', 'info', 'warn', 'error'];
};
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = new PrismaClient({
  adapter,
  log: getPrismaLogLevel(),
});

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('DB 서버와 성공적으로 연결되었습니다.');
  } catch (error) {
    console.error('DB 서버와 연결하지 못하였습니다.', error);
    exit(1);
  }
};

export const disconnectDB = async () => {
  await prisma.$disconnect();
  console.log('DB 서버를 해제합니다.');
};
