-- CreateTable
CREATE TABLE `bid_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `requestNo` CHAR(10) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `myCarId` INTEGER NULL,
    `reqType` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'OPEN',
    `desiredDate` DATE NOT NULL,
    `radiusKm` INTEGER NOT NULL,
    `minRating` DOUBLE NULL,
    `budget` INTEGER NULL,
    `note` TEXT NULL,
    `bidDeadline` TIMESTAMP(3) NOT NULL,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` TIMESTAMP(3) NOT NULL,

    UNIQUE INDEX `bid_requests_requestNo_key`(`requestNo`),
    INDEX `bid_requests_memberId_idx`(`memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bid_request_items` (
    `requestNo` CHAR(10) NOT NULL,
    `instCode` VARCHAR(191) NOT NULL,
    `productName` VARCHAR(191) NULL,

    PRIMARY KEY (`requestNo`, `instCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bid_request_positions` (
    `requestNo` CHAR(10) NOT NULL,
    `position` VARCHAR(191) NOT NULL,
    `level` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`requestNo`, `position`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bid_requests` ADD CONSTRAINT `bid_requests_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bid_requests` ADD CONSTRAINT `bid_requests_myCarId_fkey` FOREIGN KEY (`myCarId`) REFERENCES `my_cars`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bid_request_items` ADD CONSTRAINT `bid_request_items_requestNo_fkey` FOREIGN KEY (`requestNo`) REFERENCES `bid_requests`(`requestNo`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bid_request_positions` ADD CONSTRAINT `bid_request_positions_requestNo_fkey` FOREIGN KEY (`requestNo`) REFERENCES `bid_requests`(`requestNo`) ON DELETE RESTRICT ON UPDATE CASCADE;
