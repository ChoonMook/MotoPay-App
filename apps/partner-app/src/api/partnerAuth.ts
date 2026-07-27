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

export function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  return authedRequest<void>("/partner-auth/me/password", {
    method: "PATCH",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}
