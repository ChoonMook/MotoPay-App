-- 딜러사 참조를 CommonCodeDetail(code='DEALER') 코드 문자열에서 Company.id(coType='DEALER')로 통일
-- (2026-08-13 사용자 확정) — products/product_dealer_mappings/new_car_purchase_customers/my_cars 4개
-- 테이블에 걸쳐 있던 dealerCode(String) 컬럼을 dealerCompanyId(Int, companies FK)로 교체한다.
--
-- 기존 CommonCodeDetail(DEALER) 코드 중 'EO'(에펠오토)는 companies(coType='DEALER')에 대응 레코드가
-- 없어(실제 신차 구매내역 1건이 이미 이 코드를 참조 중), 플레이스홀더 Company 레코드를 먼저 생성한다.
-- businessRegNo 등 상세 정보는 임시값 — AD-CO 업체관리 화면에서 나중에 보완 필요.

-- CreatePlaceholderCompany (에펠오토)
-- companies는 AUTO_INCREMENT=24(적용 직전 재확인 완료)라 이 INSERT로 생성되는 id는 24로 확정적이다.
-- 세션 변수(LAST_INSERT_ID 등)는 migrate deploy가 각 statement를 어떤 커넥션으로 실행하는지 보장되지
-- 않아 대신 리터럴 값을 직접 사용한다 — 만약 다른 세션이 그 사이 companies에 행을 추가해 이 가정이
-- 깨지면, 아래 24를 참조하는 UPDATE가 존재하지 않는 회사를 가리키게 되고 뒤이은 FK 추가 단계에서
-- 즉시 에러로 드러나 안전하게 실패한다(조용한 데이터 오염 없음).
INSERT INTO `companies` (`coType`, `name`, `businessRegNo`, `useYn`, `approved`, `createdAt`, `updatedAt`)
VALUES ('DEALER', '에펠오토', '000-00-00000', 1, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

-- AddColumn (nullable 상태로 우선 추가 — 데이터 이관 후 NOT NULL로 전환)
ALTER TABLE `products` ADD COLUMN `dealerCompanyId` INTEGER NULL COMMENT '딜러사 -> companies.id(coType=DEALER), 패키지(PKG)만 값 존재';
ALTER TABLE `product_dealer_mappings` ADD COLUMN `dealerCompanyId` INTEGER NULL;
ALTER TABLE `new_car_purchase_customers` ADD COLUMN `dealerCompanyId` INTEGER NULL COMMENT '딜러사 -> companies.id(coType=DEALER)';
ALTER TABLE `my_cars` ADD COLUMN `dealerCompanyId` INTEGER NULL COMMENT '딜러사 -> companies.id(coType=DEALER), 신차매핑 시 구매정보에서 복사';

-- MigrateData (기존 CommonCodeDetail(DEALER) 코드 -> companies.id 매핑)
-- KCC='KCC 오토'(id=17), AP='아우토플라츠'(id=19)는 기존 companies 레코드, EO='에펠오토'는 위에서 새로 생성한 id=24
UPDATE `products` SET `dealerCompanyId` = CASE `dealerCode` WHEN 'KCC' THEN 17 WHEN 'AP' THEN 19 WHEN 'EO' THEN 24 END WHERE `dealerCode` IS NOT NULL;
UPDATE `product_dealer_mappings` SET `dealerCompanyId` = CASE `dealerCode` WHEN 'KCC' THEN 17 WHEN 'AP' THEN 19 WHEN 'EO' THEN 24 END;
UPDATE `new_car_purchase_customers` SET `dealerCompanyId` = CASE `dealerCode` WHEN 'KCC' THEN 17 WHEN 'AP' THEN 19 WHEN 'EO' THEN 24 END;
UPDATE `my_cars` SET `dealerCompanyId` = CASE `dealerCode` WHEN 'KCC' THEN 17 WHEN 'AP' THEN 19 WHEN 'EO' THEN 24 END WHERE `dealerCode` IS NOT NULL;

-- AlterTable (필수 컬럼은 NOT NULL로 전환)
ALTER TABLE `product_dealer_mappings` MODIFY COLUMN `dealerCompanyId` INTEGER NOT NULL;
ALTER TABLE `new_car_purchase_customers` MODIFY COLUMN `dealerCompanyId` INTEGER NOT NULL COMMENT '딜러사 -> companies.id(coType=DEALER)';

-- DropIndex
DROP INDEX `products_dealerCode_idx` ON `products`;

-- DropColumn (구 dealerCode 컬럼 제거 + product_dealer_mappings는 PK 컬럼 교체까지 한 번에)
ALTER TABLE `products` DROP COLUMN `dealerCode`;
ALTER TABLE `product_dealer_mappings` DROP PRIMARY KEY, DROP COLUMN `dealerCode`, ADD PRIMARY KEY (`productCode`, `dealerCompanyId`);
ALTER TABLE `new_car_purchase_customers` DROP COLUMN `dealerCode`;
ALTER TABLE `my_cars` DROP COLUMN `dealerCode`;

-- CreateIndex
CREATE INDEX `my_cars_dealerCompanyId_idx` ON `my_cars`(`dealerCompanyId`);
CREATE INDEX `new_car_purchase_customers_dealerCompanyId_idx` ON `new_car_purchase_customers`(`dealerCompanyId`);
CREATE INDEX `product_dealer_mappings_dealerCompanyId_idx` ON `product_dealer_mappings`(`dealerCompanyId`);
CREATE INDEX `products_dealerCompanyId_idx` ON `products`(`dealerCompanyId`);

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_dealerCompanyId_fkey` FOREIGN KEY (`dealerCompanyId`) REFERENCES `companies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `product_dealer_mappings` ADD CONSTRAINT `product_dealer_mappings_dealerCompanyId_fkey` FOREIGN KEY (`dealerCompanyId`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `new_car_purchase_customers` ADD CONSTRAINT `new_car_purchase_customers_dealerCompanyId_fkey` FOREIGN KEY (`dealerCompanyId`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `my_cars` ADD CONSTRAINT `my_cars_dealerCompanyId_fkey` FOREIGN KEY (`dealerCompanyId`) REFERENCES `companies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
