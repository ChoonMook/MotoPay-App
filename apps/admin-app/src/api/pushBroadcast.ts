// apps/api의 관리자 푸시 발송 엔드포인트(/admin/push/*) 호출 — AD-CS-04(푸시 발송) 전용
import { authedRequest } from "./http";

export interface AdminPushBroadcastListItem {
  id: number;
  targetType: string; // 'USER' | 'PARTNER'
  scope: string; // 'ALL' | 'INDIVIDUAL'
  targetCount: number;
  title: string;
  body: string;
  createdBy: string | null;
  createdAt: string;
}

export function listPushBroadcastHistory(): Promise<AdminPushBroadcastListItem[]> {
  return authedRequest<AdminPushBroadcastListItem[]>("/admin/push/history");
}

export interface PartnerUserSearchItem {
  id: string;
  name: string;
  phone: string;
  shopName: string;
}

export function listPartnerUsersForPush(): Promise<PartnerUserSearchItem[]> {
  return authedRequest<PartnerUserSearchItem[]>("/admin/push/partner-users");
}

export interface SendPushBroadcastInput {
  targetType: "USER" | "PARTNER";
  scope: "ALL" | "INDIVIDUAL";
  ids?: string[];
  title: string;
  body: string;
}

export function sendPushBroadcast(input: SendPushBroadcastInput): Promise<{ targetCount: number }> {
  return authedRequest<{ targetCount: number }>("/admin/push/send", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
