/*
  Warnings:

  - You are about to drop the column `phone` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `users` DROP COLUMN `phone`,
    ADD COLUMN `agreedMarketingEmail` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `agreedMarketingPush` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `agreedMarketingSms` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `agreedPrivacy` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `agreedTerms` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `lastLoginAt` DATETIME(3) NULL,
    ADD COLUMN `phoneEncrypted` VARCHAR(191) NULL;
