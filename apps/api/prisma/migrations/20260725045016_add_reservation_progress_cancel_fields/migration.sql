-- AlterTable
ALTER TABLE `reservations` ADD COLUMN `cancelReason` VARCHAR(191) NULL,
    ADD COLUMN `cancelReasonEtc` TEXT NULL,
    ADD COLUMN `cancelledAt` TIMESTAMP(3) NULL,
    ADD COLUMN `progressStatus` VARCHAR(191) NOT NULL DEFAULT 'APPLIED';

