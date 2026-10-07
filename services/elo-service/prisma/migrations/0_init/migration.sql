-- CreateTable
CREATE TABLE "elo_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "eloBefore" INTEGER NOT NULL,
    "eloAfter" INTEGER NOT NULL,
    "delta" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "elo_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_baselines" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "avgWeightedScore" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "sampleSize" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "performance_baselines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "performance_baselines_key_key" ON "performance_baselines"("key");

