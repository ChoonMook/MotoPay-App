// apps/api의 인증 엔드포인트(로그인/회원가입/아이디 중복확인) 호출
import { apiRequest, authedRequest } from "./http";

export interface LoginUser {
  id: string;
  username: string;
  name: string;
  email: string | null;
  phone: string | null;
  profileImageUrl: string | null;
  role: "ADMIN" | "PARTNER" | "SHOP" | "SUPPLIER" | "CUSTOMER";
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: LoginUser;
}

export interface SignupInput {
  username: string;
  password: string;
  email: string;
  /** PortOne 본인인증 건 ID — 이름·휴대폰번호는 서버가 이 값으로 PortOne에서 직접 조회해 확정함 */
  identityVerificationId: string;
  agreedTerms: boolean;
  agreedPrivacy: boolean;
  agreedMarketingSms?: boolean;
  agreedMarketingEmail?: boolean;
  agreedMarketingPush?: boolean;
}

export function login(username: string, password: string): Promise<LoginResult> {
  return apiRequest<LoginResult>("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
}

export interface SignupResult extends LoginResult {
  /** 이름+휴대폰이 일치하는 딜러 등록 신차 구매 정보가 있어 자동 매핑됐는지 — 가입완료 화면의 안내 배지 노출 여부에 사용 */
  newCarPackageMapped: boolean;
}

export function signup(input: SignupInput): Promise<SignupResult> {
  return apiRequest<SignupResult>("/auth/signup", { method: "POST", body: JSON.stringify(input) });
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const result = await apiRequest<{ available: boolean }>(`/auth/check-username/${encodeURIComponent(username)}`);
  return result.available;
}

export async function findUsername(name: string, phone: string): Promise<string> {
  const result = await apiRequest<{ username: string }>("/auth/find-username", {
    method: "POST",
    body: JSON.stringify({ name, phone }),
  });
  return result.username;
}

export async function requestPasswordReset(username: string, name: string, phone: string): Promise<string> {
  const result = await apiRequest<{ resetToken: string }>("/auth/request-password-reset", {
    method: "POST",
    body: JSON.stringify({ username, name, phone }),
  });
  return result.resetToken;
}

export function resetPassword(resetToken: string, newPassword: string): Promise<void> {
  return apiRequest<void>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ resetToken, newPassword }),
  });
}

/** 자동로그인 — 저장된 토큰으로 현재 사용자 정보를 조회해 세션을 복원(토큰이 만료·무효면 실패) */
export function getMe(): Promise<LoginUser> {
  return authedRequest<LoginUser>("/auth/me");
}
