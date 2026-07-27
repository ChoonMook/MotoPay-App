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

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}
