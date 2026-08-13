// 후기 작성자 실명 마스킹 — 성(첫 글자)만 노출하고 나머지는 "OO"로 대체(예: "길춘묵" -> "길OO")
export function maskReviewerName(name: string): string {
  if (!name) return '익명';
  return `${name[0]}OO`;
}
