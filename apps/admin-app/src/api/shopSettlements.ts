// apps/api의 정산 배치 엔드포인트(/admin/settlements/shop-batches/*) 호출 — AD-STL-04 패키지·시공 정산 내역 조회 화면 전용
import { authedRequest } from "./http";

export interface ShopSettlementBatchApi {
  id: number;
  shopCode: string;
  shopName: string;
  settlementMonth: string;
  grossAmount: number;
  commissionAmount: number;
  netPayoutAmount: number;
  payoutStatus: string;
  payoutDate: string | null;
  itemCount: number;
}

export interface GenerateShopSettlementResult {
  settlementMonth: string;
  processedReservationCount: number;
  batches: ShopSettlementBatchApi[];
}

export function generateShopSettlementBatches(settlementMonth: string): Promise<GenerateShopSettlementResult> {
  return authedRequest<GenerateShopSettlementResult>("/admin/settlements/shop-batches/generate", {
    method: "POST",
    body: JSON.stringify({ settlementMonth }),
  });
}

export function listShopSettlementBatches(params: { settlementMonth?: string; shopCode?: string } = {}): Promise<ShopSettlementBatchApi[]> {
  const query = new URLSearchParams();
  if (params.settlementMonth) query.set("settlementMonth", params.settlementMonth);
  if (params.shopCode) query.set("shopCode", params.shopCode);
  const qs = query.toString();
  return authedRequest<ShopSettlementBatchApi[]>(`/admin/settlements/shop-batches${qs ? `?${qs}` : ""}`);
}

export interface ShopSettlementItemApi {
  id: number;
  reservationNo: string;
  reservationType: string; // 'PKG' | 'BID'
  serviceDate: string; // "YYYY-MM-DD"
  customerName: string;
  carLabel: string | null;
  packageName: string | null; // PKG만 값 있음
  productCode: string | null;
  productName: string | null;
  grossAmount: number;
  commissionType: string;
  commissionAmount: number;
  netAmount: number;
}

export function getShopSettlementBatchItems(batchId: number): Promise<ShopSettlementItemApi[]> {
  return authedRequest<ShopSettlementItemApi[]>(`/admin/settlements/shop-batches/${batchId}/items`);
}

export interface UpdateShopSettlementPayoutInput {
  payoutStatus: string;
  payoutDate?: string;
}

export function updateShopSettlementPayout(batchId: number, input: UpdateShopSettlementPayoutInput): Promise<ShopSettlementBatchApi> {
  return authedRequest<ShopSettlementBatchApi>(`/admin/settlements/shop-batches/${batchId}/payout`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
