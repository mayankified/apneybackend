/*
  Warnings:

  - A unique constraint covering the columns `[businessId,date]` on the table `ViewInteraction` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ViewInteraction_date_key";

-- AlterTable
ALTER TABLE "ViewInteraction" ALTER COLUMN "date" DROP DEFAULT,
ALTER COLUMN "views" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "ViewInteraction_businessId_date_key" ON "ViewInteraction"("businessId", "date");
