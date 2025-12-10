/*
  Warnings:

  - Added the required column `price` to the `PhotoCard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `UserCard` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PhotoCard" ADD COLUMN     "price" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "UserCard" ADD COLUMN     "price" INTEGER NOT NULL;
