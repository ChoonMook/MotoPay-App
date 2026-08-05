// apps/api의 파트너 입찰함 엔드포인트(GET /shops/me/bid-requests) 호출 — 내 업체로 입찰의뢰가 온 예약시공 요청 목록, 파트너 로그인 전용
import { authedRequest } from "./http";

export interface ShopBidRequestItemApi {
  instCode: string;
  productName: string | null;
}

export interface ShopBidRequestPositionApi {
  position: string;
  level: string;
}

export interface ShopBidRequestCarApi {
  carBrandCode: string;
  carModelCode: string;
  trimName: string | null;
}

export interface ShopBidOfferItemApi {
  instCode: string;
  price: number;
}

export interface ShopBidPlanItemApi {
  instCode: string;
  productCode: string | null;
  productName: string;
  retailPrice: number;
  offerPrice: number;
}

export interface ShopBidRequestApi {
  requestNo: string;
  customerName: string;
  reqType: "GENERAL" | "EXPERT";
  /** 브랜드·차종 코드값(CommonCodeDetail(CAR_BRAND/CAR_MODEL) 조회로 "벤츠 E-Class"처럼 라벨 변환 필요) — 등록된 차량이 없으면 null */
  car: ShopBidRequestCarApi | null;
  items: ShopBidRequestItemApi[];
  positions: ShopBidRequestPositionApi[];
  radiusKm: number;
  minRating: number | null;
  budget: number | null;
  note: string | null;
  desiredDate: string; // "YYYY-MM-DD"
  bidDeadline: string; // ISO
  status: string; // OPEN/CLOSED/SELECTED -> CommonCodeDetail(code='BID_REQ_STATUS') (CANCELLED 요청은 이 API 응답에서 이미 제외됨)
  /** 고객이 최종 선택한 응찰번호(GENERAL, 없으면 null) — myOffer.offerNo와 비교해 낙찰 여부 판단 */
  selectedOfferNo: string | null;
  /** 고객이 최종 선택한 추천번호(EXPERT, 없으면 null) — myPlan.planNo와 비교해 낙찰 여부 판단 */
  selectedPlanNo: string | null;
  /** 내 업체가 이미 제출한 입찰(없으면 null) — 요청이 OPEN인 동안은 재제출로 수정 가능 */
  myOffer: { offerNo: string; items: ShopBidOfferItemApi[]; scheduledTime: string; memo: string | null } | null;
  /** 내 업체가 이미 제출한 추천안(없으면 null) — 요청이 OPEN인 동안은 재제출로 수정 가능 */
  myPlan: {
    planNo: string;
    items: ShopBidPlanItemApi[];
    positions: ShopBidRequestPositionApi[];
    scheduledTime: string;
    reason: string;
  } | null;
}

/** 내 업체로 입찰의뢰가 온 예약시공 요청 목록(입찰함) */
export function getMyBidRequests(): Promise<ShopBidRequestApi[]> {
  return authedRequest<ShopBidRequestApi[]>("/shops/me/bid-requests");
}
