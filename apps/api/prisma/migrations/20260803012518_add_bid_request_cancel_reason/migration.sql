-- AlterTable
ALTER TABLE `bid_requests` ADD COLUMN `cancelReason` VARCHAR(191) NULL,
    ADD COLUMN `cancelReasonNote` TEXT NULL;
