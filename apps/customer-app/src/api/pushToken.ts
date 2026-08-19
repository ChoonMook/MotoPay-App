// apps/api의 Expo 푸시 토큰 등록/해제 엔드포인트(/me/push-token) 호출 — 로그인 필요
import { authedRequest } from "./http";

export function registerPushToken(expoPushToken: string, platform: "ios" | "android"): Promise<void> {
  return authedRequest<void>("/me/push-token", {
    method: "POST",
    body: JSON.stringify({ expoPushToken, platform }),
  });
}

export function unregisterPushToken(expoPushToken: string): Promise<void> {
  return authedRequest<void>("/me/push-token", {
    method: "DELETE",
    body: JSON.stringify({ expoPushToken }),
  });
}
