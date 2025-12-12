/*
  Warnings:

  - You are about to drop the column `photoCardId` on the `Sale` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sellerId,userCardId]` on the table `Sale` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userCardId` to the `Sale` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_photoCardId_fkey";

-- DropIndex
DROP INDEX "Sale_sellerId_photoCardId_key";

-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "photoCardId",
ADD COLUMN     "userCardId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Sale_sellerId_userCardId_key" ON "Sale"("sellerId", "userCardId");

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_userCardId_fkey" FOREIGN KEY ("userCardId") REFERENCES "UserCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
