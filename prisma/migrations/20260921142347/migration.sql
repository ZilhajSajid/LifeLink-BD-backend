/*
  Warnings:

  - You are about to drop the column `bloodGroup` on the `blood_requests` table. All the data in the column will be lost.
  - You are about to drop the column `requiredDate` on the `blood_requests` table. All the data in the column will be lost.
  - You are about to drop the column `unitsFulfilled` on the `blood_requests` table. All the data in the column will be lost.
  - You are about to drop the column `unitsRequired` on the `blood_requests` table. All the data in the column will be lost.
  - You are about to drop the column `verifiedBy` on the `blood_requests` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "blood_requests" DROP CONSTRAINT "blood_requests_verifiedBy_fkey";

-- DropForeignKey
ALTER TABLE "donation_assignment" DROP CONSTRAINT "donation_assignment_bloodRequestId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_requestId_fkey";

-- DropIndex
DROP INDEX "blood_requests_bloodGroup_idx";

-- AlterTable
ALTER TABLE "blood_requests" DROP COLUMN "bloodGroup",
DROP COLUMN "requiredDate",
DROP COLUMN "unitsFulfilled",
DROP COLUMN "unitsRequired",
DROP COLUMN "verifiedBy";
