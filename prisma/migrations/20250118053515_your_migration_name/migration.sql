-- CreateTable
CREATE TABLE "ViewInteraction" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "views" INTEGER NOT NULL DEFAULT 0,
    "businessId" INTEGER NOT NULL,

    CONSTRAINT "ViewInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationSearch" (
    "id" SERIAL NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocationSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemSearch" (
    "id" SERIAL NOT NULL,
    "item" VARCHAR(255) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemSearch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ViewInteraction_date_key" ON "ViewInteraction"("date");

-- CreateIndex
CREATE UNIQUE INDEX "LocationSearch_location_key" ON "LocationSearch"("location");

-- CreateIndex
CREATE UNIQUE INDEX "ItemSearch_item_key" ON "ItemSearch"("item");

-- AddForeignKey
ALTER TABLE "ViewInteraction" ADD CONSTRAINT "ViewInteraction_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
