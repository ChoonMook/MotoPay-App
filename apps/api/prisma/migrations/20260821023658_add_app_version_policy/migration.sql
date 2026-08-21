-- CreateTable
CREATE TABLE `app_version_policies` (
    `platform` VARCHAR(191) NOT NULL,
    `minVersionCode` INTEGER NOT NULL,
    `minVersionName` VARCHAR(191) NOT NULL,
    `latestVersionCode` INTEGER NULL,
    `latestVersionName` VARCHAR(191) NULL,
    `downloadUrl` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `useYn` BOOLEAN NOT NULL DEFAULT false,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedBy` VARCHAR(191) NULL,
    `updatedAt` TIMESTAMP(3) NOT NULL,

    PRIMARY KEY (`platform`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed initial ANDROID row (useYn=false: 관리자가 명시적으로 켜기 전까진 차단하지 않는 안전 기본값)
INSERT INTO `app_version_policies`
  (`platform`, `minVersionCode`, `minVersionName`, `latestVersionCode`, `latestVersionName`, `downloadUrl`, `message`, `useYn`, `updatedAt`)
VALUES
  ('ANDROID', 3, '0.0.0.3', 3, '0.0.0.3', '', '새로운 버전이 있어요. 계속 이용하시려면 앱을 업데이트해주세요.', false, CURRENT_TIMESTAMP(3));
