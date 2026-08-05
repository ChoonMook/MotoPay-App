// apps/api의 내 차량 정보 엔드포인트(GET/POST/PATCH/DELETE /cars/me, POST /cars/me/:id/default) 호출 — 로그인 필요
import { authedRequest } from "./http";

export interface MyCarApi {
  id: number;
  regType: "MAP" | "MANUAL";
  purchaseVin: string | null;
  dealerCode: string | null;
  carBrandCode: string;
  carModelCode: string;
  trimName: string | null;
  modelYear: string | null;
  plateNumber: string | null;
  vin: string | null;
  isDefault: boolean;
  /** 신차매핑(MAP) 차량이 연결된 패키지 상품코드 -> Product.productCode(prodType='PKG'). GET /cars/me 응답에만 포함됨(수기등록은 null) */
  packageCode?: string | null;
  /** 이 패키지가 매핑된 시점 — 이 시점 이후에 생성된 예약만 이 패키지에 대한 예약으로 간주(수기등록은 null) */
  mappedAt?: string | null;
}

export interface MyCarInput {
  carBrandCode: string;
  carModelCode: string;
  trimName?: string;
  modelYear?: string;
  plateNumber?: string;
  vin?: string;
}

export function listMyCars(): Promise<MyCarApi[]> {
  return authedRequest<MyCarApi[]>("/cars/me");
}

export function createMyCar(input: MyCarInput): Promise<MyCarApi> {
  return authedRequest<MyCarApi>("/cars/me", { method: "POST", body: JSON.stringify(input) });
}

/** 신차매핑(MAP) 차량은 서버에서 plateNumber 외 필드 변경을 거부함(403) */
export function updateMyCar(id: number, input: Partial<MyCarInput>): Promise<MyCarApi> {
  return authedRequest<MyCarApi>(`/cars/me/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

/** 신차매핑(MAP) 차량은 서버에서 삭제를 거부함(403) */
export function deleteMyCar(id: number): Promise<void> {
  return authedRequest<void>(`/cars/me/${id}`, { method: "DELETE" });
}

export function setDefaultCar(id: number): Promise<MyCarApi> {
  return authedRequest<MyCarApi>(`/cars/me/${id}/default`, { method: "POST" });
}
