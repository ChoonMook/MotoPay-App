-- AlterTable
ALTER TABLE `new_car_purchase_customers` ADD COLUMN `modelYear` VARCHAR(191) NULL,
    ALTER COLUMN `updatedAt` DROP DEFAULT;

-- CreateTable
CREATE TABLE `my_cars` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `memberId` VARCHAR(191) NOT NULL,
    `regType` VARCHAR(191) NOT NULL,
    `purchaseVin` VARCHAR(191) NULL,
    `carBrandCode` VARCHAR(191) NOT NULL,
    `carModelCode` VARCHAR(191) NOT NULL,
    `trimName` VARCHAR(191) NULL,
    `modelYear` VARCHAR(191) NULL,
    `plateNumber` VARCHAR(191) NULL,
    `vin` VARCHAR(191) NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` TIMESTAMP(3) NOT NULL,

    INDEX `my_cars_memberId_idx`(`memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `my_cars` ADD CONSTRAINT `my_cars_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `my_cars` ADD CONSTRAINT `my_cars_purchaseVin_fkey` FOREIGN KEY (`purchaseVin`) REFERENCES `new_car_purchase_customers`(`vin`) ON DELETE SET NULL ON UPDATE CASCADE;
