-- CreateTable
CREATE TABLE `push_tokens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ownerType` VARCHAR(191) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `expoPushToken` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL,
    `updatedAt` TIMESTAMP(3) NOT NULL,

    UNIQUE INDEX `push_tokens_expoPushToken_key`(`expoPushToken`),
    INDEX `push_tokens_ownerType_ownerId_idx`(`ownerType`, `ownerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
