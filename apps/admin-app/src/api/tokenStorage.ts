// 로그인 시 발급받은 JWT를 저장·조회·삭제 — "아이디 기억하기"와 별개로 이번 작업 범위에서는 세션 유지 기간을
// 탭/창 종료 시까지로 한정해 sessionStorage만 사용(로그인 화면의 "내 아이디 기억하기"는 별도로 localStorage에 아이디만 저장)
const ACCESS_TOKEN_KEY = "admin_access_token";
const REFRESH_TOKEN_KEY = "admin_refresh_token";

export function setTokens(accessToken: string, refreshToken: string) {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export const updateTokens = setTokens;

export function clearTokens() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

// refreshToken도 만료·무효라 재로그인이 필요할 때 App.tsx가 로그인 화면으로 돌아가도록 등록하는 콜백
let onSessionExpired: (() => void) | null = null;

export function setOnSessionExpired(callback: (() => void) | null) {
  onSessionExpired = callback;
}

export function notifySessionExpired() {
  onSessionExpired?.();
}
