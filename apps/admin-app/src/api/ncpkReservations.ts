// apps/api의 신차패키지 시공현황 관리자 조회 엔드포인트(/admin/ncpk-reservations/*) 호출 — AD-NCPK-07 전용, 조회 전용(수정 없음)
import { authedRequest } from "./http";

export interface AdminPackageReservationListItem {
  reservationNo: string;
  customerName: string;
  car: string | null;
  vin: string | null;
  packageName: string | null;
  dealerName: string | null;
  shopName: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  status: string; // -> CommonCodeDetail(code='RESERVATION_STATUS')
  progressStatus: string; // -> CommonCodeDetail(code='RESERVATION_PROGRESS')
  createdAt: string; // ISO
}

export interface ListAdminPackageReservationsParams {
  keyword?: string;
  status?: string;
  progressStatus?: string;
  dealerCompanyId?: number;
}

export function listAdminPackageReservations(
  params: ListAdminPackageReservationsParams = {},
): Promise<AdminPackageReservationListItem[]> {
  const query = new URLSearchParams();
  if (params.keyword) query.set("keyword", params.keyword);
  if (params.status) query.set("status", params.status);
  if (params.progressStatus) query.set("progressStatus", params.progressStatus);
  if (params.dealerCompanyId) query.set("dealerCompanyId", String(params.dealerCompanyId));
  const qs = query.toString();
  return authedRequest<AdminPackageReservationListItem[]>(
    `/admin/ncpk-reservations${qs ? `?${qs}` : ""}`,
  );
}

export interface PackageJobItemApi {
  name: string;
  spec: string | null;
  tag: "BASIC" | "OPTION";
  price: number;
  prodCat: string | null; // -> CommonCodeDetail(code='PROD_CAT')
}

export interface AdminPackageReservationDetail {
  reservationNo: string;
  customerName: string;
  phoneMasked: string;
  car: string | null;
  vin: string | null;
  dealerName: string | null;
  shopName: string;
  date: string;
  time: string;
  status: string;
  progressStatus: string;
  packageName: string | null;
  items: PackageJobItemApi[];
  tintPositions: { position: string; level: string }[];
  cancelReason: string | null;
  cancelReasonEtc: string | null;
  completionMemo: string | null;
  completedAt: string | null;
  handoverConfirmedAt: string | null;
  photos: string[];
}

export function getAdminPackageReservationDetail(
  reservationNo: string,
): Promise<AdminPackageReservationDetail> {
  return authedRequest<AdminPackageReservationDetail>(
    `/admin/ncpk-reservations/${reservationNo}`,
  );
}
