// apps/api의 입찰 비교/선택 엔드포인트(GET /bid-requests/:id/offers, PATCH /bid-requests/:id/select) 호출 — 로그인 필요
import { authedRequest } from "./http";
import type { BidRequestApi } from "./bidRequests";

export interface BidOfferItemApi {
  instCode: string;
  price: number;
}

export interface BidOfferApi {
  offerNo: string;
  shopCode: string;
  shopName: string;
  items: BidOfferItemApi[];
  scheduledDate: string; // "YYYY-MM-DD" — 요청의 희망일과 다를 수 있음(업체가 다른 날짜로 응찰한 경우)
  scheduledTime: string; // "HH:mm"
  memo: string | null;
  createdAt: string;
}

/** 요청에 도착한 입찰 목록(업체 비교) */
export function getBidOffers(id: number): Promise<BidOfferApi[]> {
  return authedRequest<BidOfferApi[]>(`/bid-requests/${id}/offers`);
}

/** 입찰 중 하나를 선택 — 성공 시 status가 SELECTED로 바뀐 요청을 반환 */
export function selectBidOffer(id: number, offerNo: string): Promise<BidRequestApi> {
  return authedRequest<BidRequestApi>(`/bid-requests/${id}/select`, {
    method: "PATCH",
    body: JSON.stringify({ offerNo }),
  });
}
