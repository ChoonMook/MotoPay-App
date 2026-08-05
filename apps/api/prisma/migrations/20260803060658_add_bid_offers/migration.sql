-- AlterTable
ALTER TABLE `bid_requests` ADD COLUMN `selectedOfferNo` CHAR(10) NULL;

-- CreateTable
CREATE TABLE `bid_offers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `offerNo` CHAR(10) NOT NULL,
    `requestNo` CHAR(10) NOT NULL,
    `shopCode` VARCHAR(191) NOT NULL,
    `scheduledTime` TIME(0) NOT NULL,
    `memo` TEXT NULL,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` TIMESTAMP(3) NOT NULL,

    UNIQUE INDEX `bid_offers_offerNo_key`(`offerNo`),
    INDEX `bid_offers_requestNo_idx`(`requestNo`),
    UNIQUE INDEX `bid_offers_requestNo_shopCode_key`(`requestNo`, `shopCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bid_offer_items` (
    `offerNo` CHAR(10) NOT NULL,
    `instCode` VARCHAR(191) NOT NULL,
    `price` INTEGER NOT NULL,

    PRIMARY KEY (`offerNo`, `instCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bid_offers` ADD CONSTRAINT `bid_offers_requestNo_fkey` FOREIGN KEY (`requestNo`) REFERENCES `bid_requests`(`requestNo`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bid_offers` ADD CONSTRAINT `bid_offers_shopCode_fkey` FOREIGN KEY (`shopCode`) REFERENCES `shops`(`shopCode`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bid_offer_items` ADD CONSTRAINT `bid_offer_items_offerNo_fkey` FOREIGN KEY (`offerNo`) REFERENCES `bid_offers`(`offerNo`) ON DELETE RESTRICT ON UPDATE CASCADE;
