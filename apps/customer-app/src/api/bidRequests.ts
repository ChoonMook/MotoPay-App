// apps/api의 예약시공 요청 생성/내 요청 목록 조회/취소
// (POST /bid-requests, GET /bid-requests/me, PATCH /bid-requests/:id/cancel) — 로그인 필요
import { authedRequest } from "./http";

export interface BidRequestItemApi {
  instCode: string;
  productName: string | null;
}

export interface BidRequestPositionApi {
  position: string;
  level: string;
}

export interface BidRequestCarApi {
  carBrandCode: string;
  carModelCode: string;
  trimName: string | null;
}

export interface BidRequestApi {
  id: number;
  requestNo: string;
  memberId: string;
  myCarId: number | null;
  reqType: "GENERAL" | "EXPERT";
  status: string;
  desiredDate: string; // "YYYY-MM-DD"
  radiusKm: number;
  minRating: number | null;
  budget: number | null;
  note: string | null;
  bidDeadline: string;
  createdAt: string;
  updatedAt: string;
  items: BidRequestItemApi[];
  positions: BidRequestPositionApi[];
  /** 요청 시점 대표차량 스냅샷(브랜드/차종 코드는 CommonCodeDetail(CAR_BRAND/CAR_MODEL) 조회로 라벨 변환 필요) — 등록된 차량이 없으면 null */
  car: BidRequestCarApi | null;
  /** 취소사유(SIMPLE/RE_REQUEST/ETC) — 취소된 요청만 값 존재 */
  cancelReason: string | null;
  /** 취소사유가 ETC일 때의 자유입력 사유 */
  cancelReasonNote: string | null;
  /** 고객이 선택한 응찰(GENERAL) -> BidOfferApi.offerNo — 선택(SELECTED) 시에만 값 존재 */
  selectedOfferNo: string | null;
  /** 고객이 선택한 추천안(EXPERT) -> BidPlanApi.planNo — 선택(SELECTED) 시에만 값 존재 */
  selectedPlanNo: string | null;
}

export interface CreateBidRequestInput {
  reqType: "GENERAL" | "EXPERT";
  desiredDate: string; // "YYYY-MM-DD"
  radiusKm: 5 | 10 | 20;
  minRating?: number;
  budget?: number;
  note?: string;
  items?: { instCode: string; productName?: string }[];
  positions?: { position: string; level: string }[];
}

export function createBidRequest(input: CreateBidRequestInput): Promise<BidRequestApi> {
  return authedRequest<BidRequestApi>("/bid-requests", { method: "POST", body: JSON.stringify(input) });
}

export function listMyBidRequests(): Promise<BidRequestApi[]> {
  return authedRequest<BidRequestApi[]>("/bid-requests/me");
}

export interface CancelBidRequestInput {
  cancelReason: "SIMPLE" | "RE_REQUEST" | "ETC";
  cancelReasonNote?: string;
}

export function cancelBidRequest(id: number, input: CancelBidRequestInput): Promise<BidRequestApi> {
  return authedRequest<BidRequestApi>(`/bid-requests/${id}/cancel`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
