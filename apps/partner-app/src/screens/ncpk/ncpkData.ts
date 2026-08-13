// PT-NCPK-01~03 신차패키지 시공관리 - 탭/진행상태 표시용 공용 매핑(실데이터는 api/reservations.ts에서 조회)
import type { CommonCodeDetailApi } from "../../api/commonCodes";

export type NcpkTab = "wait" | "ing" | "done";

// CommonCodeDetail(code='BID_TINT_POSITION') 코드값 -> 한글 부위명 — customer-app commonTypes.ts와 동일한 고정 5부위 매핑
export const TINT_POSITION_LABELS: Record<string, string> = {
  FRONT: "전면유리",
  SIDE_1: "측면 1열",
  SIDE_2: "측면 2열",
  REAR: "후면유리",
  SUNROOF: "선루프",
};

/** 썬팅 부위별 농도를 "전면유리 30% · 측면 1열 30%" 형태로 요약 — 부위 정보가 없으면 undefined */
export function formatTintDetail(tintPositions: { position: string; level: string }[]): string | undefined {
  if (tintPositions.length === 0) return undefined;
  return tintPositions.map((t) => `${TINT_POSITION_LABELS[t.position] ?? t.position} ${t.level}%`).join(" · ");
}

/** prodCat(CommonCodeDetail code='PROD_CAT') 코드값 -> 분류명 — 옵션 목록에 없으면 코드값 그대로 표기 */
export function categoryLabel(prodCat: string | null, prodCatOptions: CommonCodeDetailApi[]): string | undefined {
  if (!prodCat) return undefined;
  return prodCatOptions.find((c) => c.detailCode === prodCat)?.detailName ?? prodCat;
}

/** 시공관리 목록 카드용 — 시공 항목 분류명을 "썬팅 · 세차" 형태로 요약(상세 제품명은 시공 상세에서 확인) */
export function summarizeCategories(categories: string[], prodCatOptions: CommonCodeDetailApi[]): string {
  if (categories.length === 0) return "-";
  const labels = categories.map((c) => categoryLabel(c, prodCatOptions) ?? c);
  if (labels.length <= 4) return labels.join(" · ");
  return `${labels.slice(0, 3).join(" · ")} 외 ${labels.length - 3}건`;
}

export const NCPK_TAB_META: { key: NcpkTab; label: string }[] = [
  { key: "wait", label: "착수대기" },
  { key: "ing", label: "시공중" },
  { key: "done", label: "완료" },
];

export function progressToTab(progressStatus: string): NcpkTab {
  if (progressStatus === "IN_PROGRESS") return "ing";
  if (progressStatus === "DONE") return "done";
  return "wait";
}

export function statusLabel(progressStatus: string): string {
  if (progressStatus === "IN_PROGRESS") return "시공중";
  if (progressStatus === "DONE") return "완료";
  return "착수대기";
}

export function statusChipClass(progressStatus: string): string {
  if (progressStatus === "IN_PROGRESS") return "text-brand bg-brand-subtle";
  if (progressStatus === "DONE") return "text-status-success bg-status-success-bg";
  return "text-accent-strong bg-accent-subtle";
}

export function itemTagLabel(tag: "BASIC" | "OPTION"): string {
  return tag === "OPTION" ? "업그레이드" : "기본";
}

export function itemTagClass(tag: "BASIC" | "OPTION"): string {
  return tag === "OPTION" ? "text-accent-strong bg-accent-subtle" : "text-gray-600 bg-gray-100";
}

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

/** "YYYY-MM-DD" + "HH:mm" -> "7.2(목) 오후 2:00" */
export function formatScheduleLabel(date: string, time: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  const [hh, mm] = time.split(":").map(Number);
  const ampm = hh < 12 ? "오전" : "오후";
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${m}.${d}(${WEEKDAY_KO[dow]}) ${ampm} ${hour12}:${String(mm).padStart(2, "0")}`;
}
