/*
  Warnings:

  - Added the required column `expiresAt` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LoginStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CONSUMED', 'EXPIRED');

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "prevRefreshTokenHash" TEXT,
ADD COLUMN     "revokeReason" TEXT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" DROP NOT NULL;

-- CreateTable
CREATE TABLE "LoginRequest" (
    "id" UUID NOT NULL,
    "codeHash" TEXT NOT NULL,
    "pollTokenHash" TEXT NOT NULL,
    "status" "LoginStatus" NOT NULL DEFAULT 'PENDING',
    "userId" UUID,
    "telegramId" BIGINT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "LoginRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoginRequest_codeHash_key" ON "LoginRequest"("codeHash");

-- CreateIndex
CREATE INDEX "LoginRequest_status_expiresAt_idx" ON "LoginRequest"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "Session_prevRefreshTokenHash_idx" ON "Session"("prevRefreshTokenHash");

-- AddForeignKey
ALTER TABLE "LoginRequest" ADD CONSTRAINT "LoginRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
