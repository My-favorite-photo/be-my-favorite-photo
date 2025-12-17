-- AlterEnum
ALTER TYPE "PointType" ADD VALUE 'RANDOM_EVENT';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastRandomAt" TIMESTAMPTZ(6);
