// apps/api의 파트너 인증 엔드포인트(/partner-auth/*) 호출
import { apiRequest, authedRequest } from "./http";

export interface PartnerUser {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  shopCode: string;
  shopName: string;
  mustChangePassword: boolean;
}

export interface PartnerLoginResult {
  accessToken: string;
  refreshToken: string;
  partnerUser: PartnerUser;
}

export function login(username: string, password: string): Promise<PartnerLoginResult> {
  return apiRequest<PartnerLoginResult>("/partner-auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

/** 자동로그인 — 저장된 토큰으로 현재 계정 정보를 조회해 세션을 복원(토큰이 만료·무효면 실패) */
export function getMe(): Promise<PartnerUser> {
  return authedRequest<PartnerUser>("/partner-auth/me");
}

export function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  return authedRequest<void>("/partner-auth/me/password", {
    method: "PATCH",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function findUsername(name: string, phone: string): Promise<string> {
  const result = await apiRequest<{ username: string }>("/partner-auth/find-username", {
    method: "POST",
    body: JSON.stringify({ name, phone }),
  });
  return result.username;
}

export async function requestPasswordReset(username: string, name: string, phone: string): Promise<string> {
  const result = await apiRequest<{ resetToken: string }>("/partner-auth/request-password-reset", {
    method: "POST",
    body: JSON.stringify({ username, name, phone }),
  });
  return result.resetToken;
}

export function resetPassword(resetToken: string, newPassword: string): Promise<void> {
  return apiRequest<void>("/partner-auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ resetToken, newPassword }),
  });
}
