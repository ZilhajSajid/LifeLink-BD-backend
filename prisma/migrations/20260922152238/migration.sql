/*
  Warnings:

  - Added the required column `bloodGroup` to the `blood_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requesterId` to the `blood_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requiredDate` to the `blood_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitsRequired` to the `blood_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "blood_requests" ADD COLUMN     "bloodGroup" "BloodGroupType" NOT NULL,
ADD COLUMN     "requesterId" TEXT NOT NULL,
ADD COLUMN     "requiredDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "unitsFulfilled" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unitsRequired" INTEGER NOT NULL,
ADD COLUMN     "verifiedBy" TEXT;

-- AlterTable
ALTER TABLE "donations" ADD COLUMN     "recordPublicId" TEXT,
ADD COLUMN     "recordUrl" TEXT;

-- CreateIndex
CREATE INDEX "blood_requests_requesterId_idx" ON "blood_requests"("requesterId");

-- CreateIndex
CREATE INDEX "blood_requests_bloodGroup_idx" ON "blood_requests"("bloodGroup");

-- AddForeignKey
ALTER TABLE "blood_requests" ADD CONSTRAINT "blood_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "requester_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blood_requests" ADD CONSTRAINT "blood_requests_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation_assignment" ADD CONSTRAINT "donation_assignment_bloodRequestId_fkey" FOREIGN KEY ("bloodRequestId") REFERENCES "blood_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation_assignment" ADD CONSTRAINT "donation_assignment_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
