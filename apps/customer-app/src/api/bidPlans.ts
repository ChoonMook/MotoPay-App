// apps/api의 추천안 비교/선택 엔드포인트(GET /bid-requests/:id/plans, PATCH /bid-requests/:id/select-plan) 호출 — 로그인 필요
import { authedRequest } from "./http";
import type { BidRequestApi } from "./bidRequests";

export interface BidPlanItemApi {
  instCode: string;
  productCode: string | null;
  productName: string;
  retailPrice: number;
  offerPrice: number;
}

export interface BidPlanPositionApi {
  position: string;
  level: string;
}

export interface BidPlanApi {
  planNo: string;
  shopName: string;
  items: BidPlanItemApi[];
  positions: BidPlanPositionApi[];
  scheduledTime: string; // "HH:mm"
  reason: string;
  createdAt: string;
}

/** 요청에 도착한 추천안 목록(업체 비교, 전문가추천 전용) */
export function getBidPlans(id: number): Promise<BidPlanApi[]> {
  return authedRequest<BidPlanApi[]>(`/bid-requests/${id}/plans`);
}

/** 추천안 중 하나를 선택 — 성공 시 status가 SELECTED로 바뀐 요청을 반환 */
export function selectBidPlan(id: number, planNo: string): Promise<BidRequestApi> {
  return authedRequest<BidRequestApi>(`/bid-requests/${id}/select-plan`, {
    method: "PATCH",
    body: JSON.stringify({ planNo }),
  });
}
