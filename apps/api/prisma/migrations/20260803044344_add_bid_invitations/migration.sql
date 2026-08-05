-- CreateTable
CREATE TABLE `bid_invitations` (
    `requestNo` CHAR(10) NOT NULL,
    `shopCode` VARCHAR(191) NOT NULL,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `bid_invitations_shopCode_idx`(`shopCode`),
    PRIMARY KEY (`requestNo`, `shopCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bid_invitations` ADD CONSTRAINT `bid_invitations_requestNo_fkey` FOREIGN KEY (`requestNo`) REFERENCES `bid_requests`(`requestNo`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bid_invitations` ADD CONSTRAINT `bid_invitations_shopCode_fkey` FOREIGN KEY (`shopCode`) REFERENCES `shops`(`shopCode`) ON DELETE RESTRICT ON UPDATE CASCADE;
