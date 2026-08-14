// apps/api의 내 업체(Shop) 조회·수정 엔드포인트(/shops/me), 후기 조회(/shops/me/reviews, PT-STL-03) 호출 — 파트너 로그인 전용
import { authedRequest } from "./http";

export interface ShopPhoto {
  id: number;
  shopCode: string;
  photoPath: string;
  photoType: string;
  sortOrder: number;
}

export interface MyShop {
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
  businessHours: string | null;
  useYn: boolean;
  photos: ShopPhoto[];
  categories: string[];
}

export interface UpdateShopInput {
  intro?: string;
  greeting?: string;
  zipCode?: string;
  address?: string;
  addressDetail?: string;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string;
  businessHours?: string;
  categories?: string[];
}

export function getMyShop(): Promise<MyShop> {
  return authedRequest<MyShop>("/shops/me");
}

export function updateMyShop(input: UpdateShopInput): Promise<MyShop> {
  return authedRequest<MyShop>("/shops/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function uploadShopPhoto(imageBase64: string, photoType: "MAIN" | "CASE"): Promise<MyShop> {
  return authedRequest<MyShop>("/shops/me/photos", {
    method: "POST",
    body: JSON.stringify({ imageBase64, photoType }),
  });
}

export function deleteShopPhoto(photoId: number): Promise<MyShop> {
  return authedRequest<MyShop>(`/shops/me/photos/${photoId}`, { method: "DELETE" });
}

export interface ShopReviewItem {
  id: number;
  reviewerName: string;
  rating: number;
  content: string;
  photos: string[];
  createdAt: string;
  car: string | null;
}

export interface ShopReviewPage {
  items: ShopReviewItem[];
  total: number;
  avgRating: number | null;
}

export function listMyReviews(offset: number, limit: number): Promise<ShopReviewPage> {
  return authedRequest<ShopReviewPage>(`/shops/me/reviews?offset=${offset}&limit=${limit}`);
}
