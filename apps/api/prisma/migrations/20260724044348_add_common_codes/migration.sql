-- CreateTable
CREATE TABLE `common_codes` (
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `useYn` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` TIMESTAMP(3) NOT NULL,

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `common_code_details` (
    `code` VARCHAR(191) NOT NULL,
    `detailCode` VARCHAR(191) NOT NULL,
    `detailName` VARCHAR(191) NOT NULL,
    `ref1` VARCHAR(191) NULL,
    `ref2` VARCHAR(191) NULL,
    `useYn` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` TIMESTAMP(3) NOT NULL,

    PRIMARY KEY (`code`, `detailCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `common_code_details` ADD CONSTRAINT `common_code_details_code_fkey` FOREIGN KEY (`code`) REFERENCES `common_codes`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;
