// apps/api의 정산 기준 관리 엔드포인트(/admin/settlements/*) 호출 — AD-STL-02 패키지·시공 정산 기준 관리 화면 전용.
// 시공업체 기본 수수료 수정은 AD-CO-02 업체관리 매장정보 탭(api/companies.ts의 updateCompanyShopSettlement)
// 으로 이관됨(2026-08-23) — 여기 listShopCommissions는 예외 화면에 기본값 힌트를 보여주기 위한 읽기 전용
import { authedRequest } from "./http";

export interface ShopCommissionApi {
  shopCode: string;
  name: string;
  useYn: boolean;
  commissionType: string | null;
  commissionAmount: number | null;
  commissionRate: number | null;
}

export function listShopCommissions(): Promise<ShopCommissionApi[]> {
  return authedRequest<ShopCommissionApi[]>("/admin/settlements/shops");
}

export interface ProductShopCommissionApi {
  shopCode: string;
  commissionType: string;
  commissionAmount: number | null;
  commissionRate: number | null;
}

export function getProductCommissions(productCode: string): Promise<ProductShopCommissionApi[]> {
  return authedRequest<ProductShopCommissionApi[]>(`/admin/settlements/products/${productCode}/commissions`);
}

export interface ProductShopCommissionInput {
  shopCode: string;
  commissionType: string;
  commissionAmount?: number;
  commissionRate?: number;
}

export function setProductCommissions(
  productCode: string,
  items: ProductShopCommissionInput[],
): Promise<ProductShopCommissionApi[]> {
  return authedRequest<ProductShopCommissionApi[]>(`/admin/settlements/products/${productCode}/commissions`, {
    method: "PUT",
    body: JSON.stringify({ items }),
  });
}
