-- explicit_defaults_for_timestamp=OFF인 이 서버에서는 명시적 DEFAULT/ON UPDATE가 전혀 없는 첫 번째
-- TIMESTAMP NOT NULL 컬럼에 MariaDB가 자동으로 `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`를
-- 부여한다(이전 두 fix 마이그레이션에서 ALTER COLUMN ... DROP DEFAULT / MODIFY COLUMN(기본값 없이)으로도
-- 제거되지 않고 계속 재부여됨을 확인). ON UPDATE가 붙어 있으면 이후 다른 컬럼(status 등) 변경만으로도
-- bidDeadline 값이 조용히 지금 시각으로 바뀌는 실데이터 손상 버그가 생긴다.
-- 해결: 명시적으로 DEFAULT CURRENT_TIMESTAMP(3)만 선언(ON UPDATE는 선언하지 않음) — 명시적 DEFAULT가
-- 있으면 MariaDB가 이 컬럼을 "암묵 부여 대상"에서 제외해 ON UPDATE를 붙이지 않는다. 애플리케이션은
-- 생성 시 항상 bidDeadline을 명시적으로 계산해 넣으므로 이 DEFAULT 값 자체가 실사용되는 일은 없다.
ALTER TABLE `bid_requests` MODIFY COLUMN `bidDeadline` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
