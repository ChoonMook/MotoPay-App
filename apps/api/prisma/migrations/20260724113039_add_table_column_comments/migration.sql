-- 테이블/컬럼 논리명 파악을 위한 COMMENT 추가 (schema.prisma의 한글 설명을 DB 코멘트로 반영)
-- Prisma가 DB COMMENT를 관리하지 않아(schema.prisma에 반영 안 됨) 수기 작성한 마이그레이션

-- AlterTable
ALTER TABLE `users` COMMENT = '사용자 통합 테이블 — 관리자/파트너사(딜러)/시공업체/공급업체/일반고객을 role로 구분';

ALTER TABLE `users`
  MODIFY COLUMN `id` VARCHAR(191) NOT NULL COMMENT '사용자 고유 ID(UUID)',
  MODIFY COLUMN `username` VARCHAR(191) NOT NULL COMMENT '로그인 아이디',
  MODIFY COLUMN `passwordHash` VARCHAR(191) NOT NULL COMMENT '비밀번호 해시',
  MODIFY COLUMN `name` VARCHAR(191) NOT NULL COMMENT '이름',
  MODIFY COLUMN `role` ENUM('ADMIN','PARTNER','SHOP','SUPPLIER','CUSTOMER') NOT NULL COMMENT '사용자 유형',
  MODIFY COLUMN `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '가입일시',
  MODIFY COLUMN `updatedAt` TIMESTAMP(3) NOT NULL COMMENT '수정일시',
  MODIFY COLUMN `agreedMarketingEmail` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '마케팅 이메일 수신 동의(선택)',
  MODIFY COLUMN `agreedMarketingPush` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '마케팅 푸시 수신 동의(선택)',
  MODIFY COLUMN `agreedMarketingSms` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '마케팅 SMS 수신 동의(선택)',
  MODIFY COLUMN `agreedPrivacy` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '개인정보 처리방침 동의(필수)',
  MODIFY COLUMN `agreedTerms` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '서비스 이용약관 동의(필수)',
  MODIFY COLUMN `lastLoginAt` TIMESTAMP(3) NULL DEFAULT NULL COMMENT '최종 로그인 일시',
  MODIFY COLUMN `phoneEncrypted` VARCHAR(191) DEFAULT NULL COMMENT '휴대폰번호(AES-256-GCM 암호화, 평문 미저장)',
  MODIFY COLUMN `email` VARCHAR(191) DEFAULT NULL COMMENT '이메일',
  MODIFY COLUMN `phoneHash` VARCHAR(191) DEFAULT NULL COMMENT '휴대폰번호 HMAC-SHA256 해시(평문 대조 없이 동일 번호 검색용)',
  MODIFY COLUMN `profileImagePath` VARCHAR(191) DEFAULT NULL COMMENT '프로필 사진 경로(서버 uploads/ 기준 상대경로)';

-- AlterTable
ALTER TABLE `common_codes` COMMENT = '공통코드 마스터 — 딜러사/차량브랜드/차종/틴팅농도/시공유형 등 플랫폼 전반의 참조 코드 그룹';

ALTER TABLE `common_codes`
  MODIFY COLUMN `code` VARCHAR(191) NOT NULL COMMENT '공통코드(PK), 예: CAR_BRAND',
  MODIFY COLUMN `name` VARCHAR(191) NOT NULL COMMENT '공통코드명, 예: 차량브랜드',
  MODIFY COLUMN `useYn` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '사용여부',
  MODIFY COLUMN `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '생성일시',
  MODIFY COLUMN `updatedAt` TIMESTAMP(3) NOT NULL COMMENT '수정일시';

-- AlterTable
ALTER TABLE `common_code_details` COMMENT = '공통코드 상세 — 마스터 코드 그룹에 속한 개별 코드값';

