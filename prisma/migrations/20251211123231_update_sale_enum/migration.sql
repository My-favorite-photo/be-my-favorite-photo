/*
  Warnings:

  - You are about to drop the column `userCardId` on the `Sale` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sellerId,photoCardId]` on the table `Sale` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `genre` to the `Sale` table without a default value. This is not possible if the table is not empty.
  - Added the required column `grade` to the `Sale` table without a default value. This is not possible if the table is not empty.
  - Added the required column `photoCardId` to the `Sale` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `Sale` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SaleGrade" AS ENUM ('COMMON', 'RARE', 'SUPER_RARE', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "SaleGenre" AS ENUM ('TRAVEL', 'LANDSCAPE', 'PORTRAIT', 'OBJECT');

-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_userCardId_fkey";

-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "userCardId",
ADD COLUMN     "genre" "SaleGenre" NOT NULL,
ADD COLUMN     "grade" "SaleGrade" NOT NULL,
ADD COLUMN     "photoCardId" TEXT NOT NULL,
ADD COLUMN     "quantity" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Sale_sellerId_photoCardId_key" ON "Sale"("sellerId", "photoCardId");

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_photoCardId_fkey" FOREIGN KEY ("photoCardId") REFERENCES "UserCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
