// apps/api의 파트너 홈(PT-HOME-01) 예약 관련 엔드포인트(/shops/me/reservations/*) 호출 — 모두 파트너 로그인 전용
import { authedRequest } from "./http";

export interface TodayReservation {
  reservationNo: string;
  time: string; // "HH:mm"
  customerName: string;
  reservationType: string; // -> CommonCodeDetail(code='RESERVATION_TYPE')
  progressStatus: string; // -> CommonCodeDetail(code='RESERVATION_PROGRESS')
  car: string | null;
  plate: string | null;
}

export interface PackageProgressStats {
  applied: number;
  inProgress: number;
  done: number;
}

export interface PackageJob {
  reservationNo: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  customerName: string;
  car: string | null;
  vin: string | null;
  progressStatus: string; // APPLIED/IN_PROGRESS/DONE -> CommonCodeDetail(code='RESERVATION_PROGRESS')
  itemSummary: string;
}

export interface PackageJobItem {
  name: string;
  spec: string | null;
  tag: "BASIC" | "OPTION";
}

export interface PackageJobDetail {
  reservationNo: string;
  date: string;
  time: string;
  customerName: string;
  phoneMasked: string;
  car: string | null;
  vin: string | null;
  progressStatus: string;
  packageName: string | null;
  items: PackageJobItem[];
}

/** 내 업체의 오늘 예약 목록(파트너 홈 "오늘의 시공 일정") */
export function getTodayReservations(): Promise<TodayReservation[]> {
  return authedRequest<TodayReservation[]>("/shops/me/reservations/today");
}

/** 신차패키지 예약의 진행상태별 건수(파트너 홈 "신차패키지 시공관리" 통계) */
export function getPackageStats(): Promise<PackageProgressStats> {
  return authedRequest<PackageProgressStats>("/shops/me/reservations/package-stats");
}

/** 내 업체의 신차패키지 시공 건 목록(PT-NCPK-01) */
export function getPackageJobs(): Promise<PackageJob[]> {
  return authedRequest<PackageJob[]>("/shops/me/reservations/packages");
}

/** 신차패키지 시공 상세(PT-NCPK-02) — 고객·차량·패키지 구성상품 포함 */
export function getPackageJobDetail(reservationNo: string): Promise<PackageJobDetail> {
  return authedRequest<PackageJobDetail>(`/shops/me/reservations/packages/${reservationNo}`);
}

/** 예약 시공 진행상태 변경(신청/시공중/완료) */
export function updateReservationProgress(
  reservationNo: string,
  progressStatus: "APPLIED" | "IN_PROGRESS" | "DONE",
): Promise<void> {
  return authedRequest<void>(`/shops/me/reservations/${reservationNo}/progress`, {
    method: "PATCH",
    body: JSON.stringify({ progressStatus }),
  });
}
