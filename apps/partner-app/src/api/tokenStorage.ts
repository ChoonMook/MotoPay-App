// 로그인 시 발급받은 JWT를 저장·조회·삭제 — "자동로그인" 체크 여부에 따라 localStorage(브라우저 재시작 후에도 유지)
// 또는 sessionStorage(탭/앱 종료 시 삭제)에 나눠 저장
const ACCESS_TOKEN_KEY = "motopay_partner_access_token";
const REFRESH_TOKEN_KEY = "motopay_partner_refresh_token";

export function setTokens(accessToken: string, refreshToken: string, persist: boolean) {
  const storage = persist ? localStorage : sessionStorage;
  storage.setItem(ACCESS_TOKEN_KEY, accessToken);
  storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY) ?? sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY) ?? sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

/** accessToken 재발급(refresh) 성공 시 호출 — 기존에 저장했던 곳(localStorage/sessionStorage)에 그대로 덮어씀 */
export function updateTokens(accessToken: string, refreshToken: string) {
  const persist = localStorage.getItem(ACCESS_TOKEN_KEY) !== null;
  setTokens(accessToken, refreshToken, persist);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

// refreshToken도 만료·무효라 재로그인이 필요할 때 App.tsx가 로그인 화면으로 돌아가도록 등록하는 콜백
// (전역 상태 관리가 없는 구조라, http.ts처럼 React 트리 밖에서도 세션 만료를 알릴 수 있게 최소한의 콜백만 둠)
let onSessionExpired: (() => void) | null = null;

export function setOnSessionExpired(callback: (() => void) | null) {
  onSessionExpired = callback;
}

export function notifySessionExpired() {
  onSessionExpired?.();
}
