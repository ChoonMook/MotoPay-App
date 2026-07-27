-- 이전 코멘트 마이그레이션(add_table_column_comments)의 MODIFY COLUMN이 updatedAt에
-- 의도치 않은 암묵적 기본값('0000-00-00 00:00:00.000')을 붙여, 원래대로 DEFAULT 없는 상태로 되돌림
-- (updatedAt은 Prisma @updatedAt으로 애플리케이션이 값을 채움, DB 기본값 불필요)

-- AlterTable
ALTER TABLE `common_code_details` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `common_codes` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `my_cars` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `new_car_purchase_customers` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `products` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `users` ALTER COLUMN `updatedAt` DROP DEFAULT;
