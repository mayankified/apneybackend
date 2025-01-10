/*
  Warnings:

  - Added the required column `state` to the `Business` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zipcode` to the `Business` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "state" TEXT NOT NULL,
ADD COLUMN     "zipcode" TEXT NOT NULL;
