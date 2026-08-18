// apps/api의 포인트 관리자 엔드포인트(/admin/points/*) 호출 — AD-PNT-04(강제 부여)/05(강제 차감)/06(내역 조회) 전용
import { authedRequest } from "./http";

export interface AdminPointHistoryListItem {
  id: number;
  memberId: string;
  memberName: string;
  kind: string; // -> CommonCodeDetail(code='POINT_HIST_KIND')
  amount: number;
  balanceAfter: number;
  title: string;
  reason: string | null;
  createdBy: string | null;
  createdAt: string; // ISO
}

export interface ListAdminPointHistoryParams {
  keyword?: string;
  kind?: string;
  dateFrom?: string;
  dateTo?: string;
  memberId?: string;
}

export function listAdminPointHistories(
  params: ListAdminPointHistoryParams = {},
): Promise<AdminPointHistoryListItem[]> {
  const query = new URLSearchParams();
  if (params.keyword) query.set("keyword", params.keyword);
  if (params.kind) query.set("kind", params.kind);
  if (params.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params.dateTo) query.set("dateTo", params.dateTo);
  if (params.memberId) query.set("memberId", params.memberId);
  const qs = query.toString();
  return authedRequest<AdminPointHistoryListItem[]>(`/admin/points${qs ? `?${qs}` : ""}`);
}

export interface ForcePointAdjustInput {
  memberId: string;
  amount: number;
  reason: string;
}

export function forceGrantPoints(input: ForcePointAdjustInput): Promise<AdminPointHistoryListItem> {
  return authedRequest<AdminPointHistoryListItem>("/admin/points/grant", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function forceDeductPoints(input: ForcePointAdjustInput): Promise<AdminPointHistoryListItem> {
  return authedRequest<AdminPointHistoryListItem>("/admin/points/deduct", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface GrantPurchasePointsItem {
  vin: string;
  amount: number;
}

export interface GrantPurchasePointsResultRow {
  vin: string;
  success: boolean;
  error?: string;
}

export function grantPurchasePoints(
  items: GrantPurchasePointsItem[],
  reason: string,
): Promise<GrantPurchasePointsResultRow[]> {
  return authedRequest<GrantPurchasePointsResultRow[]>("/admin/points/grant-purchase", {
    method: "POST",
    body: JSON.stringify({ items, reason }),
  });
}
