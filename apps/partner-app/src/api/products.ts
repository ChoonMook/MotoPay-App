// apps/api의 상품 카탈로그 조회 엔드포인트(GET /products) 호출 — 로그인 불필요(공개), 전문가추천 추천안 작성 시 상품 검색용
import { apiRequest } from "./http";

export interface ProductApi {
  id: number;
  productCode: string;
  prodType: string;
  brand: string | null;
  prodCat: string | null;
  name: string;
  price: number;
  originPrice: number | null;
}

/** 카테고리(prodCat)별 상품 카탈로그 조회 */
export function getProducts(prodCat: string): Promise<ProductApi[]> {
  return apiRequest<ProductApi[]>(`/products?prodCat=${encodeURIComponent(prodCat)}`);
}
