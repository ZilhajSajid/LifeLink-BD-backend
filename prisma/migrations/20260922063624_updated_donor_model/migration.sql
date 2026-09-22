-- CreateEnum
CREATE TYPE "DonorVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "donation_assignment" DROP CONSTRAINT "donation_assignment_donorId_fkey";

-- AlterTable
ALTER TABLE "donors" ADD COLUMN     "additionalFiles" TEXT[],
ADD COLUMN     "certificate" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rejectionStatus" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT,
ADD COLUMN     "verificationStatus" "DonorVerificationStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "totalDonations" DROP NOT NULL;
