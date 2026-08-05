-- CreateTable
CREATE TABLE `reservation_call_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reservationNo` VARCHAR(191) NOT NULL,
    `result` VARCHAR(191) NOT NULL,
    `memo` TEXT NULL,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `reservation_call_logs_reservationNo_idx`(`reservationNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `reservation_call_logs` ADD CONSTRAINT `reservation_call_logs_reservationNo_fkey` FOREIGN KEY (`reservationNo`) REFERENCES `reservations`(`reservationNo`) ON DELETE RESTRICT ON UPDATE CASCADE;
