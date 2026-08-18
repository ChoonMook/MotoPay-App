// apps/api의 후기 관리자 엔드포인트(/admin/reviews/*) 호출 — AD-NOTI-02 전용
import { authedRequest } from "./http";

export interface AdminReviewListItem {
  id: number;
  reservationNo: string;
  memberNameMasked: string;
  shopName: string;
  rating: number;
  content: string;
  isBlinded: boolean;
  createdAt: string;
}

export interface ListAdminReviewsParams {
  keyword?: string;
  rating?: number;
  isBlinded?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export function listAdminReviews(params: ListAdminReviewsParams = {}): Promise<AdminReviewListItem[]> {
  const query = new URLSearchParams();
  if (params.keyword) query.set("keyword", params.keyword);
  if (params.rating) query.set("rating", String(params.rating));
  if (params.isBlinded !== undefined) query.set("isBlinded", String(params.isBlinded));
  if (params.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params.dateTo) query.set("dateTo", params.dateTo);
  const qs = query.toString();
  return authedRequest<AdminReviewListItem[]>(`/admin/reviews${qs ? `?${qs}` : ""}`);
}

export function setReviewBlinded(id: number, isBlinded: boolean): Promise<AdminReviewListItem> {
  return authedRequest<AdminReviewListItem>(`/admin/reviews/${id}/blind`, {
    method: "PATCH",
    body: JSON.stringify({ isBlinded }),
  });
}
