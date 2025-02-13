/*
  Warnings:

  - You are about to drop the column `hasApplied` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Keyword` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_BusinessKeywords` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_BusinessKeywords" DROP CONSTRAINT "_BusinessKeywords_A_fkey";

-- DropForeignKey
ALTER TABLE "_BusinessKeywords" DROP CONSTRAINT "_BusinessKeywords_B_fkey";

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "hasApplied" BOOLEAN DEFAULT false,
ADD COLUMN     "keywords" TEXT[];

-- AlterTable
ALTER TABLE "User" DROP COLUMN "hasApplied";

-- DropTable
DROP TABLE "Keyword";

-- DropTable
DROP TABLE "_BusinessKeywords";
