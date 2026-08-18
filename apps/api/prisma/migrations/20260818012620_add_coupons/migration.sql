-- CreateTable
CREATE TABLE `coupons` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `couponNo` CHAR(10) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `couponType` VARCHAR(191) NOT NULL,
    `discountValue` INTEGER NOT NULL DEFAULT 0,
    `issuerType` VARCHAR(191) NOT NULL,
    `issuerCompanyId` INTEGER NULL,
    `targetType` VARCHAR(191) NOT NULL,
    `targetGrade` VARCHAR(191) NULL,
    `validFrom` DATE NOT NULL,
    `validTo` DATE NOT NULL,
    `issuedCount` INTEGER NOT NULL DEFAULT 0,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedBy` VARCHAR(191) NULL,
    `updatedAt` TIMESTAMP(3) NOT NULL,

    UNIQUE INDEX `coupons_couponNo_key`(`couponNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable: MariaDB가 두 번째 TIMESTAMP 컬럼(updatedAt)에 DEFAULT '0000-00-00 00:00:00'을 암묵적으로
-- 붙이는 부작용을 즉시 제거(CLAUDE.md 마이그레이션 규칙 — member_grade_rules에서도 동일 현상 확인됨)
ALTER TABLE `coupons` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- CreateTable
CREATE TABLE `coupon_issuances` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `couponId` INTEGER NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ISSUED',
    `usedAt` TIMESTAMP(3) NULL,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `coupon_issuances_memberId_idx`(`memberId`),
    UNIQUE INDEX `coupon_issuances_couponId_memberId_key`(`couponId`, `memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `coupons` ADD CONSTRAINT `coupons_issuerCompanyId_fkey` FOREIGN KEY (`issuerCompanyId`) REFERENCES `companies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coupon_issuances` ADD CONSTRAINT `coupon_issuances_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `coupons`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coupon_issuances` ADD CONSTRAINT `coupon_issuances_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
