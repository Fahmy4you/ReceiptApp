/*
  Warnings:

  - You are about to drop the column `image` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "StatusLisensi" AS ENUM ('FREE_TIER', 'SILVER_TIER', 'GOLDEN_TIER', 'PLATINUM_TIER');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "image",
ADD COLUMN     "kuota" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "license" "StatusLisensi" NOT NULL DEFAULT 'FREE_TIER';
