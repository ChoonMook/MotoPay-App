-- CreateTable
CREATE TABLE `dealer_shop_mappings` (
    `dealerCompanyId` INTEGER NOT NULL,
    `shopCode` VARCHAR(191) NOT NULL,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`dealerCompanyId`, `shopCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `dealer_shop_mappings` ADD CONSTRAINT `dealer_shop_mappings_dealerCompanyId_fkey` FOREIGN KEY (`dealerCompanyId`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dealer_shop_mappings` ADD CONSTRAINT `dealer_shop_mappings_shopCode_fkey` FOREIGN KEY (`shopCode`) REFERENCES `shops`(`shopCode`) ON DELETE RESTRICT ON UPDATE CASCADE;
