// repository

import { prisma } from '../configs/prismaClient.js';

const authRepository = {
  findByEmail(email) {
    return prisma.user.findUnique({
      where: {
        email,
      },
    });
  },

  findByEmailWithPoint(email) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        point: true,
      },
    });
  },

  findByIdWithPoint(id) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        point: true,
      },
    });
  },

  createUser(data) {
    return prisma.user.create({
      data,
    });
  },

  updateUser(id, data) {
    return prisma.user.update({
      where: { id },
      data,
    });
  },

  findById(id) {
    return prisma.user.findUnique({
      where: { id },
    });
  },
};

export default authRepository;
