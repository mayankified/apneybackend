/*
  Warnings:

  - You are about to drop the column `location` on the `LocationSearch` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[roundedLat,roundedLon]` on the table `LocationSearch` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `roundedLat` to the `LocationSearch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roundedLon` to the `LocationSearch` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "LocationSearch_location_key";

-- AlterTable
ALTER TABLE "LocationSearch" DROP COLUMN "location",
ADD COLUMN     "roundedLat" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "roundedLon" DOUBLE PRECISION NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "LocationSearch_roundedLat_roundedLon_key" ON "LocationSearch"("roundedLat", "roundedLon");
