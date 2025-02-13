-- DropForeignKey
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_adminId_fkey";

-- AlterTable
ALTER TABLE "Activity" ALTER COLUMN "adminId" SET DATA TYPE TEXT;
