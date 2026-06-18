/*
  Warnings:

  - You are about to drop the column `smtpFromEmail` on the `PlatformConfig` table. All the data in the column will be lost.
  - You are about to drop the column `smtpFromName` on the `PlatformConfig` table. All the data in the column will be lost.
  - You are about to drop the column `smtpHost` on the `PlatformConfig` table. All the data in the column will be lost.
  - You are about to drop the column `smtpPassword` on the `PlatformConfig` table. All the data in the column will be lost.
  - You are about to drop the column `smtpPort` on the `PlatformConfig` table. All the data in the column will be lost.
  - You are about to drop the column `smtpSecure` on the `PlatformConfig` table. All the data in the column will be lost.
  - You are about to drop the column `smtpUser` on the `PlatformConfig` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PlatformConfig" DROP COLUMN "smtpFromEmail",
DROP COLUMN "smtpFromName",
DROP COLUMN "smtpHost",
DROP COLUMN "smtpPassword",
DROP COLUMN "smtpPort",
DROP COLUMN "smtpSecure",
DROP COLUMN "smtpUser",
ADD COLUMN     "fromEmail" TEXT,
ADD COLUMN     "fromName" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "suspendedAt" TIMESTAMP(3);
