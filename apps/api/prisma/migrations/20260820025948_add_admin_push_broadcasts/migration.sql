-- CreateTable
CREATE TABLE `admin_push_broadcasts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `targetType` VARCHAR(191) NOT NULL,
    `scope` VARCHAR(191) NOT NULL,
    `targetCount` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` VARCHAR(191) NOT NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
