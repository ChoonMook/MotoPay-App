-- AlterTable
ALTER TABLE `admin_accounts` ADD COLUMN `companyId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `admin_accounts_companyId_idx` ON `admin_accounts`(`companyId`);

-- AddForeignKey
ALTER TABLE `admin_accounts` ADD CONSTRAINT `admin_accounts_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
