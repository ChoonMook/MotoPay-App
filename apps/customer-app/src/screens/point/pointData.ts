// 포인트 화면 데모 데이터: 보유 잔액·등급·내역·등급별 혜택 목업 (원본 dc.html의 renderVals() 목업 그대로 이식)
import type { PtHistItem, PtMethodKey } from "./pntTypes";

export const BALANCE = 182400;
export const RECENT_SPEND = 2600000;
export const GRADE = "SILVER";
export const NEXT_GRADE = "GOLD";
export const NEXT_THRESHOLD = 3000000;

export const GRADE_COLORS: Record<string, string> = {
  GOLD: "#C79A3B",
  SILVER: "#8B95A3",
  BRONZE: "#A9713F",
};

export const KIND_META: Record<PtHistItem["kind"], { label: string; color: string }> = {
  charge: { label: "충전", color: "#12A150" },
  use: { label: "사용", color: "#E5484D" },
  admin: { label: "기타", color: "#8A929E" },
};

export const ALL_HIST: PtHistItem[] = [
  { title: "썬팅·블랙박스 시공 결제", date: "2026.06.18", kind: "use", amt: -120000, bal: 182400 },
  { title: "카드 충전", date: "2026.06.15", kind: "charge", amt: 300000, bal: 302400 },
  { title: "리뷰 이벤트 적립", date: "2026.06.10", kind: "admin", amt: 5000, bal: 2400 },
  { title: "쇼핑몰 상품 결제", date: "2026.06.02", kind: "use", amt: -32000, bal: -2600 },
  { title: "무통장 충전", date: "2026.05.28", kind: "charge", amt: 500000, bal: 29400 },
  { title: "오적립 정정 차감", date: "2026.05.20", kind: "admin", amt: -3000, bal: -470600 },
];

export const AMOUNT_CHIPS: { value: number; label: string }[] = [
  { value: 100000, label: "10만원" },
  { value: 300000, label: "30만원" },
  { value: 500000, label: "50만원" },
  { value: 1000000, label: "100만원" },
];

export const METHOD_DEFS: { key: PtMethodKey; label: string; note?: string }[] = [
  { key: "bank", label: "무통장 입금", note: "입금 계좌 · 국민 123456-01-234567 (모토페이)" },
  { key: "card", label: "신용/체크카드" },
];

export interface TierPerk {
  label: string;
  value: string;
}

export interface Tier {
  name: string;
  cond: string;
  perks: TierPerk[];
}

export const TIERS: Tier[] = [
  { name: "GOLD", cond: "최근 3개월 300만원 ↑", perks: [{ label: "시공 할인권", value: "15%" }, { label: "월 금액권", value: "30,000원" }] },
  { name: "SILVER", cond: "200만 ~ 300만원", perks: [{ label: "시공 할인권", value: "10%" }, { label: "월 금액권", value: "15,000원" }] },
  { name: "BRONZE", cond: "100만 ~ 200만원", perks: [{ label: "시공 할인권", value: "5%" }, { label: "월 금액권", value: "5,000원" }] },
];
