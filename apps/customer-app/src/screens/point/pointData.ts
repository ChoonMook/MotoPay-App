// 포인트 화면 공용 표시 메타(등급 색상·내역 구분 라벨) + 충전 화면 선택지(충전 금액/결제 수단)
import type { PtHistItem, PtMethodKey } from "./pntTypes";

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
