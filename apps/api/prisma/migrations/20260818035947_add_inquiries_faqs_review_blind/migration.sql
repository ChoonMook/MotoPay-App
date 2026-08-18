-- AlterTable
ALTER TABLE `reviews` ADD COLUMN `isBlinded` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `inquiries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `inquiryNo` CHAR(10) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `answer` TEXT NULL,
    `answeredBy` VARCHAR(191) NULL,
    `answeredAt` TIMESTAMP(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedBy` VARCHAR(191) NULL,
    `updatedAt` TIMESTAMP(3) NOT NULL,

    UNIQUE INDEX `inquiries_inquiryNo_key`(`inquiryNo`),
    INDEX `inquiries_memberId_idx`(`memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable: MariaDB가 두 번째 TIMESTAMP 컬럼(updatedAt)에 DEFAULT '0000-00-00 00:00:00'을 암묵적으로
-- 붙이는 부작용을 즉시 제거(CLAUDE.md 마이그레이션 규칙)
ALTER TABLE `inquiries` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- CreateTable
CREATE TABLE `faq_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `category` VARCHAR(191) NOT NULL,
    `question` VARCHAR(191) NOT NULL,
    `answer` TEXT NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `useYn` BOOLEAN NOT NULL DEFAULT true,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedBy` VARCHAR(191) NULL,
    `updatedAt` TIMESTAMP(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable: 동일한 암묵적 기본값 부작용 제거
ALTER TABLE `faq_items` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AddForeignKey
ALTER TABLE `inquiries` ADD CONSTRAINT `inquiries_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
