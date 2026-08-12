-- CreateTable
CREATE TABLE `product_dealer_mappings` (
    `productCode` VARCHAR(191) NOT NULL,
    `dealerCode` VARCHAR(191) NOT NULL,
    `price` INTEGER NOT NULL,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`productCode`, `dealerCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `product_dealer_mappings` ADD CONSTRAINT `product_dealer_mappings_productCode_fkey` FOREIGN KEY (`productCode`) REFERENCES `products`(`productCode`) ON DELETE RESTRICT ON UPDATE CASCADE;
