-- CreateTable
CREATE TABLE `product_car_model_mappings` (
    `productCode` VARCHAR(191) NOT NULL,
    `carModelCode` VARCHAR(191) NOT NULL,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`productCode`, `carModelCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `product_car_model_mappings` ADD CONSTRAINT `product_car_model_mappings_productCode_fkey` FOREIGN KEY (`productCode`) REFERENCES `products`(`productCode`) ON DELETE RESTRICT ON UPDATE CASCADE;
