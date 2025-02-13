-- CreateTable
CREATE TABLE "AdminRole" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "accessUser" BOOLEAN NOT NULL DEFAULT false,
    "accessVendor" BOOLEAN NOT NULL DEFAULT false,
    "accessAnalytics" BOOLEAN NOT NULL DEFAULT false,
    "accessReports" BOOLEAN NOT NULL DEFAULT false,
    "accessMarket" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "text" TEXT NOT NULL,
    "adminId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminRole_userId_key" ON "AdminRole"("userId");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
