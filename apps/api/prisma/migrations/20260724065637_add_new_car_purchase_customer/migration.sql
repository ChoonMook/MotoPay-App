-- CreateTable
CREATE TABLE `new_car_purchase_customers` (
    `vin` VARCHAR(17) NOT NULL,
    `dealerCode` VARCHAR(191) NOT NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `phoneEncrypted` VARCHAR(191) NOT NULL,
    `phoneHash` VARCHAR(191) NOT NULL,
    `carBrandCode` VARCHAR(191) NOT NULL,
    `carModelCode` VARCHAR(191) NOT NULL,
    `trimName` VARCHAR(191) NOT NULL,
    `packageCode` VARCHAR(191) NULL,
    `isMapped` BOOLEAN NOT NULL DEFAULT false,
    `mappedAt` TIMESTAMP(3) NULL,
    `memberId` VARCHAR(191) NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedBy` VARCHAR(191) NULL,
    `updatedAt` TIMESTAMP(3) NOT NULL,

    INDEX `new_car_purchase_customers_phoneHash_idx`(`phoneHash`),
    PRIMARY KEY (`vin`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `new_car_purchase_customers` ADD CONSTRAINT `new_car_purchase_customers_packageCode_fkey` FOREIGN KEY (`packageCode`) REFERENCES `products`(`productCode`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `new_car_purchase_customers` ADD CONSTRAINT `new_car_purchase_customers_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
