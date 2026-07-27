-- AlterTable
ALTER TABLE `users` ADD COLUMN `email` VARCHAR(191) NULL,
    ADD COLUMN `phoneHash` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `users_phoneHash_idx` ON `users`(`phoneHash`);
