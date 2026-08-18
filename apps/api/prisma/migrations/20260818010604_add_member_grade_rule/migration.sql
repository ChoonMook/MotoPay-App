-- CreateTable
CREATE TABLE `member_grade_rules` (
    `gradeCode` VARCHAR(191) NOT NULL,
    `minSpendAmount` INTEGER NOT NULL DEFAULT 0,
    `discountRate` INTEGER NOT NULL DEFAULT 0,
    `voucherAmount` INTEGER NOT NULL DEFAULT 0,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedBy` VARCHAR(191) NULL,
    `updatedAt` TIMESTAMP(3) NOT NULL,

    PRIMARY KEY (`gradeCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
