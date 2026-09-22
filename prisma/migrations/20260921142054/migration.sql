/*
  Warnings:

  - You are about to drop the column `requesterId` on the `blood_requests` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "blood_requests" DROP CONSTRAINT "blood_requests_requesterId_fkey";

-- DropIndex
DROP INDEX "blood_requests_requesterId_idx";

-- AlterTable
ALTER TABLE "blood_requests" DROP COLUMN "requesterId";
