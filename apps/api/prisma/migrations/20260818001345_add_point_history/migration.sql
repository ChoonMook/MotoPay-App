-- AlterTable
ALTER TABLE `users` ADD COLUMN `pointBalance` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `point_histories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `memberId` VARCHAR(191) NOT NULL,
    `kind` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `balanceAfter` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `reason` TEXT NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `point_histories_memberId_idx`(`memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `point_histories` ADD CONSTRAINT `point_histories_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
