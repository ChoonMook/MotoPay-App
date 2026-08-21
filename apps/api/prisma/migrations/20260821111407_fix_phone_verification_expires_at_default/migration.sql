-- AlterTable
-- MariaDB legacy 모드(explicit_defaults_for_timestamp=0)에서는 단순 "ALTER COLUMN ... DROP DEFAULT"로 기본값을 제거해도
-- expiresAt이 DEFAULT 없는 두 번째 TIMESTAMP 컬럼이라는 이유만으로 DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP가
-- 즉시 재적용됨(attempts 증가 UPDATE 때마다 만료시각이 "지금"으로 밀리는 실질 버그로 이어짐, 실측 확인됨) — 실제로 그 자동
-- 재부여를 막는 방법은 CURRENT_TIMESTAMP가 아닌 고정 더미 기본값을 명시하는 것뿐이라 아래로 대체함
ALTER TABLE `phone_verifications` MODIFY COLUMN `expiresAt` TIMESTAMP(3) NOT NULL DEFAULT '1970-01-01 00:00:01.000';
