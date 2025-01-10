/*
  Warnings:

  - Added the required column `city` to the `Business` table without a default value. This is not possible if the table is not empty.
  - Added the required column `country` to the `Business` table without a default value. This is not possible if the table is not empty.
  - Added the required column `streetaddress` to the `Business` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "country" TEXT NOT NULL,
ADD COLUMN     "keyword" TEXT[],
ADD COLUMN     "streetaddress" TEXT NOT NULL;
