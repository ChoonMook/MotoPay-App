-- 시공업체 지도 표시·거리 계산용 위도/경도 컬럼 추가

ALTER TABLE `shops`
    ADD COLUMN `latitude` DOUBLE NULL COMMENT '위도 — 지도 표시·거리 계산용, 주소 등록 후 지오코딩으로 채움',
    ADD COLUMN `longitude` DOUBLE NULL COMMENT '경도';
