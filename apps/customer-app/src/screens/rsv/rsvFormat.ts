// 예약시공 화면 공용 숫자 포맷터 (천단위 콤마)
export function nfmt(n: number): string {
  return n.toLocaleString("en-US");
}

export function parseDigits(value: string): number {
  return parseInt(value.replace(/[^0-9]/g, ""), 10) || 0;
}

// "YYYY-MM-DD" -> "8월 7일(금)" (시간 없이 날짜만) — 입찰/추천 상세에서 업체 제안일과 내 희망일을 나란히 비교 표시할 때 사용
export function formatDateOnlyLabel(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${d.getMonth() + 1}월 ${d.getDate()}일(${weekday})`;
}
