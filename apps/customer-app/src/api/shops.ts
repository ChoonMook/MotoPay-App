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
}

export interface ShopDetailApi extends ShopFields {
  photos: ShopPhotoApi[];
  categories: string[];
}

export function listShops(): Promise<ShopListItemApi[]> {
  return apiRequest<ShopListItemApi[]>("/shops");
}

export function getShopDetail(shopCode: string): Promise<ShopDetailApi> {
  return apiRequest<ShopDetailApi>(`/shops/${shopCode}`);
}
