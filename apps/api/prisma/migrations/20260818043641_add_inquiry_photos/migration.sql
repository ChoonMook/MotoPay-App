-- CreateTable
CREATE TABLE `inquiry_photos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `inquiryId` INTEGER NOT NULL,
    `photoPath` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `inquiry_photos_inquiryId_idx`(`inquiryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `inquiry_photos` ADD CONSTRAINT `inquiry_photos_inquiryId_fkey` FOREIGN KEY (`inquiryId`) REFERENCES `inquiries`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
