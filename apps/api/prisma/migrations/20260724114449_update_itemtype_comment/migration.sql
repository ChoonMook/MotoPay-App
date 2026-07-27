-- ADD(추가옵션) 타입 도입에 맞춰 product_bundle_items.itemType 코멘트 갱신
-- (컬럼 정의는 SHOW CREATE TABLE 확인값 그대로 유지, DEFAULT 유지)

ALTER TABLE `product_bundle_items`
  MODIFY COLUMN `itemType` VARCHAR(191) NOT NULL DEFAULT 'BASIC' COMMENT 'BASIC(기본상품,무상)/OPTION(업그레이드옵션,같은 상품분류 내 대체,유상)/ADD(추가옵션,패키지 미포함 분류,유상) 구분 -> common_code_details(code=BUNDLE_ITEM_TYPE)';
