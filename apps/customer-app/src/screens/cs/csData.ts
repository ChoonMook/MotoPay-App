// 고객센터 화면 공통 메타 정의 + 백엔드 응답 표시용 헬퍼
import { API_BASE_URL } from "../../api/config";

/** 서버 uploads/ 기준 상대경로 -> 화면에 표시할 전체 URL */
export function toPhotoUrl(path: string): string {
  return `${API_BASE_URL}/uploads/${path}`;
}

/** toPhotoUrl의 역변환 — 수정 폼에서 기존 사진을 그대로 유지할 때 서버에 다시 상대경로로 돌려보내기 위함.
 * data URI(신규 촬영/선택한 사진)는 그대로 통과시킨다. */
export function fromPhotoUrl(url: string): string {
  const prefix = `${API_BASE_URL}/uploads/`;
  return url.startsWith(prefix) ? url.slice(prefix.length) : url;
}

export const FAQ_CATEGORY_META: { key: string; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "POINT", label: "포인트" },
  { key: "RESV", label: "예약시공" },
  { key: "SHOP", label: "쇼핑몰" },
  { key: "ACCOUNT", label: "계정" },
];

export interface FaqItem {
  id: string;
  cat: string;
  q: string;
  a: string;
}

/** ISO datetime -> "2026.07.15" */
export function formatDotDate(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}.${mm}.${dd}`;
}
