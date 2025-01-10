/*
  Warnings:

  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_BusinessTags` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Business" DROP CONSTRAINT "Business_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "_BusinessTags" DROP CONSTRAINT "_BusinessTags_A_fkey";

-- DropForeignKey
ALTER TABLE "_BusinessTags" DROP CONSTRAINT "_BusinessTags_B_fkey";

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "category" TEXT[],
ADD COLUMN     "tags" TEXT[];

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "Tag";

-- DropTable
DROP TABLE "_BusinessTags";
