-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PLAYER', 'MODERATOR', 'ADMIN');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PLAYER',
    "avatarUrl" TEXT,
    "eloRating" INTEGER NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mlbb_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mlbbId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "inGameName" TEXT NOT NULL,
    "cachedRank" TEXT,
    "cachedWinrate" DOUBLE PRECISION,
    "lastSyncedAt" TIMESTAMP(3),

    CONSTRAINT "mlbb_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "mlbb_profiles_userId_key" ON "mlbb_profiles"("userId");

-- AddForeignKey
ALTER TABLE "mlbb_profiles" ADD CONSTRAINT "mlbb_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

