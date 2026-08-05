// apps/api의 파트너 홈(PT-HOME-01) 예약 관련 엔드포인트(/shops/me/reservations/*) 호출 — 모두 파트너 로그인 전용
import type {
  ShopBidRequestCarApi,
  ShopBidRequestItemApi,
  ShopBidRequestPositionApi,
} from "./bidRequests";
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
  phone: string | null; // 해피콜 발신용 실번호("010-1234-5678") — 화면 표시는 phoneMasked만 사용
  car: string | null;
  vin: string | null;
  progressStatus: string;
  packageName: string | null;
  items: PackageJobItem[];
  completionMemo: string | null;
  completedAt: string | null;
  handoverConfirmedAt: string | null; // 고객이 인수확인했거나(또는 completedAt+3일 경과로 자동확정된) 시점
  photos: string[]; // uploads/ 기준 상대경로 — 완료 등록 시 첨부한 시공 사진
}

export interface BidJob {
  reservationNo: string;
  requestNo: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  customerName: string;
  car: ShopBidRequestCarApi | null;
  progressStatus: string; // APPLIED/IN_PROGRESS/DONE -> CommonCodeDetail(code='RESERVATION_PROGRESS')
  items: ShopBidRequestItemApi[];
  positions: ShopBidRequestPositionApi[];
}

export interface CallLog {
  id: number;
  result: string; // CONNECTED/NOANSWER/RETRY -> CommonCodeDetail(code='CALL_RESULT')
  memo: string | null;
  createdAt: string; // ISO
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

/** 내 업체의 예약시공(입찰) 시공 건 목록(PT-RSVC-08) — 낙찰 확정된 Reservation(BID) 전체 */
export function getBidJobs(): Promise<BidJob[]> {
  return authedRequest<BidJob[]>("/shops/me/reservations/bids");
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

/** 시공 완료 등록(PT-NCPK-04) — 시공중 상태에서만 가능, 시공 사진(3~10장, data URI)·작업 메모 저장 후 진행상태를 완료로 전환 */
export function completeReservationJob(
  reservationNo: string,
  params: { photos: string[]; memo?: string },
): Promise<void> {
  return authedRequest<void>(`/shops/me/reservations/${reservationNo}/complete`, {
    method: "PATCH",
    body: JSON.stringify(params),
  });
}

/** 해피콜(고객 확인 전화) 이력 목록(최신순, PT-RSVC-03) */
export function getCallLogs(reservationNo: string): Promise<CallLog[]> {
  return authedRequest<CallLog[]>(`/shops/me/reservations/${reservationNo}/call-logs`);
}

/** 해피콜 이력 등록 */
export function addCallLog(
  reservationNo: string,
  params: { result: "CONNECTED" | "NOANSWER" | "RETRY"; memo?: string },
): Promise<void> {
  return authedRequest<void>(`/shops/me/reservations/${reservationNo}/call-logs`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}
