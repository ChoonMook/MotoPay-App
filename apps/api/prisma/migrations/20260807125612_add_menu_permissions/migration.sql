-- CreateTable
CREATE TABLE `menu_permissions` (
    `id` VARCHAR(191) NOT NULL,
    `permGroup` VARCHAR(191) NOT NULL,
    `menuPgId` VARCHAR(191) NOT NULL,
    `canAccess` BOOLEAN NOT NULL DEFAULT false,
    `canRead` BOOLEAN NOT NULL DEFAULT false,
    `canWrite` BOOLEAN NOT NULL DEFAULT false,
    `canDelete` BOOLEAN NOT NULL DEFAULT false,
    `canFile` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` TIMESTAMP(3) NOT NULL,

    UNIQUE INDEX `menu_permissions_permGroup_menuPgId_key`(`permGroup`, `menuPgId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

