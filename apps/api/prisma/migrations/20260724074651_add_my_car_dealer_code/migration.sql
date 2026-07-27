-- AlterTable
ALTER TABLE `my_cars` ADD COLUMN `dealerCode` VARCHAR(191) NULL,
    ALTER COLUMN `updatedAt` DROP DEFAULT;
