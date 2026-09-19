/*
  Warnings:

  - You are about to drop the column `phone` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "requester_profile" ADD COLUMN     "contactNumber" TEXT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "phone",
ADD COLUMN     "contactNumber" TEXT;
