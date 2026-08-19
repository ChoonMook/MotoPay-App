// apps/api의 인앱 알림함 엔드포인트(/partner-auth/me/notifications) 호출 — PT-PROF-01 알림함 전용, 로그인 필요
import { authedRequest } from "./http";

export interface NotificationApi {
  id: number;
  type: string; // -> CommonCodeDetail(code='NOTI_TYPE')
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export function listMyNotifications(): Promise<NotificationApi[]> {
  return authedRequest<NotificationApi[]>("/partner-auth/me/notifications");
}

export function getUnreadNotificationCount(): Promise<number> {
  return authedRequest<number>("/partner-auth/me/notifications/unread-count");
}

export function markNotificationRead(id: number): Promise<void> {
  return authedRequest<void>(`/partner-auth/me/notifications/${id}/read`, { method: "PATCH" });
}
