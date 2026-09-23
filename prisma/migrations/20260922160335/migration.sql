/*
  Warnings:

  - Added the required column `scheduledAt` to the `donations` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "donations_donatedAt_idx";

-- AlterTable
ALTER TABLE "donations" ADD COLUMN     "scheduledAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "donatedAt" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "donations_scheduledAt_idx" ON "donations"("scheduledAt");