ALTER TABLE `common_code_details`
  MODIFY COLUMN `code` VARCHAR(191) NOT NULL COMMENT '공통코드(FK -> common_codes.code)',
  MODIFY COLUMN `detailCode` VARCHAR(191) NOT NULL COMMENT '상세코드(PK)',
  MODIFY COLUMN `detailName` VARCHAR(191) NOT NULL COMMENT '상세코드명',
  MODIFY COLUMN `ref1` VARCHAR(191) DEFAULT NULL COMMENT '참조1, 예: CAR_MODEL의 소속 브랜드코드(CAR_BRAND.code)',
  MODIFY COLUMN `ref2` VARCHAR(191) DEFAULT NULL COMMENT '참조2',
  MODIFY COLUMN `useYn` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '사용여부',
  MODIFY COLUMN `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '생성일시',
  MODIFY COLUMN `updatedAt` TIMESTAMP(3) NOT NULL COMMENT '수정일시';

-- AlterTable
ALTER TABLE `products` COMMENT = '상품정보 — 쇼핑몰/시공서비스/패키지 등 모토페이가 취급하는 모든 상품의 마스터';

ALTER TABLE `products`
  MODIFY COLUMN `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '내부 시퀀스(productCode 채번 전용, 외부 미노출)',
  MODIFY COLUMN `productCode` CHAR(10) NOT NULL COMMENT '상품코드(id를 10자리 0-padding해 자동 채번)',
  MODIFY COLUMN `prodType` VARCHAR(191) NOT NULL COMMENT '상품유형(GOODS/SVC/PKG) -> common_code_details(code=PROD_TYPE)',
  MODIFY COLUMN `brand` VARCHAR(191) DEFAULT NULL COMMENT '브랜드 -> common_code_details(code=PROD_BRAND), 패키지(PKG)는 null 허용',
  MODIFY COLUMN `prodCat` VARCHAR(191) DEFAULT NULL COMMENT '상품분류명 -> common_code_details(code=PROD_CAT), 패키지(PKG)는 null 허용',
  MODIFY COLUMN `name` VARCHAR(191) NOT NULL COMMENT '상품명',
  MODIFY COLUMN `price` INT(11) NOT NULL COMMENT '판매가(원), 소비자가',
  MODIFY COLUMN `originPrice` INT(11) DEFAULT NULL COMMENT '정가(할인 전 가격), 없으면 할인 없는 상품',
  MODIFY COLUMN `description` TEXT DEFAULT NULL COMMENT '상품설명',
  MODIFY COLUMN `imagePath` VARCHAR(191) DEFAULT NULL COMMENT '상품이미지 경로(서버 uploads/ 기준 상대경로)',
  MODIFY COLUMN `useYn` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '판매여부',
  MODIFY COLUMN `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '생성일시',
  MODIFY COLUMN `updatedAt` TIMESTAMP(3) NOT NULL COMMENT '수정일시',
  MODIFY COLUMN `supplyPrice` INT(11) DEFAULT NULL COMMENT '공급가(원), 공급업체 매입원가 — 고객 비노출, 내부 정산 전용',
  MODIFY COLUMN `dealerCode` VARCHAR(191) DEFAULT NULL COMMENT '딜러사코드 -> common_code_details(code=DEALER), 패키지(PKG)만 값 존재';

-- AlterTable
ALTER TABLE `product_bundle_items` COMMENT = '패키지 구성상품 매핑 — 패키지(PKG) 상품이 어떤 구성상품(SVC/GOODS)들로 이루어지는지 정의';

ALTER TABLE `product_bundle_items`
  MODIFY COLUMN `packageCode` VARCHAR(191) NOT NULL COMMENT '패키지 상품코드 -> products.productCode(prodType=PKG)',
  MODIFY COLUMN `componentCode` VARCHAR(191) NOT NULL COMMENT '구성상품 상품코드 -> products.productCode(prodType=SVC 또는 GOODS)',
  MODIFY COLUMN `qty` INT(11) NOT NULL DEFAULT 1 COMMENT '수량',
  MODIFY COLUMN `sortOrder` INT(11) NOT NULL DEFAULT 0 COMMENT '표시순서',
  MODIFY COLUMN `itemType` VARCHAR(191) NOT NULL DEFAULT 'BASIC' COMMENT '기본상품(BASIC,무상)/추가상품(OPTION,유상) 구분 -> common_code_details(code=BUNDLE_ITEM_TYPE)',
  MODIFY COLUMN `price` INT(11) DEFAULT NULL COMMENT '이 패키지 내 구성상품 적용가격(원), null이면 products.price 사용';

-- AlterTable
ALTER TABLE `new_car_purchase_customers` COMMENT = '신차 구매 고객 정보 — 딜러사 웹에서 등록, 회원가입 시 이름+휴대폰으로 자동 매핑';

ALTER TABLE `new_car_purchase_customers`
  MODIFY COLUMN `vin` VARCHAR(17) NOT NULL COMMENT '차대번호(VIN, 17자리, PK)',
  MODIFY COLUMN `dealerCode` VARCHAR(191) NOT NULL COMMENT '딜러사코드 -> common_code_details(code=DEALER)',
  MODIFY COLUMN `customerName` VARCHAR(191) NOT NULL COMMENT '고객명',
  MODIFY COLUMN `phoneEncrypted` VARCHAR(191) NOT NULL COMMENT '휴대폰번호(AES-256-GCM 암호화)',
  MODIFY COLUMN `phoneHash` VARCHAR(191) NOT NULL COMMENT '휴대폰번호 해시(회원가입 시 이름+휴대폰 매핑조회용)',
  MODIFY COLUMN `carBrandCode` VARCHAR(191) NOT NULL COMMENT '차량브랜드코드 -> common_code_details(code=CAR_BRAND)',
  MODIFY COLUMN `carModelCode` VARCHAR(191) NOT NULL COMMENT '차종코드 -> common_code_details(code=CAR_MODEL)',
  MODIFY COLUMN `trimName` VARCHAR(191) NOT NULL COMMENT '세부차종명',
  MODIFY COLUMN `packageCode` VARCHAR(191) DEFAULT NULL COMMENT '패키지상품코드 -> products.productCode(prodType=PKG)',
  MODIFY COLUMN `isMapped` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '매핑여부',
  MODIFY COLUMN `mappedAt` TIMESTAMP(3) NULL DEFAULT NULL COMMENT '매핑일시',
  MODIFY COLUMN `memberId` VARCHAR(191) DEFAULT NULL COMMENT '매핑된 회원ID -> users.id',
  MODIFY COLUMN `createdBy` VARCHAR(191) DEFAULT NULL COMMENT '등록자ID(딜러사 직원, 파트너 로그인 미구현으로 FK 없이 문자열 보관)',
  MODIFY COLUMN `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '생성일시',
  MODIFY COLUMN `updatedBy` VARCHAR(191) DEFAULT NULL COMMENT '수정자ID',
  MODIFY COLUMN `updatedAt` TIMESTAMP(3) NOT NULL COMMENT '수정일시',
  MODIFY COLUMN `modelYear` VARCHAR(191) DEFAULT NULL COMMENT '연식 — 신차매핑 시 my_cars.modelYear로 그대로 복사';

