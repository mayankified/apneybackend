-- CreateTable
CREATE TABLE "BusinessSuggestion" (
    "id" SERIAL NOT NULL,
    "businessName" VARCHAR(255) NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessSuggestion_pkey" PRIMARY KEY ("id")
);
