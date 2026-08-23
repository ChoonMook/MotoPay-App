-- AlterTable
-- expiresAt DEFAULT는 실제 저장된 값(세션 타임존 UTC+9 기준)을 그대로 유지 — UTC 리터럴을 쓰면 이 세션
-- 타임존에서 TIMESTAMP 최소값 미만으로 환산되어 "Invalid default value" 에러 발생(과거 동일 이슈 반복)
ALTER TABLE `phone_verifications` MODIFY `expiresAt` TIMESTAMP(3) NOT NULL DEFAULT '1970-01-01 09:00:01.000';

-- AlterTable
ALTER TABLE `shops` ADD COLUMN `defaultCommissionAmount` INTEGER NULL,
    ADD COLUMN `defaultCommissionRate` DECIMAL(5, 2) NULL,
    ADD COLUMN `defaultCommissionType` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `product_shop_commissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productCode` VARCHAR(191) NOT NULL,
    `shopCode` VARCHAR(191) NOT NULL,
    `commissionType` VARCHAR(191) NOT NULL,
    `commissionAmount` INTEGER NULL,
    `commissionRate` DECIMAL(5, 2) NULL,
    `useYn` BOOLEAN NOT NULL DEFAULT true,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedBy` VARCHAR(191) NULL,
    `updatedAt` TIMESTAMP(3) NOT NULL,

    UNIQUE INDEX `product_shop_commissions_productCode_shopCode_key`(`productCode`, `shopCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shop_settlement_batches` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shopCode` VARCHAR(191) NOT NULL,
    `settlementMonth` CHAR(7) NOT NULL,
    `grossAmount` INTEGER NOT NULL,
    `commissionAmount` INTEGER NOT NULL,
    `netPayoutAmount` INTEGER NOT NULL,
    `payoutStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `payoutDate` DATE NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedBy` VARCHAR(191) NULL,
    `updatedAt` TIMESTAMP(3) NOT NULL,

    UNIQUE INDEX `shop_settlement_batches_shopCode_settlementMonth_key`(`shopCode`, `settlementMonth`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shop_settlement_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `batchId` INTEGER NOT NULL,
    `reservationNo` VARCHAR(191) NOT NULL,
    `productCode` VARCHAR(191) NULL,
    `grossAmount` INTEGER NOT NULL,
    `commissionType` VARCHAR(191) NOT NULL,
    `commissionAmount` INTEGER NOT NULL,
    `netAmount` INTEGER NOT NULL,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `shop_settlement_items_batchId_idx`(`batchId`),
    INDEX `shop_settlement_items_reservationNo_idx`(`reservationNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dealer_invoice_batches` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dealerCompanyId` INTEGER NOT NULL,
    `invoiceMonth` CHAR(7) NOT NULL,
    `totalAmount` INTEGER NOT NULL,
    `invoiceStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `invoicedAt` TIMESTAMP(3) NULL,
    `paidAt` TIMESTAMP(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedBy` VARCHAR(191) NULL,
    `updatedAt` TIMESTAMP(3) NOT NULL,

    UNIQUE INDEX `dealer_invoice_batches_dealerCompanyId_invoiceMonth_key`(`dealerCompanyId`, `invoiceMonth`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dealer_invoice_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `batchId` INTEGER NOT NULL,
    `reservationNo` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `dealer_invoice_items_batchId_idx`(`batchId`),
    INDEX `dealer_invoice_items_reservationNo_idx`(`reservationNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `product_shop_commissions` ADD CONSTRAINT `product_shop_commissions_productCode_fkey` FOREIGN KEY (`productCode`) REFERENCES `products`(`productCode`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_shop_commissions` ADD CONSTRAINT `product_shop_commissions_shopCode_fkey` FOREIGN KEY (`shopCode`) REFERENCES `shops`(`shopCode`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shop_settlement_batches` ADD CONSTRAINT `shop_settlement_batches_shopCode_fkey` FOREIGN KEY (`shopCode`) REFERENCES `shops`(`shopCode`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shop_settlement_items` ADD CONSTRAINT `shop_settlement_items_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `shop_settlement_batches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shop_settlement_items` ADD CONSTRAINT `shop_settlement_items_reservationNo_fkey` FOREIGN KEY (`reservationNo`) REFERENCES `reservations`(`reservationNo`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dealer_invoice_batches` ADD CONSTRAINT `dealer_invoice_batches_dealerCompanyId_fkey` FOREIGN KEY (`dealerCompanyId`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dealer_invoice_items` ADD CONSTRAINT `dealer_invoice_items_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `dealer_invoice_batches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dealer_invoice_items` ADD CONSTRAINT `dealer_invoice_items_reservationNo_fkey` FOREIGN KEY (`reservationNo`) REFERENCES `reservations`(`reservationNo`) ON DELETE RESTRICT ON UPDATE CASCADE;

