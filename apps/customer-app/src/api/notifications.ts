// apps/api의 인앱 알림함 엔드포인트(/me/notifications) 호출 — CU-MYPG-12 전용, 로그인 필요
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
  return authedRequest<NotificationApi[]>("/me/notifications");
}

export function getUnreadNotificationCount(): Promise<number> {
  return authedRequest<number>("/me/notifications/unread-count");
}

export function markNotificationRead(id: number): Promise<void> {
  return authedRequest<void>(`/me/notifications/${id}/read`, { method: "PATCH" });
}
