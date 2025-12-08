/*
  Warnings:

  - Added the required column `saleId` to the `trades` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalQuantity` to the `user_cards` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "trades" ADD COLUMN     "saleId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user_cards" ADD COLUMN     "totalQuantity" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
