// apps/api의 관리자 인증 엔드포인트(/admin-auth/*) 호출
import { apiRequest, authedRequest } from "./http";

export type AdminAccountType = "ADMIN" | "PARTNER" | "SUPPLIER";

export interface AdminAccount {
  id: string;
  username: string;
  name: string;
  email: string | null;
  phone: string | null;
  accountType: AdminAccountType;
  permGroup: string;
  lastLoginAt: string | null;
}

export interface AdminLoginResult {
  accessToken: string;
  refreshToken: string;
  adminAccount: AdminAccount;
}

export function login(username: string, password: string): Promise<AdminLoginResult> {
  return apiRequest<AdminLoginResult>("/admin-auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

/** 자동로그인 — 저장된 토큰으로 현재 계정 정보를 조회해 세션을 복원(토큰이 만료·무효면 실패) */
export function getMe(): Promise<AdminAccount> {
  return authedRequest<AdminAccount>("/admin-auth/me");
}

export interface UpdateAdminMeInput {
  email?: string;
  phone?: string;
  newPassword?: string;
}

/** 내 정보 수정 — 이메일·휴대폰번호·비밀번호(선택) 중 전달된 값만 갱신 */
export function updateMe(input: UpdateAdminMeInput): Promise<AdminAccount> {
  return authedRequest<AdminAccount>("/admin-auth/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
