-- AlterTable
ALTER TABLE `reservations` ADD COLUMN `reschedDate` DATE NULL,
    ADD COLUMN `reschedReason` TEXT NULL,
    ADD COLUMN `reschedRejectReason` TEXT NULL,
    ADD COLUMN `reschedRequestedAt` TIMESTAMP(3) NULL,
    ADD COLUMN `reschedRespondedAt` TIMESTAMP(3) NULL,
    ADD COLUMN `reschedStatus` VARCHAR(191) NULL,
    ADD COLUMN `reschedTime` TIME(0) NULL;
