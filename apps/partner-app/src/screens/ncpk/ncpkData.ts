// PT-NCPK-01~03 신차패키지 시공관리 - 탭/진행상태 표시용 공용 매핑(실데이터는 api/reservations.ts에서 조회)
export type NcpkTab = "wait" | "ing" | "done";

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
