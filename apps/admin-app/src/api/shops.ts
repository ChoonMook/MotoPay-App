// apps/api의 공개 시공업체 조회 엔드포인트(/shops) 호출 — 로그인 불필요, AD-NCPK-04 매핑 체크리스트 등에서 사용
import { apiRequest } from "./http";

export interface ShopListItem {
  id: number;
  shopCode: string;
  name: string;
  address: string | null;
  useYn: boolean;
}

export function listShops(): Promise<ShopListItem[]> {
  return apiRequest<ShopListItem[]>("/shops");
}
