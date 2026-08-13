// apps/api의 신차 구매내역 관리자 CRUD 엔드포인트(/admin/new-car-purchases/*) 호출
// DL-NCPK-01(신차 구매내역 입력, 탭 허브)~04(등록 내역 조회) 화면 전용
import { authedRequest } from "./http";

export interface NewCarPurchaseListItem {
  vin: string;
  dealerCompanyId: number;
  customerName: string;
  phone: string;
  carBrandCode: string;
  carModelCode: string;
  trimName: string;
  modelYear: string | null;
  packageCode: string | null;
  purchaseDate: string | null;
  isMapped: boolean;
  mappedAt: string | null;
  confirmed: boolean;
  confirmedAt: string | null;
  confirmedBy: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  componentCodes: string[];
  used: boolean;
  usedDate: string | null;
  usedShopName: string | null;
}

export interface ListNewCarPurchasesParams {
  keyword?: string;
  confirmed?: boolean;
}

export function listNewCarPurchases(params: ListNewCarPurchasesParams = {}): Promise<NewCarPurchaseListItem[]> {
  const query = new URLSearchParams();
  if (params.keyword) query.set("keyword", params.keyword);
  if (params.confirmed !== undefined) query.set("confirmed", String(params.confirmed));
  const qs = query.toString();
  return authedRequest<NewCarPurchaseListItem[]>(`/admin/new-car-purchases${qs ? `?${qs}` : ""}`);
}

export interface NewCarPurchaseInput {
  vin: string;
  dealerCompanyId: number;
  customerName: string;
  phone: string;
  carBrandCode: string;
  carModelCode: string;
  trimName: string;
  modelYear?: string;
  purchaseDate?: string;
  packageCode?: string;
  componentCodes?: string[];
}

export function createNewCarPurchase(input: NewCarPurchaseInput): Promise<NewCarPurchaseListItem> {
  return authedRequest<NewCarPurchaseListItem>("/admin/new-car-purchases", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface BulkCreateResultRow {
  vin: string;
  success: boolean;
  error?: string;
}

export function bulkCreateNewCarPurchases(rows: NewCarPurchaseInput[]): Promise<BulkCreateResultRow[]> {
  return authedRequest<BulkCreateResultRow[]>("/admin/new-car-purchases/bulk", {
    method: "POST",
    body: JSON.stringify({ rows }),
  });
}

export type UpdateNewCarPurchaseInput = Partial<Omit<NewCarPurchaseInput, "vin" | "dealerCompanyId">>;

export function updateNewCarPurchase(vin: string, input: UpdateNewCarPurchaseInput): Promise<NewCarPurchaseListItem> {
  return authedRequest<NewCarPurchaseListItem>(`/admin/new-car-purchases/${vin}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function confirmNewCarPurchase(vin: string): Promise<NewCarPurchaseListItem> {
  return authedRequest<NewCarPurchaseListItem>(`/admin/new-car-purchases/${vin}/confirm`, { method: "POST" });
}
