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

export type RsvSheet = null | "reqtype" | "poslvl" | "coupon" | "review";

export type RsvFlowKind = "gen" | "expert";

export type ItemKey = "tint" | "ppf" | "blackbox" | "glass" | "under" | "detail";
export type ProdItemKey = "blackbox" | "glass" | "ppf" | "under" | "detail";
export type PayMethodKey = "bank" | "card";

export interface ItemDef {
  key: ItemKey;
  name: string;
  desc: string;
  searchable?: boolean;
}

export const ITEM_DEFS: ItemDef[] = [
  { key: "tint", name: "썬팅 (윈도우 틴팅)", desc: "전면·측면·후면·선루프", searchable: true },
  { key: "ppf", name: "PPF 도장 보호 필름", desc: "프론트·풀바디 부분 선택" },
  { key: "blackbox", name: "블랙박스", desc: "상시 녹화 · 주차 감시", searchable: true },
  { key: "glass", name: "유리막 코팅", desc: "외장 광택 보호" },
  { key: "under", name: "하부 언더코팅", desc: "부식 · 소음 방지" },
  { key: "detail", name: "광택 · 디테일링", desc: "실내외 클리닝" },
];

export const PROD_OPTIONS: Record<ProdItemKey, string[]> = {
  blackbox: ["아이나비 QXD3000", "파인뷰 X1000", "팅크웨어 Q7"],
  glass: ["크리스탈 세라믹 2년", "게코 9H 프리미엄", "불스원 글라스가드"],
  ppf: ["프론트 풀", "풀바디", "부분(후드·펜더)"],
  under: ["방청 언더코팅", "흡음 언더코팅"],
  detail: ["외장 광택", "실내외 풀케어"],
};

export interface TintProduct {
  name: string;
  brand: string;
  bkey: string;
  spec: string;
}

export const TINT_PRODUCTS: TintProduct[] = [
  { name: "루마 버텍스 300", brand: "루마", bkey: "luma", spec: "적외선 차단 · 열 차단 우수" },
  { name: "루마 버텍스 TT", brand: "루마", bkey: "luma", spec: "프리미엄 세라믹" },
  { name: "브이쿨 K", brand: "V-Kool", bkey: "vcool", spec: "고투과 · 저반사" },
  { name: "레이노 피니티", brand: "레이노", bkey: "rayno", spec: "나노 카본" },
  { name: "3M 크리스탈리", brand: "3M", bkey: "3m", spec: "멀티레이어 세라믹" },
  { name: "글라스틴트 펜더", brand: "글라스틴트", bkey: "glass", spec: "가성비 스탠다드" },
];

export const BRAND_DEFS: Array<[string, string]> = [
  ["all", "전체"],
  ["luma", "루마"],
  ["vcool", "V-Cool"],
  ["rayno", "레이노"],
  ["3m", "3M"],
  ["glass", "글라스틴트"],
];

export const CAT_DEFS = ["외장수리", "썬팅·틴팅", "유리막 코팅", "PPF", "블랙박스", "언더코팅", "광택·디테일링", "휠·타이어"];

// 백엔드 CommonCodeDetail(code='CAR_INST') 코드값 매핑 — 일반입찰 항목(ItemKey)과 전문가추천 카테고리(CAT_DEFS)가
// 같은 코드그룹을 공유한다(요청 생성 API 연동용)
export const INST_CODE_BY_ITEM_KEY: Record<ItemKey, string> = {
  tint: "TINT",
  ppf: "PPF",
  blackbox: "BBOX",
  glass: "CCA",
  under: "UCOAT",
  detail: "CLEAN",
};

export const INST_CODE_BY_CAT_NAME: Record<string, string> = {
  "외장수리": "EXTREP",
  "썬팅·틴팅": "TINT",
  "유리막 코팅": "CCA",
  PPF: "PPF",
  "블랙박스": "BBOX",
  "언더코팅": "UCOAT",
  "광택·디테일링": "CLEAN",
  "휠·타이어": "WHTIRE",
};

// 신차패키지(NcpkFlow)와 공유하는 부위 코드 매핑 — commonTypes.ts로 이동, 기존 import 경로 유지를 위해 재수출
export { TINT_POSITION_TO_CODE, TINT_POSITION_LABELS } from "../common/commonTypes";

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
export interface Bidder {
  id: string;
  name: string;
  when: string;
  items: Array<[string, number, string]>; // [항목명(instCode 라벨), 가격, instCode] — instCode는 예약확정 카드에서 썬팅 항목 판별용
}

// id는 추천번호(planNo), when은 시공 예정 시각 라벨 — 평점·거리는 DB에 리뷰/좌표 데이터가 없어 Bidder와 동일하게 미표시
export interface RecoPlan {
  id: string;
  name: string;
  itemSummary: string; // "유리막 코팅" 또는 "유리막 코팅 외 1건" — 추천 상품 구성 요약
  reason: string;
  when: string;
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
