-- MariaDB의 TIMESTAMP 자동 DEFAULT/ON UPDATE 부여 규칙이 `ALTER COLUMN ... DROP DEFAULT`로는 완전히 제거되지 않아
-- (ON UPDATE CURRENT_TIMESTAMP가 계속 남음) 컬럼 정의 전체를 다시 쓰는 MODIFY COLUMN으로 강제 제거
ALTER TABLE `bid_requests` MODIFY COLUMN `bidDeadline` TIMESTAMP(3) NOT NULL;
