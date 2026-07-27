// 신차패키지 화면 공용 숫자 포맷터 (천단위 콤마)
export function nfmt(n: number): string {
  return n.toLocaleString("en-US");
}
