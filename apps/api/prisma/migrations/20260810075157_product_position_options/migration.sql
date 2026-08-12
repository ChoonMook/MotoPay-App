-- AlterTable
ALTER TABLE `products` ADD COLUMN `positionOptionYn` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `product_position_options` (
    `productCode` VARCHAR(191) NOT NULL,
    `position` VARCHAR(191) NOT NULL,
    `level` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`productCode`, `position`, `level`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `product_position_options` ADD CONSTRAINT `product_position_options_productCode_fkey` FOREIGN KEY (`productCode`) REFERENCES `products`(`productCode`) ON DELETE RESTRICT ON UPDATE CASCADE;
