// 아이디 찾기 응답용 마스킹 — 앞 3자리 + 별표 + 뒤 2자리만 노출(총 길이는 유지)
export function maskUsername(username: string): string {
  const len = username.length;
  if (len <= 5) {
    // 너무 짧으면 앞 1자리 + 별표만 노출
    return username[0] + '*'.repeat(Math.max(len - 1, 0));
  }
  const head = username.slice(0, 3);
  const tail = username.slice(len - 2);
  const maskedLen = len - 5;
  return head + '*'.repeat(maskedLen) + tail;
}
