-- CreateTable
CREATE TABLE `partner_users` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `phoneEncrypted` VARCHAR(191) NOT NULL,
    `phoneHash` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `shopCode` CHAR(10) NOT NULL,
    `mustChangePassword` BOOLEAN NOT NULL DEFAULT true,
    `useYn` BOOLEAN NOT NULL DEFAULT true,
    `lastLoginAt` TIMESTAMP(3) NULL,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` TIMESTAMP(3) NOT NULL,

    UNIQUE INDEX `partner_users_username_key`(`username`),
    INDEX `partner_users_phoneHash_idx`(`phoneHash`),
    INDEX `partner_users_shopCode_idx`(`shopCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `partner_users` ADD CONSTRAINT `partner_users_shopCode_fkey` FOREIGN KEY (`shopCode`) REFERENCES `shops`(`shopCode`) ON DELETE RESTRICT ON UPDATE CASCADE;

