// apps/api의 예약시공현황 관리자 조회 엔드포인트(/admin/bid-requests/*) 호출 — AD-RSVC-02 전용, 조회 전용(수정 없음)
import { authedRequest } from "./http";

export interface BidRequestCarApi {
  carBrandCode: string;
  carModelCode: string;
  trimName: string | null;
}

export interface AdminBidRequestListItem {
  requestNo: string;
  reqType: string; // GENERAL(일반입찰)|EXPERT(전문가추천) -> CommonCodeDetail(code='BID_REQ_TYPE')
  status: string; // -> CommonCodeDetail(code='BID_REQ_STATUS')
  customerName: string;
  car: BidRequestCarApi | null;
  itemInstCodes: string[]; // -> CommonCodeDetail(code='CAR_INST')
  desiredDate: string; // "YYYY-MM-DD"
  bidDeadline: string; // ISO
  responseCount: number; // GENERAL은 응찰 수, EXPERT는 추천안 수
  selectedShopName: string | null;
  createdAt: string; // ISO
}

export interface ListAdminBidRequestsParams {
  keyword?: string;
  reqType?: string;
  status?: string;
}

export function listAdminBidRequests(params: ListAdminBidRequestsParams = {}): Promise<AdminBidRequestListItem[]> {
  const query = new URLSearchParams();
  if (params.keyword) query.set("keyword", params.keyword);
  if (params.reqType) query.set("reqType", params.reqType);
  if (params.status) query.set("status", params.status);
  const qs = query.toString();
  return authedRequest<AdminBidRequestListItem[]>(`/admin/bid-requests${qs ? `?${qs}` : ""}`);
}

export interface BidRequestItemApi {
  requestNo: string;
  instCode: string;
  productName: string | null;
}

export interface BidRequestPositionApi {
  requestNo: string;
  position: string;
  level: string;
}

export interface BidOfferItemApi {
  offerNo: string;
  instCode: string;
  price: number;
}

export interface AdminBidOffer {
  offerNo: string;
  shopCode: string;
  shopName: string;
  items: BidOfferItemApi[];
  scheduledDate: string;
  scheduledTime: string;
  memo: string | null;
  createdAt: string;
}

export interface BidPlanItemApi {
  planNo: string;
  instCode: string;
  productCode: string | null;
  productName: string;
  retailPrice: number;
  offerPrice: number;
}

export interface BidPlanPositionApi {
  planNo: string;
  position: string;
  level: string;
}

export interface AdminBidPlan {
  planNo: string;
  shopCode: string;
  shopName: string;
  items: BidPlanItemApi[];
  positions: BidPlanPositionApi[];
  scheduledDate: string;
  scheduledTime: string;
  reason: string;
  createdAt: string;
}

export interface AdminBidRequestDetail {
  requestNo: string;
  reqType: string;
  status: string;
  customerName: string;
  car: BidRequestCarApi | null;
  items: BidRequestItemApi[];
  positions: BidRequestPositionApi[];
  radiusKm: number;
  minRating: number | null;
  budget: number | null;
  note: string | null;
  desiredDate: string;
  bidDeadline: string;
  cancelReason: string | null;
  cancelReasonNote: string | null;
  selectedOfferNo: string | null;
  selectedPlanNo: string | null;
  offers: AdminBidOffer[]; // GENERAL만 값 존재
  plans: AdminBidPlan[]; // EXPERT만 값 존재
}

export function getAdminBidRequestDetail(requestNo: string): Promise<AdminBidRequestDetail> {
  return authedRequest<AdminBidRequestDetail>(`/admin/bid-requests/${requestNo}`);
}
