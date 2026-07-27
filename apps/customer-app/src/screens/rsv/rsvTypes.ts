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
export type SortBidKey = "rating" | "price" | "dist";

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

export interface Bidder {
  id: string;
  name: string;
  rating: string;
  dist: string;
  when: string;
  best?: boolean;
  items: Array<[string, number]>;
}

export const BIDDERS: Bidder[] = [
  {
    id: "b1",
    name: "강남 카프로 디테일링",
    rating: "4.9",
    dist: "2.3km",
    when: "이번 주말 가능",
    best: true,
    items: [
      ["썬팅 · 루마 버텍스 300", 380000],
      ["블랙박스 · 아이나비 QXD3000", 260000],
    ],
  },
  {
    id: "b2",
    name: "서초 오토스타일",
    rating: "4.7",
    dist: "4.1km",
    when: "다음 주 평일",
    items: [
      ["썬팅 · 루마 버텍스 300", 410000],
      ["블랙박스 · 아이나비 QXD3000", 285000],
    ],
  },
  {
    id: "b3",
    name: "프리미엄 카케어 방배",
    rating: "4.8",
    dist: "5.6km",
    when: "가장 빠른 날",
    items: [
      ["썬팅 · 루마 버텍스 300", 430000],
      ["블랙박스 · 아이나비 QXD3000", 290000],
    ],
  },
];

export interface RecoPlan {
  id: string;
  name: string;
  rating: string;
  dist: string;
  product: string;
  reason: string;
  plans: Array<[string, number, number]>; // [상품명, 소비자가, 제안가]
}

export const RECOS: RecoPlan[] = [
  {
    id: "r1",
    name: "카닥 프리미엄 파트너",
    rating: "4.9",
    dist: "3.2km",
    product: "유리막 코팅 · 게코 9H 프리미엄",
    reason:
      "수입차 순정 도장에 최적화된 9H 세라믹으로, 예산 안에서 가장 높은 경도·내구 등급을 추천드려요. 2년 유지관리 방문 1회가 포함된 구성이에요.",
    plans: [["게코 9H 프리미엄 코팅", 360000, 280000]],
  },
  {
    id: "r2",
    name: "광택명가 디테일링",
    rating: "4.6",
    dist: "6.8km",
    product: "유리막 코팅 · 크리스탈 세라믹 2년",
    reason:
      "가성비 위주로 2년 보증 제품을 구성했어요. 생활 스크래치 커버와 발수 지속성이 우수한 스탠다드 등급이에요.",
    plans: [["크리스탈 세라믹 2년 코팅", 300000, 230000]],
  },
];

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
