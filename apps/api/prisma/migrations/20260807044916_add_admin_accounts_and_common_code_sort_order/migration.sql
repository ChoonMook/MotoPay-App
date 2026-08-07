-- AlterTable
ALTER TABLE `common_code_details` ADD COLUMN `sortOrder` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `admin_accounts` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phoneEncrypted` VARCHAR(191) NULL,
    `phoneHash` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `accountType` ENUM('ADMIN', 'PARTNER', 'SUPPLIER') NOT NULL,
    `permGroup` VARCHAR(191) NOT NULL,
    `useYn` BOOLEAN NOT NULL DEFAULT true,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,
    `lastLoginAt` TIMESTAMP(3) NULL,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` TIMESTAMP(3) NOT NULL,

    UNIQUE INDEX `admin_accounts_username_key`(`username`),
    INDEX `admin_accounts_phoneHash_idx`(`phoneHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
