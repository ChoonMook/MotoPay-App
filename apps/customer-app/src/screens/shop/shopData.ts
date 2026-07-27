// 쇼핑몰 데모 데이터: 상품·카테고리·정렬·쿠폰·배송지·주문 목업 (원본 dc.html의 products()/renderVals() 목업 그대로 이식)
import carImg from "../../assets/images/car.png";
import shopImg from "../../assets/images/shop.png";
import zicM7Img from "../../assets/images/zic-m7.png";
import type { Address, OrderDef, Product } from "./shopTypes";

export const PRODUCTS: Record<string, Product> = {
  p1: {
    id: "p1",
    brand: "ZIC",
    name: "ZIC M7 5W30 엔진오일 (4L)",
    cat: "engineoil",
    price: 32000,
    orig: 38000,
    rating: "4.8",
    reviews: 342,
    img: zicM7Img,
    opts: ["1개", "2개 묶음"],
    desc: "API SN 규격의 100% 합성 엔진오일로, 저온 시동성과 연비 효율을 동시에 잡았어요. 국산·수입 대부분의 가솔린 차량에 사용 가능합니다.",
    specs: [
      ["용량", "4L"],
      ["점도등급", "5W-30"],
      ["원산지", "국내 생산"],
      ["교환주기", "10,000km 권장"],
    ],
  },
  p2: {
    id: "p2",
    brand: "아이나비",
    name: "아이나비 QXD3000 블랙박스",
    cat: "blackbox",
    price: 189000,
    orig: 219000,
    rating: "4.7",
    reviews: 128,
    img: carImg,
    opts: ["32GB", "64GB"],
    desc: "전후방 2채널 4K 화질에 야간 인식률을 높인 신규 센서를 탑재했어요. 실시간 스마트폰 연동으로 영상 확인이 간편합니다.",
    specs: [
      ["채널", "전후방 2채널"],
      ["화질", "4K + 2K"],
      ["저장매체", "microSD"],
      ["보증기간", "2년 무상 A/S"],
    ],
  },
  p3: {
    id: "p3",
    brand: "루마 (LLumar)",
    name: "루마 버텍스 300 썬팅필름 세트",
    cat: "tint",
    price: 280000,
    orig: 320000,
    rating: "4.9",
    reviews: 96,
    img: shopImg,
    opts: ["전차종 공용"],
    desc: "멀티레이어 나노 세라믹 구조로 적외선(IR) 차단율이 높아 여름철 실내 온도 상승을 크게 줄여줍니다. 전자기기 신호 간섭이 없는 논메탈 필름이에요.",
    specs: [
      ["가시광선 투과율", "35% (VLT)"],
      ["적외선 차단율", "96% (IRR)"],
      ["필름 구조", "논메탈 세라믹"],
      ["제조사 보증", "평생 A/S"],
    ],
  },
  p4: {
    id: "p4",
    brand: "게코 (GYEON)",
    name: "게코 9H 세라믹 코팅제",
    cat: "coating",
    price: 65000,
    orig: 78000,
    rating: "4.6",
    reviews: 210,
    img: zicM7Img,
    opts: ["200ml", "500ml"],
    desc: "수입차 순정 도장에도 안전하게 사용 가능한 9H 경도의 세라믹 코팅제예요. 발수력과 광택 지속력이 우수합니다.",
    specs: [
      ["경도", "9H"],
      ["지속기간", "최대 2년"],
      ["적용범위", "차량 전체 도장면"],
      ["원산지", "체코"],
    ],
  },
  p5: {
    id: "p5",
    brand: "미쉐린",
    name: "미쉐린 프라이머시4 타이어 (1본)",
    cat: "tire",
    price: 145000,
    orig: null,
    rating: "4.8",
    reviews: 421,
    img: carImg,
    opts: ["205/55R16", "215/55R17"],
    desc: "젖은 노면 제동력이 뛰어나고 마모 후에도 성능 저하가 적은 프리미엄 타이어예요. 정숙성과 승차감도 우수합니다.",
    specs: [
      ["규격", "205/55R16"],
      ["타입", "컴포트"],
      ["제조국", "한국 생산"],
      ["보증", "마모 보증 5년"],
    ],
  },
  p6: {
    id: "p6",
    brand: "모토케어",
    name: "차량용 방향제 세트",
    cat: "etc",
    price: 18000,
    orig: 22000,
    rating: "4.5",
    reviews: 88,
    img: shopImg,
    opts: ["우디향", "시트러스향"],
    desc: "은은하게 퍼지는 향으로 차량 내부 냄새를 잡아줘요. 통풍구 거치형으로 설치가 간편합니다.",
    specs: [
      ["용량", "2개입 세트"],
      ["지속기간", "약 60일"],
      ["설치방식", "통풍구 거치형"],
    ],
  },
  p7: {
    id: "p7",
    brand: "크리스탈",
    name: "크리스탈 세라믹 유리막코팅 키트",
    cat: "coating",
    price: 42000,
    orig: null,
    rating: "4.7",
    reviews: 154,
    img: zicM7Img,
    opts: ["DIY 키트"],
    desc: "셀프 시공이 가능한 유리막 코팅 키트예요. 스크래치 커버와 발수 지속성이 뛰어난 스탠다드 등급입니다.",
    specs: [
      ["보증기간", "2년"],
      ["시공방식", "DIY 셀프"],
      ["용량", "100ml + 도구 세트"],
    ],
  },
  p8: {
    id: "p8",
    brand: "김성네비",
    name: "김성네비 후방카메라",
    cat: "blackbox",
    price: 89000,
    orig: 99000,
    rating: "4.4",
    reviews: 67,
    img: carImg,
    opts: ["기본형", "HD형"],
    desc: "선명한 화질의 후방카메라로 주차 시 사각지대를 줄여줘요. 방수 설계로 우천 시에도 안정적으로 작동합니다.",
    specs: [
      ["화질", "HD 130만화소"],
      ["방수등급", "IP67"],
      ["시야각", "170도"],
    ],
  },
};

