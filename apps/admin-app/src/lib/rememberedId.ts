// 관리자웹 로그인 세션 - 이번 작업 범위에서는 apps/api 인증 연동 없이 임시 목업 처리
// (아이디·비밀번호를 모두 입력하면 로그인 성공으로 간주). 실 서버 인증은 별도 작업으로 분리 예정
const SESSION_KEY = "admin_session";
const REMEMBERED_ID_KEY = "admin_remembered_id";

export interface AdminSession {
  username: string;
}

export function login(username: string, password: string): boolean {
  if (!username.trim() || !password.trim()) return false;
  const session: AdminSession = { username: username.trim() };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return true;
}

export function logout(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getSession(): AdminSession | null {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}

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
