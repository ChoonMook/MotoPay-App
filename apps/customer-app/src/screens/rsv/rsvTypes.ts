// 예약시공(CU-RSVC-01~20) 플로우에서 공유하는 상태 타입 정의
export type RsvScreen =
  | "main"
  | "itemsel"
  | "prodsel"
  | "prodsearch"
  | "catbudget"
  | "condinput"
  | "regdone"
  | "bidcmp"
  | "biddtl"
  | "myreqdtl"
  | "plancmp"
  | "plandtl"
  | "pay"
  | "paydone"
  | "handover"
  | "copro"
  | "proddtl"
  | "bookingdtl"
  | "resched"
  | "cancel";

export type RsvSheet = null | "reqtype" | "poslvl" | "coupon" | "review" | "reschedReject";

export type RsvFlowKind = "gen" | "expert";

export type ItemKey = "tint" | "ppf" | "blackbox" | "glass" | "under" | "detail";
export type ProdItemKey = "blackbox" | "glass" | "ppf" | "under" | "detail";
export type PayMethodKey = "bank" | "card";

// name/desc는 하드코딩하지 않고 admin-app 시공항목 관리(AD-CTLG-03, CAR_INST 공통코드)의 detailName/ref1을
// 그대로 사용한다(RsvFlow.tsx가 조회해 조합) — 여기서는 어떤 항목이 일반입찰 대상인지(키 집합)만 정의
export interface ItemDef {
  key: ItemKey;
  name: string;
  desc: string;
}

export const ITEM_KEYS: ItemKey[] = ["tint", "ppf", "blackbox", "glass", "under", "detail"];

// 백엔드 Product.prodCat(CommonCodeDetail(code='PROD_CAT')) 매핑 — 제품 선택·검색(CU-RSVC-04/05)에서 실제
// 카탈로그(GET /products?bidApplicable=true) 조회용. CAR_INST와 코드값이 대부분 같지만 "유리막 코팅"만
// CAR_INST='CCA' / PROD_CAT='COAT'로 서로 달라 별도 매핑이 필요함(seed-common-codes.ts 참고)
export const PROD_CAT_BY_ITEM_KEY: Record<ProdItemKey, string> = {
  ppf: "PPF",
  blackbox: "BBOX",
  glass: "COAT",
  under: "UCOAT",
  detail: "CLEAN",
};

// 백엔드 CommonCodeDetail(code='CAR_INST') 코드값 매핑 — 일반입찰 항목(ItemKey)이 대응되는 CAR_INST 코드.
// 전문가추천 "관심 카테고리"는 ItemKey 같은 고정 하위집합이 없어 RsvFlow.tsx가 carInstCodes(등록된 CAR_INST
// 전체)를 그대로 써서 {code, name} 목록을 만든다 — 하드코딩된 카테고리 이름 목록(CAT_DEFS)은 더 이상 없음
export const INST_CODE_BY_ITEM_KEY: Record<ItemKey, string> = {
  tint: "TINT",
  ppf: "PPF",
  blackbox: "BBOX",
  glass: "CCA",
  under: "UCOAT",
  detail: "CLEAN",
};

// 신차패키지(NcpkFlow)와 공유하는 부위 코드 매핑 — commonTypes.ts로 이동, 기존 import 경로 유지를 위해 재수출
export { TINT_POSITION_TO_CODE, TINT_POSITION_LABELS } from "../common/commonTypes";

// instCode -> Product.prodCat 매핑(PROD_CAT_BY_ITEM_KEY의 instCode 버전) — 내 요청 상세(RsvMyReqDtlScreen)에서
// 요청 시점에 고른 제품명을 실 카탈로그(GET /products?prodCat=...)에서 찾아 참고 판매가를 보여줄 때 사용
export const PROD_CAT_BY_INST_CODE: Record<string, string> = {
  TINT: "TINT",
  PPF: "PPF",
  BBOX: "BBOX",
  CCA: "COAT",
  UCOAT: "UCOAT",
  CLEAN: "CLEAN",
};

// instCode -> 한글 라벨(내 요청 목록 카드 표시용, 위 매핑의 역방향)
export const INST_CODE_LABELS: Record<string, string> = {
  TINT: "썬팅·틴팅",
  PPF: "PPF",
  BBOX: "블랙박스",
  CCA: "유리막 코팅",
  UCOAT: "언더코팅",
  CLEAN: "광택·디테일링",
  EXTREP: "외장수리",
  WHTIRE: "휠·타이어",
};

// id는 응찰번호(offerNo), when은 시공 예정 시각 라벨(예: "8월 7일(금) 14:00") — 평점·거리는 DB에 리뷰/좌표 데이터가 없어 미표시
// date는 when의 날짜 부분 원본("YYYY-MM-DD") — 요청의 희망일과 다를 수 있어(업체가 다른 날짜로 응찰한 경우) 비교 표시용으로 별도 보관
export interface Bidder {
  id: string;
  shopCode: string;
  name: string;
  when: string;
  date: string;
  memo: string | null; // 업체가 응찰 시 남긴 메모(선택) — 입찰 내용 상세에 표시
  items: Array<[string, number, string]>; // [항목명(instCode 라벨), 가격, instCode] — instCode는 예약확정 카드에서 썬팅 항목 판별용
}

// id는 추천번호(planNo), when은 시공 예정 시각 라벨 — 평점·거리는 DB에 리뷰/좌표 데이터가 없어 Bidder와 동일하게 미표시
// date는 when의 날짜 부분 원본("YYYY-MM-DD") — Bidder.date와 동일한 목적
export interface RecoPlan {
  id: string;
  shopCode: string;
  name: string;
  itemSummary: string; // "유리막 코팅" 또는 "유리막 코팅 외 1건" — 추천 상품 구성 요약
  reason: string;
  when: string;
  date: string;
  plans: Array<[string, number, number, string]>; // [상품명, 소비자가, 제안가, instCode]
}

export interface CouponDef {
  id: string;
  name: string;
  desc: string;
  type: "amount" | "percent";
  value: number;
  cap?: number;
  minAmount?: number;
}

export const COUPON_DEFS: CouponDef[] = [
  { id: "c1", name: "신규 시공 5,000원 할인", desc: "전 금액 · 최소 주문 없음", type: "amount", value: 5000 },
  { id: "c2", name: "견적 10% 할인", desc: "최대 20,000원 할인", type: "percent", value: 10, cap: 20000 },
  { id: "c3", name: "프리미엄 회원 3만원 할인", desc: "30만원 이상 결제 시", type: "amount", value: 30000, minAmount: 300000 },
];

export const POINT_BALANCE = 5000;
