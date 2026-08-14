// apps/api의 추천안 제출 엔드포인트(POST /shops/me/bid-requests/:requestNo/plans) 호출 — 파트너 로그인 전용
import { authedRequest } from "./http";

export interface SubmitBidPlanItemInput {
  instCode: string;
  productCode?: string;
  productName: string;
  retailPrice: number;
  offerPrice: number;
}

export interface SubmitBidPlanPositionInput {
  position: string;
  level: string;
}

export interface SubmitBidPlanInput {
  items: SubmitBidPlanItemInput[];
  positions?: SubmitBidPlanPositionInput[];
  scheduledDate?: string; // "YYYY-MM-DD" — 생략하면 요청의 희망일 그대로 사용
  scheduledTime: string; // "HH:mm"
  reason: string;
}

/** 추천안 제출(상품·부위/농도·시공시각·추천사유) — 의뢰받은 요청에 한해 건당 1회, 선택 전까지는 재제출로 수정 가능 */
export function submitBidPlan(requestNo: string, input: SubmitBidPlanInput): Promise<{ success: true }> {
  return authedRequest<{ success: true }>(`/shops/me/bid-requests/${requestNo}/plans`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
