-- AlterTable
ALTER TABLE `reservations` ADD COLUMN `couponDiscount` INTEGER NULL,
    ADD COLUMN `couponName` VARCHAR(191) NULL,
    ADD COLUMN `paidAmount` INTEGER NULL,
    ADD COLUMN `paidAt` TIMESTAMP(3) NULL,
    ADD COLUMN `paymentMethod` VARCHAR(191) NULL,
    ADD COLUMN `pointsUsed` INTEGER NULL;
