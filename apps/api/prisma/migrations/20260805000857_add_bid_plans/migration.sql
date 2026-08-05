-- AlterTable
ALTER TABLE `bid_requests` ADD COLUMN `selectedPlanNo` CHAR(10) NULL;

-- CreateTable
CREATE TABLE `bid_plans` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `planNo` CHAR(10) NOT NULL,
    `requestNo` CHAR(10) NOT NULL,
    `shopCode` VARCHAR(191) NOT NULL,
    `scheduledTime` TIME(0) NOT NULL,
    `reason` TEXT NOT NULL,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` TIMESTAMP(3) NOT NULL,

    UNIQUE INDEX `bid_plans_planNo_key`(`planNo`),
    INDEX `bid_plans_requestNo_idx`(`requestNo`),
    UNIQUE INDEX `bid_plans_requestNo_shopCode_key`(`requestNo`, `shopCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bid_plan_items` (
    `planNo` CHAR(10) NOT NULL,
    `instCode` VARCHAR(191) NOT NULL,
    `productCode` VARCHAR(191) NULL,
    `productName` VARCHAR(191) NOT NULL,
    `retailPrice` INTEGER NOT NULL,
    `offerPrice` INTEGER NOT NULL,

    PRIMARY KEY (`planNo`, `instCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bid_plan_positions` (
    `planNo` CHAR(10) NOT NULL,
    `position` VARCHAR(191) NOT NULL,
    `level` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`planNo`, `position`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bid_plans` ADD CONSTRAINT `bid_plans_requestNo_fkey` FOREIGN KEY (`requestNo`) REFERENCES `bid_requests`(`requestNo`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bid_plans` ADD CONSTRAINT `bid_plans_shopCode_fkey` FOREIGN KEY (`shopCode`) REFERENCES `shops`(`shopCode`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bid_plan_items` ADD CONSTRAINT `bid_plan_items_planNo_fkey` FOREIGN KEY (`planNo`) REFERENCES `bid_plans`(`planNo`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bid_plan_positions` ADD CONSTRAINT `bid_plan_positions_planNo_fkey` FOREIGN KEY (`planNo`) REFERENCES `bid_plans`(`planNo`) ON DELETE RESTRICT ON UPDATE CASCADE;
