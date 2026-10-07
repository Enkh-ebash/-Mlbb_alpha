-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('SEARCHING', 'MATCHED', 'CANCELLED');

-- CreateTable
CREATE TABLE "queue_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mmr" INTEGER NOT NULL,
    "status" "QueueStatus" NOT NULL DEFAULT 'SEARCHING',
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "matchedWith" TEXT,
    "matchId" TEXT,
    "matchedAt" TIMESTAMP(3),

    CONSTRAINT "queue_entries_pkey" PRIMARY KEY ("id")
);

