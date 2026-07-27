-- CREATE TABLE에 COMMENT를 포함하며 reservations.updatedAt에 MariaDB가 붙인 암묵적 기본값 제거(CLAUDE.md 7절 참고)

ALTER TABLE `reservations` ALTER COLUMN `updatedAt` DROP DEFAULT;
