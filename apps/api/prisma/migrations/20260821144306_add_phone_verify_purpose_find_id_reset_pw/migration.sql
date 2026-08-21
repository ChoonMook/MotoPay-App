-- AlterTable
-- expiresAt DEFAULT는 실제 저장된 값(세션 타임존 UTC+9 기준 '1970-01-01 09:00:01.000' = UTC 00:00:01)을 그대로
-- 유지한다 — Prisma가 스키마상의 UTC 리터럴('...00:00:01.000')을 그대로 재기술하면 이 세션 타임존에서는
-- UTC 이전(1969-12-31 15:00:01 UTC)으로 환산되어 TIMESTAMP 최소값 미만이 되며 "Invalid default value" 에러 발생
ALTER TABLE `phone_verifications` MODIFY `purpose` ENUM('SIGNUP', 'FIND_USERNAME', 'RESET_PASSWORD') NOT NULL,
    MODIFY `expiresAt` TIMESTAMP(3) NOT NULL DEFAULT '1970-01-01 09:00:01.000';
