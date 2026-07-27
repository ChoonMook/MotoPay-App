// 포인트 화면 공용 숫자 포맷터 (천단위 콤마)
export function nfmt(n: number): string {
  return n.toLocaleString("en-US");
}

export function parseDigits(value: string): number {
  return parseInt(value.replace(/[^0-9]/g, ""), 10) || 0;
}
