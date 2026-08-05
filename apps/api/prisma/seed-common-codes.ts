// 공통코드 마스터/상세 시드 — 딜러사/차량브랜드/차종/윈도우 틴팅 농도/자동차 시공 코드값 일괄 등록(재실행해도 안전한 upsert)
import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import { parseDatabaseUrl } from '../src/common/db/mariadb-config';

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(parseDatabaseUrl(process.env.DATABASE_URL as string)),
});

const MASTERS: { code: string; name: string }[] = [
  { code: 'DEALER', name: '딜러사' },
  { code: 'CAR_BRAND', name: '차량브랜드' },
  { code: 'CAR_MODEL', name: '차종' },
  { code: 'VLT', name: '윈도우 틴팅 농도' },
  { code: 'CAR_INST', name: '자동차 시공' },
  { code: 'PROD_TYPE', name: '상품유형' },
  { code: 'PROD_BRAND', name: '상품브랜드' },
  { code: 'PROD_CAT', name: '상품분류' },
  { code: 'CAR_REG_TYPE', name: '차량 등록구분' },
  { code: 'BUNDLE_ITEM_TYPE', name: '패키지 구성상품 유형' },
  { code: 'SHOP_PHOTO_TYPE', name: '시공업체 사진 유형' },
  { code: 'SHOP_DAY_TYPE', name: '시공업체 요일구분' },
  { code: 'RESERVATION_TYPE', name: '예약유형' },
  { code: 'RESERVATION_STATUS', name: '예약상태' },
  { code: 'RESERVATION_PROGRESS', name: '예약 시공 진행상태' },
  { code: 'CANCEL_REASON', name: '예약취소 사유' },
  { code: 'BID_REQ_TYPE', name: '예약시공 요청유형' },
  { code: 'BID_REQ_STATUS', name: '예약시공 요청상태' },
  { code: 'BID_TINT_POSITION', name: '예약시공 틴팅 시공부위' },
  { code: 'BID_CANCEL_REASON', name: '예약시공 요청 취소사유' },
  { code: 'CALL_RESULT', name: '해피콜 통화결과' },
];

interface DetailRow {
  code: string;
  detailCode: string;
  detailName: string;
  ref1?: string;
  ref2?: string;
}

