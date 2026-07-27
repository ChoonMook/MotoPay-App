-- AlterTable: name 컬럼 추가 (기존 행이 있어 임시 DEFAULT로 추가 후 백필, 마지막에 DROP DEFAULT로 스키마와 drift 없게 정리)
ALTER TABLE `partner_users` ADD COLUMN `name` VARCHAR(191) NOT NULL DEFAULT '__TEMP__';

-- 기존 테스트 계정(shopowner01)을 요청받은 샘플 데이터로 백필
UPDATE `partner_users` SET `name` = '김철수' WHERE `name` = '__TEMP__';

ALTER TABLE `partner_users` ALTER COLUMN `name` DROP DEFAULT;
