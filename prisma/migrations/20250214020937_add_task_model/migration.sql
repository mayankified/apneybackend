-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "task" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadline" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assignedAdminId" INTEGER,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedAdminId_fkey" FOREIGN KEY ("assignedAdminId") REFERENCES "AdminRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;
