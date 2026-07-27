-- 시공업체 마스터/사진/시공가능카테고리 테이블 생성 (COMMENT는 신규 생성 시점에 함께 반영)

-- CreateTable
CREATE TABLE `shops` (
    `id` INTEGER NOT NULL AUTO_INCREMENT COMMENT '내부 시퀀스(shopCode 채번 전용, 외부 미노출)',
    `shopCode` CHAR(10) NOT NULL COMMENT '업체코드(id를 10자리 0-padding해 자동 채번)',
    `name` VARCHAR(191) NOT NULL COMMENT '업체명',
    `greeting` TEXT NULL COMMENT '인사말',
    `intro` TEXT NULL COMMENT '소개',
    `zipCode` VARCHAR(191) NULL COMMENT '우편번호',
    `address` VARCHAR(191) NULL COMMENT '주소',
    `addressDetail` VARCHAR(191) NULL COMMENT '상세주소',
    `phone` VARCHAR(191) NULL COMMENT '대표전화번호',
    `useYn` BOOLEAN NOT NULL DEFAULT true COMMENT '사용여부',
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '생성일시',
    `updatedAt` TIMESTAMP(3) NOT NULL COMMENT '수정일시',

    UNIQUE INDEX `shops_shopCode_key`(`shopCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '시공업체 마스터 — 틴팅/블랙박스/코팅 등 시공을 수행하는 업체 정보';

-- CreateTable
CREATE TABLE `shop_photos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT COMMENT '내부 ID',
    `shopCode` VARCHAR(191) NOT NULL COMMENT '소속 업체 -> shops.shopCode',
    `photoPath` VARCHAR(191) NOT NULL COMMENT '사진파일 경로(서버 uploads/ 기준 상대경로)',
    `photoType` VARCHAR(191) NOT NULL COMMENT '사진유형(MAIN=대표사진/CASE=시공사례) -> common_code_details(code=SHOP_PHOTO_TYPE)',
    `sortOrder` INTEGER NOT NULL DEFAULT 0 COMMENT '표시순서',
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '생성일시',
    `updatedAt` TIMESTAMP(3) NOT NULL COMMENT '수정일시',

    INDEX `shop_photos_shopCode_idx`(`shopCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '시공업체 사진 — 대표사진/시공 사례 등 용도별 사진 목록';

-- CreateTable
CREATE TABLE `shop_inst_categories` (
    `shopCode` VARCHAR(191) NOT NULL COMMENT '업체코드 -> shops.shopCode',
    `instCode` VARCHAR(191) NOT NULL COMMENT '자동차 시공코드 -> common_code_details(code=CAR_INST)',

    PRIMARY KEY (`shopCode`, `instCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '시공업체 시공가능 카테고리 매핑 — 업체가 지원하는 자동차 시공 항목';

-- AddForeignKey
ALTER TABLE `shop_photos` ADD CONSTRAINT `shop_photos_shopCode_fkey` FOREIGN KEY (`shopCode`) REFERENCES `shops`(`shopCode`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shop_inst_categories` ADD CONSTRAINT `shop_inst_categories_shopCode_fkey` FOREIGN KEY (`shopCode`) REFERENCES `shops`(`shopCode`) ON DELETE RESTRICT ON UPDATE CASCADE;
