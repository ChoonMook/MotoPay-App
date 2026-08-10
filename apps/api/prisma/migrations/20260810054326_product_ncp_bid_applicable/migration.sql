-- AlterTable
ALTER TABLE `products` ADD COLUMN `bidApplicable` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `ncpApplicable` BOOLEAN NOT NULL DEFAULT true;
