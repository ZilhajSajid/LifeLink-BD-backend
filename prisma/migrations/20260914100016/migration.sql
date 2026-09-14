/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `requester_profile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `requester_profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `requester_profile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "requester_profile" ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "requester_profile_email_key" ON "requester_profile"("email");
