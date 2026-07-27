// apps/api의 내 정보 변경 엔드포인트(PATCH /users/me, POST /users/me/profile-image, PATCH /users/me/password) 호출 — 로그인 필요
import { authedRequest } from "./http";
import type { LoginUser } from "./auth";

export interface UpdateProfileInput {
  name?: string;
  email?: string;
}

export function updateProfile(input: UpdateProfileInput): Promise<LoginUser> {
  return authedRequest<LoginUser>("/users/me", { method: "PATCH", body: JSON.stringify(input) });
}

/** dataUri: "data:image/jpeg;base64,..." 형식 */
export function updateProfileImage(dataUri: string): Promise<LoginUser> {
  return authedRequest<LoginUser>("/users/me/profile-image", {
    method: "POST",
    body: JSON.stringify({ imageBase64: dataUri }),
  });
}

export function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  return authedRequest<void>("/users/me/password", {
    method: "PATCH",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}
