/*
  Warnings:

  - You are about to drop the column `email` on the `requester_profile` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `requester_profile` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "requester_profile_email_key";

-- AlterTable
ALTER TABLE "requester_profile" DROP COLUMN "email",
DROP COLUMN "name";
