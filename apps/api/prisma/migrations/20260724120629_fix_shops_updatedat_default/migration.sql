-- CREATE TABLE에서 COMMENT를 넣은 컬럼 정의를 다시 쓰는 과정에서 shops/shop_photos.updatedAt에
-- MariaDB가 암묵적 기본값을 붙여, 원래대로 DEFAULT 없는 상태로 되돌림(CLAUDE.md 7절 참고)

-- AlterTable
ALTER TABLE `shop_photos` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `shops` ALTER COLUMN `updatedAt` DROP DEFAULT;
