-- AlterTable
ALTER TABLE `reservations` ADD COLUMN `requestNo` CHAR(10) NULL;

-- AddForeignKey
ALTER TABLE `reservations` ADD CONSTRAINT `reservations_requestNo_fkey` FOREIGN KEY (`requestNo`) REFERENCES `bid_requests`(`requestNo`) ON DELETE SET NULL ON UPDATE CASCADE;