export const ALL_PRODUCT_IDS = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"];
export const BEST_PRODUCT_IDS = ["p1", "p2", "p3", "p4"];

export const CATEGORY_META: { key: string; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "engineoil", label: "엔진오일" },
  { key: "blackbox", label: "블랙박스" },
  { key: "tint", label: "썬팅" },
  { key: "coating", label: "코팅" },
  { key: "tire", label: "타이어" },
  { key: "etc", label: "기타용품" },
];

export const SORT_META: { key: string; label: string }[] = [
  { key: "pop", label: "인기순" },
  { key: "new", label: "신상품순" },
  { key: "low", label: "낮은가격순" },
  { key: "high", label: "높은가격순" },
];

export const POPULAR_KEYWORDS = ["엔진오일", "블랙박스", "타이어", "유리막 코팅", "썬팅필름", "와이퍼", "방향제", "차량용 청소용품"];

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
  { id: "c1", name: "신규 쇼핑 5,000원 할인", desc: "전 금액 · 최소 주문 없음", type: "amount", value: 5000 },
  { id: "c2", name: "쇼핑몰 10% 할인", desc: "최대 20,000원 할인", type: "percent", value: 10, cap: 20000 },
  { id: "c3", name: "프리미엄 회원 3만원 할인", desc: "30만원 이상 결제 시", type: "amount", value: 30000, minAmount: 300000 },
];

export const POINT_BAL = 5000;

export const ADDRESS_DEFS: Address[] = [
  { id: "a1", name: "자택", phone: "010-1234-5678", addr: "서울 강남구 논현로 123, 101동 502호", isDefault: true },
  { id: "a2", name: "회사", phone: "010-1234-5678", addr: "서울 서초구 서초대로 45, 8층", isDefault: false },
];

export const ORDER_DEFS: Record<string, OrderDef> = {
  o1: { pid: "p1", qty: 2, date: "2026.07.18", no: "SHOP-240718", status: "prep" },
  o2: { pid: "p2", qty: 1, date: "2026.07.10", no: "SHOP-240710", status: "ship" },
  o3: { pid: "p3", qty: 1, date: "2026.06.28", no: "SHOP-240628", status: "done" },
};
export const ORDER_IDS = ["o1", "o2", "o3"];

export const CANCEL_REASONS = ["단순 변심", "상품 불량·파손", "오배송", "기타"];
