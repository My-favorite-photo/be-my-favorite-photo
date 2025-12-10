/*
  Warnings:

  - Added the required column `userCardId` to the `Sale` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userCardId` to the `Trade` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "SaleHistory" DROP CONSTRAINT "SaleHistory_userCardId_fkey";

-- DropForeignKey
ALTER TABLE "TradeHistory" DROP CONSTRAINT "TradeHistory_userCardId_fkey";

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "userCardId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "userCardId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_userCardId_fkey" FOREIGN KEY ("userCardId") REFERENCES "UserCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_userCardId_fkey" FOREIGN KEY ("userCardId") REFERENCES "UserCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
