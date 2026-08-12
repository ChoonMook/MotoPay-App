-- AlterTable
ALTER TABLE `new_car_purchase_customers` ADD COLUMN `confirmed` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `confirmedAt` TIMESTAMP(3) NULL,
    ADD COLUMN `confirmedBy` VARCHAR(191) NULL,
    ADD COLUMN `purchaseDate` DATE NULL;
