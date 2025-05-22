/*
  Warnings:

  - Added the required column `facilitatorAccessToken` to the `Subscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orderId` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "facilitatorAccessToken" TEXT NOT NULL,
ADD COLUMN     "orderId" TEXT NOT NULL;
