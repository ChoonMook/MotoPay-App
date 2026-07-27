-- AlterTable
ALTER TABLE `products` ADD COLUMN `supplyPrice` INTEGER NULL,
    ALTER COLUMN `updatedAt` DROP DEFAULT;
