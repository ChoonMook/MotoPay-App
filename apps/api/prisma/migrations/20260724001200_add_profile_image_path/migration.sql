-- AlterTable
ALTER TABLE `users` ADD COLUMN `profileImagePath` VARCHAR(191) NULL,
    ALTER COLUMN `updatedAt` DROP DEFAULT;
