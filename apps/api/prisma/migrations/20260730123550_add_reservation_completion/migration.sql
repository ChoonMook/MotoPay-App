-- AlterTable
ALTER TABLE `reservations` ADD COLUMN `completedAt` TIMESTAMP(3) NULL,
    ADD COLUMN `completionMemo` TEXT NULL;

-- CreateTable
CREATE TABLE `reservation_photos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reservationNo` VARCHAR(191) NOT NULL,
    `photoPath` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `reservation_photos_reservationNo_idx`(`reservationNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `reservation_photos` ADD CONSTRAINT `reservation_photos_reservationNo_fkey` FOREIGN KEY (`reservationNo`) REFERENCES `reservations`(`reservationNo`) ON DELETE RESTRICT ON UPDATE CASCADE;
