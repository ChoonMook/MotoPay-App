// apps/api의 입찰 제출 엔드포인트(POST /shops/me/bid-requests/:requestNo/offers) 호출 — 파트너 로그인 전용
import { authedRequest } from "./http";

export interface SubmitBidOfferItemInput {
  instCode: string;
  price: number;
}

export interface SubmitBidOfferInput {
  items: SubmitBidOfferItemInput[];
  scheduledTime: string; // "HH:mm"
  memo?: string;
}

/** 입찰 제출(항목별 견적) — 의뢰받은 요청에 한해 건당 1회 */
export function submitBidOffer(requestNo: string, input: SubmitBidOfferInput): Promise<{ success: true }> {
  return authedRequest<{ success: true }>(`/shops/me/bid-requests/${requestNo}/offers`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
