-- CreateTable
CREATE TABLE `new_car_purchase_tint_positions` (
    `vin` VARCHAR(191) NOT NULL,
    `position` VARCHAR(191) NOT NULL,
    `level` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`vin`, `position`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `new_car_purchase_tint_positions` ADD CONSTRAINT `new_car_purchase_tint_positions_vin_fkey` FOREIGN KEY (`vin`) REFERENCES `new_car_purchase_customers`(`vin`) ON DELETE RESTRICT ON UPDATE CASCADE;