-- AlterTable
ALTER TABLE `my_cars` COMMENT = '내 차량 정보 — 신차구매 매핑(MAP) 또는 고객 직접등록(MANUAL)으로 생성되는 회원 보유 차량 목록';

ALTER TABLE `my_cars`
  MODIFY COLUMN `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '내부 ID',
  MODIFY COLUMN `memberId` VARCHAR(191) NOT NULL COMMENT '소유 회원 -> users.id',
  MODIFY COLUMN `regType` VARCHAR(191) NOT NULL COMMENT '등록구분(MAP=신차매핑/MANUAL=수기등록) -> common_code_details(code=CAR_REG_TYPE)',
  MODIFY COLUMN `purchaseVin` VARCHAR(191) DEFAULT NULL COMMENT '신차구매정보 연결 -> new_car_purchase_customers.vin(신차매핑인 경우만)',
  MODIFY COLUMN `carBrandCode` VARCHAR(191) NOT NULL COMMENT '차량브랜드코드 -> common_code_details(code=CAR_BRAND)',
  MODIFY COLUMN `carModelCode` VARCHAR(191) NOT NULL COMMENT '차종코드 -> common_code_details(code=CAR_MODEL)',
  MODIFY COLUMN `trimName` VARCHAR(191) DEFAULT NULL COMMENT '세부차종명',
  MODIFY COLUMN `modelYear` VARCHAR(191) DEFAULT NULL COMMENT '연식 — 신차매핑 시 구매정보에서 복사, 없으면 고객 직접입력',
  MODIFY COLUMN `plateNumber` VARCHAR(191) DEFAULT NULL COMMENT '차량번호 — 출고 직후 번호판 미배정 가능성으로 null 허용',
  MODIFY COLUMN `vin` VARCHAR(191) DEFAULT NULL COMMENT '차대번호',
  MODIFY COLUMN `isDefault` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '대표차량여부',
  MODIFY COLUMN `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '생성일시',
  MODIFY COLUMN `updatedAt` TIMESTAMP(3) NOT NULL COMMENT '수정일시',
  MODIFY COLUMN `dealerCode` VARCHAR(191) DEFAULT NULL COMMENT '딜러사코드 -> common_code_details(code=DEALER), 신차매핑 시 구매정보에서 복사';
