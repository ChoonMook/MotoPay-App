-- MariaDB의 explicit_defaults_for_timestamp=0 하에서, 같은 테이블에 TIMESTAMP 컬럼이 2개 이상 있으면
-- 명시적 DEFAULT가 없는 두 번째 이후 컬럼(여기서는 updatedAt)에 DEFAULT CURRENT_TIMESTAMP가 암묵적으로
-- 붙는 문제(반복 발생하는 기존 이슈) — Prisma 스키마 기대값과 맞추기 위해 제거
ALTER TABLE `product_shop_commissions` ALTER COLUMN `updatedAt` DROP DEFAULT;
ALTER TABLE `shop_settlement_batches` ALTER COLUMN `updatedAt` DROP DEFAULT;
ALTER TABLE `dealer_invoice_batches` ALTER COLUMN `updatedAt` DROP DEFAULT;
