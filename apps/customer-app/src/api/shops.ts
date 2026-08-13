// apps/api의 시공업체 목록/상세 조회(GET /shops, GET /shops/:shopCode) 호출 — 로그인 불필요
import { apiRequest } from "./http";

export interface ShopPhotoApi {
  id: number;
  shopCode: string;
  photoPath: string;
  photoType: string;
  sortOrder: number;
}

interface ShopFields {
  id: number;
  shopCode: string;
  name: string;
  greeting: string | null;
  intro: string | null;
  zipCode: string | null;
  address: string | null;
  addressDetail: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  useYn: boolean;
}

export interface ShopListItemApi extends ShopFields {
  mainPhoto: ShopPhotoApi | null;
  categories: string[]; // CommonCodeDetail(code='CAR_INST') 코드 목록
  distanceKm: number | null; // lat/lng 지정 시에만 값 존재
  avgRating: number | null; // 후기가 하나도 없으면 null
  reviewCount: number;
}

export interface ShopDetailApi extends ShopFields {
  photos: ShopPhotoApi[];
  categories: string[];
  avgRating: number | null;
  reviewCount: number;
}

export interface ShopReviewApi {
  id: number;
  reviewerName: string; // 서버가 이미 마스킹해서 내려줌(예: "길OO")
  rating: number;
  content: string;
  photos: string[]; // uploads/ 기준 상대경로
  createdAt: string;
}

export interface ListShopsParams {
  instCodes?: string[];
  /** 지정하면 이 딜러사(Company.id)가 DealerShopMapping(AD-NCPK-04)으로 등록한 업체만 조회 — 신차패키지 시공업체 선택 전용 */
  dealerCompanyId?: number;
  lat?: number;
  lng?: number;
}

export function listShops(params: ListShopsParams = {}): Promise<ShopListItemApi[]> {
  const query = new URLSearchParams();
  if (params.instCodes && params.instCodes.length > 0) query.set("instCodes", params.instCodes.join(","));
  if (params.dealerCompanyId !== undefined) query.set("dealerCompanyId", String(params.dealerCompanyId));
  if (params.lat !== undefined) query.set("lat", String(params.lat));
  if (params.lng !== undefined) query.set("lng", String(params.lng));
  const qs = query.toString();
  return apiRequest<ShopListItemApi[]>(`/shops${qs ? `?${qs}` : ""}`);
}

export function getShopDetail(shopCode: string): Promise<ShopDetailApi> {
  return apiRequest<ShopDetailApi>(`/shops/${shopCode}`);
}

export function listShopReviews(shopCode: string): Promise<ShopReviewApi[]> {
  return apiRequest<ShopReviewApi[]>(`/shops/${shopCode}/reviews`);
}
