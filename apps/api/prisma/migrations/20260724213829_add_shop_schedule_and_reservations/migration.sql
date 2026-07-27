-- 시공업체 휴무일/예약가능 시간대 템플릿/일자별 정원 오버라이드/예약 테이블 생성 (COMMENT 포함)

-- CreateTable
CREATE TABLE `shop_holidays` (
    `shopCode` VARCHAR(191) NOT NULL COMMENT '업체코드 -> shops.shopCode',
    `holidayDate` DATE NOT NULL COMMENT '휴무 일자',

    PRIMARY KEY (`shopCode`, `holidayDate`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '시공업체 휴무일 — 행이 존재하면 해당 일자는 휴무';

-- CreateTable
CREATE TABLE `shop_time_slots` (
    `shopCode` VARCHAR(191) NOT NULL COMMENT '업체코드 -> shops.shopCode',
    `dayType` VARCHAR(191) NOT NULL COMMENT '요일구분(WEEKDAY/SAT/SUN/HOLIDAY) -> common_code_details(code=SHOP_DAY_TYPE)',
    `time` TIME(0) NOT NULL COMMENT '예약 시간',
    `capacity` INTEGER NOT NULL COMMENT '예약 가능 대수',

    PRIMARY KEY (`shopCode`, `dayType`, `time`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '시공업체 예약가능 시간대 템플릿 — 요일구분별 반복되는 기본 시간대·정원';

-- CreateTable
CREATE TABLE `shop_daily_slots` (
    `shopCode` VARCHAR(191) NOT NULL COMMENT '업체코드 -> shops.shopCode',
    `date` DATE NOT NULL COMMENT '예약 일자',
    `time` TIME(0) NOT NULL COMMENT '예약 시간',
    `capacity` INTEGER NULL COMMENT '이 날짜·시간 한정 정원, null이면 shop_time_slots 템플릿값 사용',
    `isLocked` BOOLEAN NOT NULL DEFAULT false COMMENT '잠금 처리 여부(예약 불가)',

    PRIMARY KEY (`shopCode`, `date`, `time`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '시공업체 일자별 예약 슬롯 오버라이드 — 템플릿과 다른 정원을 적용하거나 잠글 때만 행이 생김';

-- CreateTable
CREATE TABLE `reservations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT COMMENT '내부 시퀀스(reservationNo 채번 전용, 외부 미노출)',
    `reservationNo` CHAR(10) NOT NULL COMMENT '예약번호(id를 10자리 0-padding해 자동 채번)',
    `shopCode` VARCHAR(191) NOT NULL COMMENT '시공업체 -> shops.shopCode',
    `date` DATE NOT NULL COMMENT '예약 일자',
    `time` TIME(0) NOT NULL COMMENT '예약 시간',
    `seq` INTEGER NOT NULL COMMENT '같은 shopCode+date+time 내 순번(1부터)',
    `reservationType` VARCHAR(191) NOT NULL COMMENT '예약유형(PKG=신차패키지/BID=일반입찰) -> common_code_details(code=RESERVATION_TYPE)',
    `memberId` VARCHAR(191) NOT NULL COMMENT '예약 고객 -> users.id',
    `status` VARCHAR(191) NOT NULL DEFAULT 'CONFIRMED' COMMENT '예약상태(CONFIRMED/CANCELLED) -> common_code_details(code=RESERVATION_STATUS)',
    `createdAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '생성일시',
    `updatedAt` TIMESTAMP(3) NOT NULL COMMENT '수정일시',

    UNIQUE INDEX `reservations_reservationNo_key`(`reservationNo`),
    INDEX `reservations_shopCode_date_time_idx`(`shopCode`, `date`, `time`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '시공 예약 — 고객이 시공업체의 특정 일자·시간에 등록한 예약 건';

-- AddForeignKey
ALTER TABLE `shop_holidays` ADD CONSTRAINT `shop_holidays_shopCode_fkey` FOREIGN KEY (`shopCode`) REFERENCES `shops`(`shopCode`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shop_time_slots` ADD CONSTRAINT `shop_time_slots_shopCode_fkey` FOREIGN KEY (`shopCode`) REFERENCES `shops`(`shopCode`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shop_daily_slots` ADD CONSTRAINT `shop_daily_slots_shopCode_fkey` FOREIGN KEY (`shopCode`) REFERENCES `shops`(`shopCode`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservations` ADD CONSTRAINT `reservations_shopCode_fkey` FOREIGN KEY (`shopCode`) REFERENCES `shops`(`shopCode`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservations` ADD CONSTRAINT `reservations_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
