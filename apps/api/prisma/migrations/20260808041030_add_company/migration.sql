-- CreateTable
CREATE TABLE `companies` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `coType` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `businessRegNo` VARCHAR(191) NOT NULL,
    `representativeName` VARCHAR(191) NULL,
    `contactName` VARCHAR(191) NULL,
    `contactPhone` VARCHAR(191) NULL,
    `shopCode` CHAR(10) NULL,
    `useYn` BOOLEAN NOT NULL DEFAULT true,
    `suspendReason` TEXT NULL,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` TIMESTAMP(3) NOT NULL,

    UNIQUE INDEX `companies_shopCode_key`(`shopCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `companies` ADD CONSTRAINT `companies_shopCode_fkey` FOREIGN KEY (`shopCode`) REFERENCES `shops`(`shopCode`) ON DELETE SET NULL ON UPDATE CASCADE;

