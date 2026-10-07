-- CreateTable
CREATE TABLE "heroes" (
    "id" TEXT NOT NULL,
    "externalId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "winRate" DOUBLE PRECISION,
    "pickRate" DOUBLE PRECISION,
    "banRate" DOUBLE PRECISION,
    "syncedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "heroes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "heroes_externalId_key" ON "heroes"("externalId");

