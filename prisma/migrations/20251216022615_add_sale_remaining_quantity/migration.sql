/*
  Warnings:

  - Added the required column `remainingQuantity` to the `Sale` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "remainingQuantity" INTEGER NOT NULL;
