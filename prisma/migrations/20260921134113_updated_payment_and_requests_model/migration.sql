/*
  Warnings:

  - The values [VERIFIED] on the enum `BloodRequestsStatus` will be removed. If these variants are still used in the database, this will fail.
  - Made the column `merchantInvoiceNumber` on table `payments` required. This step will fail if there are existing NULL values in that column.
  - Made the column `refundAmount` on table `payments` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BloodRequestsStatus_new" AS ENUM ('PENDING', 'CONFIRMED', 'MATCHING', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED', 'EXPIRED', 'REJECTED');
ALTER TABLE "public"."blood_requests" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "blood_requests" ALTER COLUMN "status" TYPE "BloodRequestsStatus_new" USING ("status"::text::"BloodRequestsStatus_new");
ALTER TYPE "BloodRequestsStatus" RENAME TO "BloodRequestsStatus_old";
ALTER TYPE "BloodRequestsStatus_new" RENAME TO "BloodRequestsStatus";
DROP TYPE "public"."BloodRequestsStatus_old";
ALTER TABLE "blood_requests" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "merchantInvoiceNumber" SET NOT NULL,
ALTER COLUMN "paidAt" SET DATA TYPE TEXT,
ALTER COLUMN "refundAmount" SET NOT NULL,
ALTER COLUMN "refundAt" SET DATA TYPE TEXT;
