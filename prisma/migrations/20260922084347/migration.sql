/*
  Warnings:

  - The `additionalFiles` column on the `donors` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "donors" ADD COLUMN     "certificatePublicId" TEXT,
DROP COLUMN "additionalFiles",
ADD COLUMN     "additionalFiles" JSONB;
