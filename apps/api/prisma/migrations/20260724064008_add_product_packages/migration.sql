-- AlterTable
ALTER TABLE `products` ADD COLUMN `dealerCode` VARCHAR(191) NULL,
    MODIFY `brand` VARCHAR(191) NULL,
    MODIFY `prodCat` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `product_bundle_items` (
    `packageCode` VARCHAR(191) NOT NULL,
    `componentCode` VARCHAR(191) NOT NULL,
    `qty` INTEGER NOT NULL DEFAULT 1,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`packageCode`, `componentCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `products_dealerCode_idx` ON `products`(`dealerCode`);
