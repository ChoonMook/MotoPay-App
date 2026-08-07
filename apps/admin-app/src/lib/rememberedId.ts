// 로그인 화면의 "내 아이디 기억하기" — 로그인 자체는 api/adminAuth.ts(실 서버 인증)가 담당
const REMEMBERED_ID_KEY = "admin_remembered_id";

export function getRememberedId(): string {
  return localStorage.getItem(REMEMBERED_ID_KEY) ?? "";
}

export function setRememberedId(id: string | null): void {
  if (id) {
    localStorage.setItem(REMEMBERED_ID_KEY, id);
  } else {
    localStorage.removeItem(REMEMBERED_ID_KEY);
  }
}
