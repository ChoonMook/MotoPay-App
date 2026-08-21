// 공통코드 마스터/상세 시드 — 차량브랜드/차종/윈도우 틴팅 농도/자동차 시공 코드값 일괄 등록(재실행해도 안전한 upsert)
// 딜러사는 더 이상 공통코드가 아니라 companies 테이블(coType='DEALER')로 관리함(2026-08-13 사용자 확정)
import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import { parseDatabaseUrl } from '../src/common/db/mariadb-config';

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(parseDatabaseUrl(process.env.DATABASE_URL as string)),
});

const MASTERS: { code: string; name: string }[] = [
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
  { code: 'PERM_GROUP', name: '권한그룹' },
  { code: 'CO_TYPE', name: '업체구분' },
  { code: 'BIZ_DIV', name: '사업자구분' },
  { code: 'BANK', name: '은행' },
  { code: 'POINT_HIST_KIND', name: '포인트 내역 구분' },
  { code: 'COUPON_TYPE', name: '쿠폰 유형' },
  { code: 'COUPON_ISSUER_TYPE', name: '쿠폰 발행주체' },
  { code: 'COUPON_TARGET_TYPE', name: '쿠폰 발행대상' },
  { code: 'COUPON_ISSUANCE_STATUS', name: '쿠폰 발급 상태' },
  { code: 'INQUIRY_CATEGORY', name: '1:1문의 유형' },
  { code: 'INQUIRY_STATUS', name: '1:1문의 상태' },
  { code: 'FAQ_CATEGORY', name: 'FAQ 카테고리' },
  { code: 'NOTI_TYPE', name: '알림함 알림 유형' },
  { code: 'PUSH_MSG_TYPE', name: '푸시 알림 메시지' },
];

interface DetailRow {
  code: string;
  detailCode: string;
  detailName: string;
  ref1?: string;
  ref2?: string;
}

