-- CreateTable
CREATE TABLE `new_car_purchase_items` (
    `vin` VARCHAR(191) NOT NULL,
    `componentCode` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`vin`, `componentCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `new_car_purchase_items` ADD CONSTRAINT `new_car_purchase_items_vin_fkey` FOREIGN KEY (`vin`) REFERENCES `new_car_purchase_customers`(`vin`) ON DELETE RESTRICT ON UPDATE CASCADE;
