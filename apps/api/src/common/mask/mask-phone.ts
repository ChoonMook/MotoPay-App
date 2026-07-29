// 전화번호 마스킹 — formatPhone() 결과("010-1234-5678")의 마지막 그룹만 가려 노출("010-1234-••••")
export function maskPhone(formatted: string): string {
  const parts = formatted.split('-');
  if (parts.length !== 3) return formatted;
  const [head, mid, tail] = parts;
  return `${head}-${mid}-${'•'.repeat(tail.length)}`;
}