const DETAILS: DetailRow[] = [
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

  // CAR_INST — ref1은 항목설명(AD-CTLG-03 시공항목 관리에서 관리, 고객앱 시공항목 선택 화면에 항목명 아래
  // 부가 설명으로 노출됨). 2026-08-14: 하드코딩돼 있던 고객앱 desc 문구를 이쪽으로 이관
  { code: 'CAR_INST', detailCode: 'TINT', detailName: '썬팅(틴팅)', ref1: '전면·측면·후면·선루프' },
  { code: 'CAR_INST', detailCode: 'PPF', detailName: 'PPF', ref1: '프론트·풀바디 부분 선택' },
  { code: 'CAR_INST', detailCode: 'CCA', detailName: '유리막 코팅', ref1: '외장 광택 보호' },
  { code: 'CAR_INST', detailCode: 'BBOX', detailName: '블랙박스', ref1: '상시 녹화 · 주차 감시' },
  { code: 'CAR_INST', detailCode: 'CLEAN', detailName: '실내크리닝', ref1: '실내외 클리닝' },
  { code: 'CAR_INST', detailCode: 'UCOAT', detailName: '언더코팅', ref1: '부식 · 소음 방지' },
  // 예약시공(입찰) 카테고리 중 기존 6개와 겹치지 않는 2개 추가(외장수리/휠·타이어)
  { code: 'CAR_INST', detailCode: 'EXTREP', detailName: '외장수리', ref1: '판금·도색·범퍼 수리' },
  { code: 'CAR_INST', detailCode: 'WHTIRE', detailName: '휠·타이어', ref1: '휠 교체 · 타이어 장착' },

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

  // RESERVATION_STATUS — 예약 상태. PENDING_PAYMENT는 예약시공(BID) 업체/추천안 선정 직후~결제 완료 전까지의
  // 과도 상태(2026-08-21 추가) — 이 상태인 동안은 파트너·고객 양쪽 목록에서 CONFIRMED만 걸러내는 기존 조회 로직에
  // 자연히 안 잡혀 노출되지 않는다(신차패키지는 결제까지 끝난 뒤에야 예약이 생성돼 이 상태를 거치지 않음)
  { code: 'RESERVATION_STATUS', detailCode: 'CONFIRMED', detailName: '예약확정' },
  { code: 'RESERVATION_STATUS', detailCode: 'PENDING_PAYMENT', detailName: '결제대기' },
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

  // PERM_GROUP — 관리자 계정(AdminAccount)의 권한그룹(AD-SYS-04 사용자 계정 관리 화면에서 선택)
  { code: 'PERM_GROUP', detailCode: 'SUPER_ADMIN', detailName: '슈퍼관리자' },
  { code: 'PERM_GROUP', detailCode: 'OPS_MD', detailName: '운영 MD' },
  { code: 'PERM_GROUP', detailCode: 'CS_OPERATOR', detailName: 'CS 운영자' },
  { code: 'PERM_GROUP', detailCode: 'SETTLEMENT', detailName: '정산 담당자' },

  // CO_TYPE — 업체(Company)의 업체구분(AD-CO-02/03/04 업체 관리 화면에서 사용)
  { code: 'CO_TYPE', detailCode: 'DEALER', detailName: '딜러사' },
  { code: 'CO_TYPE', detailCode: 'SHOP', detailName: '시공업체' },
  { code: 'CO_TYPE', detailCode: 'SUPPLIER', detailName: '공급업체' },

  // BIZ_DIV — 업체(Company)의 사업자구분(업체 상세 기본정보 탭에서 사용)
  { code: 'BIZ_DIV', detailCode: 'INDIVIDUAL', detailName: '개인' },
  { code: 'BIZ_DIV', detailCode: 'CORP', detailName: '법인' },

  // BANK — 업체(Company)의 정산 입금 은행(업체 상세 기본정보 탭에서 사용)
  { code: 'BANK', detailCode: 'KB', detailName: '국민은행' },
  { code: 'BANK', detailCode: 'SHINHAN', detailName: '신한은행' },
  { code: 'BANK', detailCode: 'WOORI', detailName: '우리은행' },
  { code: 'BANK', detailCode: 'HANA', detailName: '하나은행' },
  { code: 'BANK', detailCode: 'IBK', detailName: 'IBK기업은행' },
  { code: 'BANK', detailCode: 'NH', detailName: 'NH농협은행' },
  { code: 'BANK', detailCode: 'SC', detailName: 'SC제일은행' },
  { code: 'BANK', detailCode: 'KEB', detailName: '케이뱅크' },
  { code: 'BANK', detailCode: 'KAKAO', detailName: '카카오뱅크' },
  { code: 'BANK', detailCode: 'TOSS', detailName: '토스뱅크' },
  { code: 'BANK', detailCode: 'SUHYUP', detailName: 'Sh수협은행' },
  { code: 'BANK', detailCode: 'MG', detailName: 'MG새마을금고' },
  { code: 'BANK', detailCode: 'SHINHYUP', detailName: '신협' },
  { code: 'BANK', detailCode: 'POST', detailName: '우체국' },
  { code: 'BANK', detailCode: 'BUSAN', detailName: '부산은행' },
  { code: 'BANK', detailCode: 'DAEGU', detailName: '대구은행' },
  { code: 'BANK', detailCode: 'GWANGJU', detailName: '광주은행' },
  { code: 'BANK', detailCode: 'JEONBUK', detailName: '전북은행' },
  { code: 'BANK', detailCode: 'JEJU', detailName: '제주은행' },

  // POINT_HIST_KIND — 포인트 내역 조회(AD-PNT-06) 구분. CHARGE/USE는 향후 고객 충전·사용 기능 구현 시 사용,
  // 현재는 관리자 강제 부여/차감(AD-PNT-04/05)만 실제로 발생함
  { code: 'POINT_HIST_KIND', detailCode: 'CHARGE', detailName: '충전' },
  { code: 'POINT_HIST_KIND', detailCode: 'USE', detailName: '사용' },
  { code: 'POINT_HIST_KIND', detailCode: 'GRANT', detailName: '관리자부여' },
  { code: 'POINT_HIST_KIND', detailCode: 'DEDUCT', detailName: '관리자차감' },
  { code: 'POINT_HIST_KIND', detailCode: 'PURCHASE_GRANT', detailName: '신차구매 포인트' },

  // COUPON_TYPE — 쿠폰 발행(AD-CPN-02) 유형
  { code: 'COUPON_TYPE', detailCode: 'DISCOUNT', detailName: '할인권' },
  { code: 'COUPON_TYPE', detailCode: 'EXCHANGE', detailName: '교환권' },
  { code: 'COUPON_TYPE', detailCode: 'AMOUNT', detailName: '금액권' },

  // COUPON_ISSUER_TYPE — 쿠폰 발행주체
  { code: 'COUPON_ISSUER_TYPE', detailCode: 'OPERATOR', detailName: '운영사' },
  { code: 'COUPON_ISSUER_TYPE', detailCode: 'DEALER', detailName: '딜러사' },

  // COUPON_TARGET_TYPE — 쿠폰 발행대상
  { code: 'COUPON_TARGET_TYPE', detailCode: 'ALL', detailName: '전체' },
  { code: 'COUPON_TARGET_TYPE', detailCode: 'CONDITION', detailName: '조건별' },
  { code: 'COUPON_TARGET_TYPE', detailCode: 'INDIVIDUAL', detailName: '개별선택' },

  // COUPON_ISSUANCE_STATUS — 쿠폰 발급 상태(USE는 향후 쿠폰 사용 처리 로직 구현 시 반영)
  { code: 'COUPON_ISSUANCE_STATUS', detailCode: 'ISSUED', detailName: '사용가능' },
  { code: 'COUPON_ISSUANCE_STATUS', detailCode: 'USED', detailName: '사용완료' },
  { code: 'COUPON_ISSUANCE_STATUS', detailCode: 'EXPIRED', detailName: '만료' },

  // INQUIRY_CATEGORY — 1:1문의 등록(CU-CS-03)의 문의 유형(customer-app csData.ts INQUIRY_CATEGORIES와 동일 텍스트)
  { code: 'INQUIRY_CATEGORY', detailCode: 'PAYMENT_POINT', detailName: '결제/포인트' },
  { code: 'INQUIRY_CATEGORY', detailCode: 'RESERVATION', detailName: '예약/시공' },
  { code: 'INQUIRY_CATEGORY', detailCode: 'SHOP_ORDER', detailName: '쇼핑몰/주문' },
  { code: 'INQUIRY_CATEGORY', detailCode: 'ACCOUNT', detailName: '계정/로그인' },
  { code: 'INQUIRY_CATEGORY', detailCode: 'ETC', detailName: '기타' },

  // INQUIRY_STATUS — 1:1문의 처리상태
  { code: 'INQUIRY_STATUS', detailCode: 'PENDING', detailName: '답변대기' },
  { code: 'INQUIRY_STATUS', detailCode: 'ANSWERED', detailName: '답변완료' },

  // FAQ_CATEGORY — FAQ 조회(CU-CS-02)의 카테고리(customer-app csData.ts FAQ_CATEGORY_META와 동일, "전체" 제외)
  { code: 'FAQ_CATEGORY', detailCode: 'POINT', detailName: '포인트' },
  { code: 'FAQ_CATEGORY', detailCode: 'RESV', detailName: '예약시공' },
  { code: 'FAQ_CATEGORY', detailCode: 'SHOP', detailName: '쇼핑몰' },
  { code: 'FAQ_CATEGORY', detailCode: 'ACCOUNT', detailName: '계정' },

  // NOTI_TYPE — 인앱 알림함(CU-MYPG-12) 알림 유형, PushNotificationService.sendToOwner() 호출 시 지정
  { code: 'NOTI_TYPE', detailCode: 'RSV_CONFIRMED', detailName: '예약 확정' },
  { code: 'NOTI_TYPE', detailCode: 'RSV_COMPLETED', detailName: '시공 완료' },
  { code: 'NOTI_TYPE', detailCode: 'RSV_NEW', detailName: '새 예약 접수(파트너)' },
  { code: 'NOTI_TYPE', detailCode: 'NCPK_MAPPED', detailName: '신차패키지 매핑' },
  { code: 'NOTI_TYPE', detailCode: 'POINT_GRANTED', detailName: '포인트 적립' },
  { code: 'NOTI_TYPE', detailCode: 'COUPON_ISSUED', detailName: '쿠폰 발급' },
  { code: 'NOTI_TYPE', detailCode: 'RSV_RESCHED_REQUESTED', detailName: '일정변경 요청' },
  { code: 'NOTI_TYPE', detailCode: 'RSV_RESCHED_ACCEPTED', detailName: '일정변경 승인' },
  { code: 'NOTI_TYPE', detailCode: 'RSV_RESCHED_REJECTED', detailName: '일정변경 거절' },
  { code: 'NOTI_TYPE', detailCode: 'RSV_HANDOVER_CONFIRMED', detailName: '인수확인 완료' },
  { code: 'NOTI_TYPE', detailCode: 'BID_NEW', detailName: '새 입찰 요청(파트너)' },
  { code: 'NOTI_TYPE', detailCode: 'BID_SELECTED', detailName: '입찰 확정(파트너)' },
  { code: 'NOTI_TYPE', detailCode: 'BID_NOT_SELECTED', detailName: '입찰 미선정(파트너)' },
  { code: 'NOTI_TYPE', detailCode: 'BID_OFFER_RECEIVED', detailName: '새 입찰 도착' },
  { code: 'NOTI_TYPE', detailCode: 'BID_PLAN_RECEIVED', detailName: '새 추천안 도착' },
  { code: 'NOTI_TYPE', detailCode: 'ADMIN_NOTICE', detailName: '관리자 공지' },

  // PUSH_MSG_TYPE — 푸시 발송 제목/본문/탭 시 이동 경로. detailName=제목, ref1=본문 템플릿({date} {time} 같은 플레이스홀더 치환됨),
  // ref2="view" 또는 "view/screen"(탭 시 이동 대상, 앱의 App.tsx handlePushTarget이 해석). 신차패키지(PKG)·예약시공(BID)
  // 중 어느 예약인지에 따라 Flow 자체가 갈리는 타입(RSV_CONFIRMED 등)은 PKG일 때만 ref2를 쓰고 BID는 코드가 자동 판단한다
  // PushNotificationService.resolveMessage()가 발송 시점에 조회해 사용 — 문구만 바꿀 땐 소스 수정 없이 여기서 관리
  { code: 'PUSH_MSG_TYPE', detailCode: 'RSV_CONFIRMED', detailName: '예약이 확정됐어요', ref1: '{date} {time} 예약이 정상적으로 접수됐어요.', ref2: 'ncpk/bookingdtl' },
  { code: 'PUSH_MSG_TYPE', detailCode: 'RSV_NEW', detailName: '새 예약이 접수됐어요', ref1: '{date} {time} 예약이 새로 접수됐어요.', ref2: 'ncpk' },
  { code: 'PUSH_MSG_TYPE', detailCode: 'RSV_COMPLETED', detailName: '시공이 완료됐어요', ref1: '인수확인을 진행해 주세요.', ref2: 'ncpk/handover' },
  { code: 'PUSH_MSG_TYPE', detailCode: 'NCPK_MAPPED', detailName: '신차패키지가 연결됐어요', ref1: '보유 차량정보로 신차패키지가 매핑됐어요. 지금 확인해보세요.', ref2: 'ncpk' },
  { code: 'PUSH_MSG_TYPE', detailCode: 'POINT_GRANTED', detailName: '포인트가 적립됐어요', ref1: '{amount}P가 적립됐어요.', ref2: 'point' },
  { code: 'PUSH_MSG_TYPE', detailCode: 'COUPON_ISSUED', detailName: '쿠폰이 도착했어요', ref1: '새 쿠폰이 발급됐어요. 보유 쿠폰함에서 확인해보세요.', ref2: 'myp/couponbox' },
  { code: 'PUSH_MSG_TYPE', detailCode: 'RSV_RESCHED_REQUESTED', detailName: '일정 변경 요청이 왔어요', ref1: '{date} {time}로 일정 변경을 요청했어요. 확인해주세요.', ref2: 'ncpk/bookingdtl' },
  { code: 'PUSH_MSG_TYPE', detailCode: 'RSV_RESCHED_ACCEPTED', detailName: '일정변경이 승인됐어요', ref1: '{date} {time}로 일정이 변경됐어요.', ref2: 'ncpk' },
  { code: 'PUSH_MSG_TYPE', detailCode: 'RSV_RESCHED_REJECTED', detailName: '일정변경 요청이 거절됐어요', ref1: '고객이 일정변경 요청을 거절했어요. 기존 일정대로 진행해주세요.', ref2: 'ncpk' },
  { code: 'PUSH_MSG_TYPE', detailCode: 'RSV_HANDOVER_CONFIRMED', detailName: '고객이 인수확인을 완료했어요', ref1: '시공 건에 대한 고객 인수확인이 완료됐어요.', ref2: 'ncpk' },
  { code: 'PUSH_MSG_TYPE', detailCode: 'BID_NEW', detailName: '새 입찰 요청이 도착했어요', ref1: '{date} 희망 시공 요청이 도착했어요. 입찰함에서 확인해보세요.', ref2: 'bidbox/new' },
  { code: 'PUSH_MSG_TYPE', detailCode: 'BID_SELECTED', detailName: '예약이 확정됐어요', ref1: '{date} {time} 시공이 확정됐어요.', ref2: 'bidbox' },
  { code: 'PUSH_MSG_TYPE', detailCode: 'BID_NOT_SELECTED', detailName: '다른 업체가 선정됐어요', ref1: '아쉽지만 이번 요청은 다른 업체가 선정됐어요.', ref2: 'bidbox' },
  { code: 'PUSH_MSG_TYPE', detailCode: 'BID_OFFER_RECEIVED', detailName: '새 입찰이 도착했어요', ref1: '업체가 입찰을 제출했어요. 비교해보세요.', ref2: 'rsv' },
  { code: 'PUSH_MSG_TYPE', detailCode: 'BID_PLAN_RECEIVED', detailName: '새 추천안이 도착했어요', ref1: '업체가 추천안을 제출했어요. 비교해보세요.', ref2: 'rsv' },
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
