// 포인트 화면 공용 숫자 포맷터 (천단위 콤마) + API 응답 매핑 유틸
import type { PtHistKind } from "./pntTypes";

export function nfmt(n: number): string {
  return n.toLocaleString("en-US");
}

export function parseDigits(value: string): number {
  return parseInt(value.replace(/[^0-9]/g, ""), 10) || 0;
}

// 백엔드 포인트 내역 구분(CHARGE/USE/GRANT/DEDUCT/PURCHASE_GRANT)을 화면 3분류(충전/사용/기타)로 매핑
export function toUiKind(kind: string): PtHistKind {
  if (kind === "CHARGE") return "charge";
  if (kind === "USE") return "use";
  return "admin";
}

// ISO 문자열 -> "2026.06.18" 형식
export function fmtDate(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, ".");
}
