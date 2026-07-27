-- AlterTable
ALTER TABLE `product_bundle_items` ADD COLUMN `itemType` ENUM('BASIC', 'OPTION') NOT NULL DEFAULT 'BASIC';
