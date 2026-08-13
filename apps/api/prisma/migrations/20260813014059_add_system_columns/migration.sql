-- 자체 id(PK)를 가지고 수정 UI가 있는 14개 테이블에 시스템 컬럼(등록자/수정자) 추가.
-- 순수 다대다 매핑/정송 테이블(ProductDealerMapping, ShopInstCategory, BidPlanItem 등,
-- 항상 삭제 후 재생성만 하고 UPDATE를 쓰지 않음)은 대상에서 제외(2026-08-13 사용자 확정).
-- createdAt/updatedAt은 이미 모든 대상 테이블에 있어 변경 없음 — createdBy/updatedBy만 nullable로 추가,
-- 값 채우기(각 서비스에서 로그인 계정 username을 실제로 기록)는 후속 작업.

-- AlterTable
ALTER TABLE `bid_offers` ADD COLUMN `createdBy` VARCHAR(191) NULL,
    ADD COLUMN `updatedBy` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `bid_plans` ADD COLUMN `createdBy` VARCHAR(191) NULL,
    ADD COLUMN `updatedBy` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `bid_requests` ADD COLUMN `createdBy` VARCHAR(191) NULL,
    ADD COLUMN `updatedBy` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `common_code_details` ADD COLUMN `createdBy` VARCHAR(191) NULL,
    ADD COLUMN `updatedBy` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `common_codes` ADD COLUMN `createdBy` VARCHAR(191) NULL,
    ADD COLUMN `updatedBy` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `companies` ADD COLUMN `createdBy` VARCHAR(191) NULL,
    ADD COLUMN `updatedBy` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `menu_permissions` ADD COLUMN `createdBy` VARCHAR(191) NULL,
    ADD COLUMN `updatedBy` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `my_cars` ADD COLUMN `createdBy` VARCHAR(191) NULL,
    ADD COLUMN `updatedBy` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `partner_users` ADD COLUMN `createdBy` VARCHAR(191) NULL,
    ADD COLUMN `updatedBy` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `products` ADD COLUMN `createdBy` VARCHAR(191) NULL,
    ADD COLUMN `updatedBy` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `reservations` ADD COLUMN `createdBy` VARCHAR(191) NULL,
    ADD COLUMN `updatedBy` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `reviews` ADD COLUMN `createdBy` VARCHAR(191) NULL,
    ADD COLUMN `updatedBy` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `shops` ADD COLUMN `createdBy` VARCHAR(191) NULL,
    ADD COLUMN `updatedBy` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `createdBy` VARCHAR(191) NULL,
    ADD COLUMN `updatedBy` VARCHAR(191) NULL;

