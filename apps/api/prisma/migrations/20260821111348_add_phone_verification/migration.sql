-- CreateTable
CREATE TABLE `phone_verifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `phoneHash` VARCHAR(191) NOT NULL,
    `purpose` ENUM('SIGNUP') NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `expiresAt` TIMESTAMP(3) NOT NULL,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `phone_verifications_phoneHash_purpose_idx`(`phoneHash`, `purpose`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