const DETAILS: DetailRow[] = [
  // DEALER
  { code: 'DEALER', detailCode: 'KCC', detailName: 'KCC 오토' },
  { code: 'DEALER', detailCode: 'EO', detailName: '에펠오토' },
  { code: 'DEALER', detailCode: 'AP', detailName: '아우토플라츠' },

  // CAR_BRAND
  { code: 'CAR_BRAND', detailCode: 'BENZ', detailName: '벤츠' },
  { code: 'CAR_BRAND', detailCode: 'BYD', detailName: 'BYD' },
  { code: 'CAR_BRAND', detailCode: 'PGT', detailName: '푸조' },
  { code: 'CAR_BRAND', detailCode: 'VSG', detailName: '폭스바겐' },
  { code: 'CAR_BRAND', detailCode: 'BMW', detailName: 'BMW' },
  { code: 'CAR_BRAND', detailCode: 'HD', detailName: '현대' },
  { code: 'CAR_BRAND', detailCode: 'KIA', detailName: '기아' },
  { code: 'CAR_BRAND', detailCode: 'TSL', detailName: '테슬라' },

  // CAR_MODEL (ref1 = 소속 브랜드코드 = CAR_BRAND.code)
  { code: 'CAR_MODEL', detailCode: 'SEAL', detailName: 'SEAL', ref1: 'BYD' },
  { code: 'CAR_MODEL', detailCode: 'SEAL7', detailName: 'SEALION 7', ref1: 'BYD' },
  { code: 'CAR_MODEL', detailCode: 'ATT3', detailName: 'ATTO 3', ref1: 'BYD' },
  { code: 'CAR_MODEL', detailCode: 'DOLP', detailName: 'DOLPHIN', ref1: 'BYD' },
  { code: 'CAR_MODEL', detailCode: 'B-A', detailName: 'A-Class', ref1: 'BENZ' },
  { code: 'CAR_MODEL', detailCode: 'B-B', detailName: 'B-Class', ref1: 'BENZ' },
  { code: 'CAR_MODEL', detailCode: 'B-C', detailName: 'C-Class', ref1: 'BENZ' },
  { code: 'CAR_MODEL', detailCode: 'B-CL', detailName: 'CL-Class', ref1: 'BENZ' },
  { code: 'CAR_MODEL', detailCode: 'B-CLA', detailName: 'CLA-Class', ref1: 'BENZ' },
  // 원본 자료엔 상세코드가 위 CLA-Class 행과 동일한 "B-CLA"로 중복 기재돼 있어(오타로 판단) "B-CLK"으로 보정
  { code: 'CAR_MODEL', detailCode: 'B-CLK', detailName: 'CLK-Class', ref1: 'BENZ' },
  { code: 'CAR_MODEL', detailCode: 'B-E', detailName: 'E-Class', ref1: 'BENZ' },
  { code: 'CAR_MODEL', detailCode: 'B-AMG', detailName: 'AMG GT', ref1: 'BENZ' },
  { code: 'CAR_MODEL', detailCode: 'B-SLR', detailName: 'SLR', ref1: 'BENZ' },
  { code: 'CAR_MODEL', detailCode: 'GOLF', detailName: 'Golf', ref1: 'VSG' },
  { code: 'CAR_MODEL', detailCode: 'GOLFG', detailName: 'Golf GTI', ref1: 'VSG' },
  { code: 'CAR_MODEL', detailCode: 'ID4', detailName: 'ID.4', ref1: 'VSG' },
  { code: 'CAR_MODEL', detailCode: 'ID5', detailName: 'ID.5', ref1: 'VSG' },
  { code: 'CAR_MODEL', detailCode: 'K5', detailName: 'K5', ref1: 'KIA' },
  { code: 'CAR_MODEL', detailCode: 'SRT', detailName: '쏘렌토', ref1: 'KIA' },
  { code: 'CAR_MODEL', detailCode: 'SPT', detailName: '스포티지', ref1: 'KIA' },

  // VLT — 상세코드(pk)가 원본에 비어있어 상세코드명과 동일한 값("5"/"15"/"30")으로 채움
  { code: 'VLT', detailCode: '5', detailName: '5' },
  { code: 'VLT', detailCode: '15', detailName: '15' },
  { code: 'VLT', detailCode: '30', detailName: '30' },

  // CAR_INST
  { code: 'CAR_INST', detailCode: 'TINT', detailName: '썬팅(틴팅)' },
  { code: 'CAR_INST', detailCode: 'PPF', detailName: 'PPF' },
  { code: 'CAR_INST', detailCode: 'CCA', detailName: '유리막 코팅' },
  { code: 'CAR_INST', detailCode: 'BBOX', detailName: '블랙박스' },
  { code: 'CAR_INST', detailCode: 'CLEAN', detailName: '실내크리닝' },
  { code: 'CAR_INST', detailCode: 'UCOAT', detailName: '언더코팅' },
  // 예약시공(입찰) 카테고리 중 기존 6개와 겹치지 않는 2개 추가(외장수리/휠·타이어)
  { code: 'CAR_INST', detailCode: 'EXTREP', detailName: '외장수리' },
  { code: 'CAR_INST', detailCode: 'WHTIRE', detailName: '휠·타이어' },

  // PROD_TYPE — 모토페이가 실물상품(쇼핑몰)과 시공서비스(예약시공)를 함께 취급하는 걸 반영해 3종으로 구분(제안값)
  { code: 'PROD_TYPE', detailCode: 'GOODS', detailName: '실물상품' },
  { code: 'PROD_TYPE', detailCode: 'SVC', detailName: '시공서비스' },
  { code: 'PROD_TYPE', detailCode: 'PKG', detailName: '패키지상품' },

  // PROD_BRAND — 코드성 컬럼 규칙(대문자 영문/숫자, 가급적 약어) 적용. detailName에 원래 한글 브랜드명을 보존
  { code: 'PROD_BRAND', detailCode: 'ZIC', detailName: 'ZIC' },
  { code: 'PROD_BRAND', detailCode: 'INAVI', detailName: '아이나비' },
  { code: 'PROD_BRAND', detailCode: 'LLUMAR', detailName: '루마 (LLumar)' },
  { code: 'PROD_BRAND', detailCode: 'GYEON', detailName: '게코 (GYEON)' },
  { code: 'PROD_BRAND', detailCode: 'MICH', detailName: '미쉐린' },
  { code: 'PROD_BRAND', detailCode: 'MCARE', detailName: '모토케어' },
  { code: 'PROD_BRAND', detailCode: 'XTAL', detailName: '크리스탈' },
  { code: 'PROD_BRAND', detailCode: 'KSNAVI', detailName: '김성네비' },
  { code: 'PROD_BRAND', detailCode: 'GTINT', detailName: '글라스틴트' },
  { code: 'PROD_BRAND', detailCode: 'HUPER', detailName: '후퍼옵틱' },
  { code: 'PROD_BRAND', detailCode: 'FINEVU', detailName: '파인뷰' },

  // PROD_CAT — 코드성 컬럼 규칙 적용(기존 소문자 영문 → 대문자 약어)
  { code: 'PROD_CAT', detailCode: 'ENGOIL', detailName: '엔진오일' },
  { code: 'PROD_CAT', detailCode: 'BBOX', detailName: '블랙박스' },
  { code: 'PROD_CAT', detailCode: 'TINT', detailName: '썬팅' },
  { code: 'PROD_CAT', detailCode: 'COAT', detailName: '코팅' },
  { code: 'PROD_CAT', detailCode: 'TIRE', detailName: '타이어' },
  { code: 'PROD_CAT', detailCode: 'PPF', detailName: 'PPF(도장보호필름)' },
  { code: 'PROD_CAT', detailCode: 'WASH', detailName: '세차' },
  { code: 'PROD_CAT', detailCode: 'ETC', detailName: '기타용품' },
  // 예약시공(입찰) 전문가추천 상품카탈로그 연동을 위해 CAR_INST와 짝을 맞춰 추가(CLEAN/UCOAT/EXTREP는 기존 PROD_CAT에 대응 코드가 없었음)
  { code: 'PROD_CAT', detailCode: 'CLEAN', detailName: '실내크리닝' },
  { code: 'PROD_CAT', detailCode: 'UCOAT', detailName: '언더코팅' },
  { code: 'PROD_CAT', detailCode: 'EXTREP', detailName: '외장수리' },

  // CAR_REG_TYPE
  { code: 'CAR_REG_TYPE', detailCode: 'MAP', detailName: '신차매핑' },
  { code: 'CAR_REG_TYPE', detailCode: 'MANUAL', detailName: '수기등록' },

  // BUNDLE_ITEM_TYPE — 패키지 구성상품 유형: 기본상품(무상) / 업그레이드옵션(같은 상품분류 내 대체, 유상) / 추가옵션(패키지 미포함 분류, 유상)
  { code: 'BUNDLE_ITEM_TYPE', detailCode: 'BASIC', detailName: '기본상품(무상)' },
  { code: 'BUNDLE_ITEM_TYPE', detailCode: 'OPTION', detailName: '업그레이드옵션(같은 상품분류 내 대체, 유상)' },
  { code: 'BUNDLE_ITEM_TYPE', detailCode: 'ADD', detailName: '추가옵션(패키지 미포함 분류, 유상)' },

  // SHOP_PHOTO_TYPE — 시공업체 사진 용도 구분
  { code: 'SHOP_PHOTO_TYPE', detailCode: 'MAIN', detailName: '대표사진' },
  { code: 'SHOP_PHOTO_TYPE', detailCode: 'CASE', detailName: '시공 사례' },

  // SHOP_DAY_TYPE — 시공업체 예약가능 시간대 템플릿의 요일구분
  { code: 'SHOP_DAY_TYPE', detailCode: 'WEEKDAY', detailName: '평일' },
  { code: 'SHOP_DAY_TYPE', detailCode: 'SAT', detailName: '토요일' },
  { code: 'SHOP_DAY_TYPE', detailCode: 'SUN', detailName: '일요일' },
  { code: 'SHOP_DAY_TYPE', detailCode: 'HOLIDAY', detailName: '공휴일' },

  // RESERVATION_TYPE — 예약이 어떤 경로로 생성됐는지 구분
  { code: 'RESERVATION_TYPE', detailCode: 'PKG', detailName: '신차패키지' },
  { code: 'RESERVATION_TYPE', detailCode: 'BID', detailName: '일반입찰' },

  // RESERVATION_STATUS — 예약 상태
  { code: 'RESERVATION_STATUS', detailCode: 'CONFIRMED', detailName: '예약확정' },
  { code: 'RESERVATION_STATUS', detailCode: 'CANCELLED', detailName: '예약취소' },

  // RESERVATION_PROGRESS — 예약확정(CONFIRMED) 건의 시공 진행상태
  { code: 'RESERVATION_PROGRESS', detailCode: 'APPLIED', detailName: '신청' },
  { code: 'RESERVATION_PROGRESS', detailCode: 'IN_PROGRESS', detailName: '시공중' },
  { code: 'RESERVATION_PROGRESS', detailCode: 'DONE', detailName: '시공완료' },

  // CANCEL_REASON — 예약 취소 사유(고객앱 CU-RSVC-22 취소 사유 선택지와 동일)
  { code: 'CANCEL_REASON', detailCode: 'SCHED', detailName: '일정 변경이 필요해요' },
  { code: 'CANCEL_REASON', detailCode: 'OTHER_SHOP', detailName: '다른 업체를 이용하고 싶어요' },
  { code: 'CANCEL_REASON', detailCode: 'COST', detailName: '비용이 부담돼요' },
  { code: 'CANCEL_REASON', detailCode: 'CHANGE_MIND', detailName: '단순 변심' },
  { code: 'CANCEL_REASON', detailCode: 'ETC', detailName: '기타' },

  // BID_REQ_TYPE — 예약시공 요청유형
  { code: 'BID_REQ_TYPE', detailCode: 'GENERAL', detailName: '일반입찰' },
  { code: 'BID_REQ_TYPE', detailCode: 'EXPERT', detailName: '전문가추천' },

  // BID_REQ_STATUS — 예약시공 요청상태(1단계는 OPEN만 생성되지만 전체 라이프사이클을 미리 등록)
  { code: 'BID_REQ_STATUS', detailCode: 'OPEN', detailName: '입찰중' },
  { code: 'BID_REQ_STATUS', detailCode: 'CLOSED', detailName: '입찰마감' },
  { code: 'BID_REQ_STATUS', detailCode: 'SELECTED', detailName: '선정완료' },
  { code: 'BID_REQ_STATUS', detailCode: 'CANCELLED', detailName: '취소' },

  // BID_TINT_POSITION — 틴팅 시공 부위(PosLvlSelScreen 공용 5부위)
  { code: 'BID_TINT_POSITION', detailCode: 'FRONT', detailName: '전면유리' },
  { code: 'BID_TINT_POSITION', detailCode: 'SIDE_1', detailName: '측면 1열' },
  { code: 'BID_TINT_POSITION', detailCode: 'SIDE_2', detailName: '측면 2열' },
  { code: 'BID_TINT_POSITION', detailCode: 'REAR', detailName: '후면유리' },
  { code: 'BID_TINT_POSITION', detailCode: 'SUNROOF', detailName: '선루프' },

  // BID_CANCEL_REASON — 예약시공 요청 취소사유
  { code: 'BID_CANCEL_REASON', detailCode: 'SIMPLE', detailName: '단순변심' },
  { code: 'BID_CANCEL_REASON', detailCode: 'RE_REQUEST', detailName: '추후 재요청' },
  { code: 'BID_CANCEL_REASON', detailCode: 'ETC', detailName: '기타' },

  // CALL_RESULT — 해피콜(고객 확인 전화) 통화결과(RsvcCallLogSheet.tsx CALL_RESULT_META와 동일)
  { code: 'CALL_RESULT', detailCode: 'CONNECTED', detailName: '연결됨' },
  { code: 'CALL_RESULT', detailCode: 'NOANSWER', detailName: '부재중' },
  { code: 'CALL_RESULT', detailCode: 'RETRY', detailName: '재통화예정' },
];

async function main() {
  for (const m of MASTERS) {
    await prisma.commonCode.upsert({
      where: { code: m.code },
      update: { name: m.name },
      create: { code: m.code, name: m.name },
    });
  }
  console.log(`공통코드 마스터 ${MASTERS.length}건 완료`);

  for (const d of DETAILS) {
    await prisma.commonCodeDetail.upsert({
      where: { code_detailCode: { code: d.code, detailCode: d.detailCode } },
      update: { detailName: d.detailName, ref1: d.ref1 ?? null, ref2: d.ref2 ?? null },
      create: {
        code: d.code,
        detailCode: d.detailCode,
        detailName: d.detailName,
        ref1: d.ref1 ?? null,
        ref2: d.ref2 ?? null,
      },
    });
  }
  console.log(`공통코드 상세 ${DETAILS.length}건 완료`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
