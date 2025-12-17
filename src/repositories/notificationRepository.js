import { prisma } from '../configs/prismaClient.js';

const notificationRepository = {
  create({ userId, content }, tx = prisma) {
    return tx.notification.create({
      data: { userId, content },
    });
  },

  findLatestByUser(userId, limit = 20) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },
};

export default notificationRepository;
