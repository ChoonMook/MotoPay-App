// apps/api의 예약 생성/조회/취소/일정변경/시공완료·인수확인/후기
// (POST /reservations, GET /reservations/me, PATCH /reservations/:id/cancel|reschedule, GET/PATCH /reservations/:id/handover*,
// GET/POST /reservations/:id/review) 호출 — 로그인 필요
import { authedRequest } from "./http";

export interface ReservationApi {
  id: number;
  reservationNo: string;
  shopCode: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  seq: number;
  reservationType: string; // -> CommonCodeDetail(code='RESERVATION_TYPE'), 신차패키지는 'PKG'
  memberId: string;
  status: string; // -> CommonCodeDetail(code='RESERVATION_STATUS'), CONFIRMED/CANCELLED
  progressStatus: string; // -> CommonCodeDetail(code='RESERVATION_PROGRESS'), APPLIED/IN_PROGRESS/DONE
  cancelReason: string | null; // -> CommonCodeDetail(code='CANCEL_REASON')
  cancelReasonEtc: string | null;
  cancelledAt: string | null;
  completionMemo: string | null;
  completedAt: string | null; // progressStatus가 DONE으로 바뀐 시점
  handoverConfirmedAt: string | null; // 고객이 인수확인했거나(또는 completedAt+3일 경과로 자동확정된) 시점
  requestNo: string | null; // reservationType='BID'인 건만 값 존재 -> BidRequestApi.requestNo
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservationInput {
  shopCode: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  reservationType: string;
}

export function createReservation(input: CreateReservationInput): Promise<ReservationApi> {
  return authedRequest<ReservationApi>("/reservations", { method: "POST", body: JSON.stringify(input) });
}

export function listMyReservations(): Promise<ReservationApi[]> {
  return authedRequest<ReservationApi[]>("/reservations/me");
}

export function cancelReservation(id: number, reason: string, reasonEtc?: string): Promise<ReservationApi> {
  return authedRequest<ReservationApi>(`/reservations/${id}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({ reason, reasonEtc }),
  });
}

export function rescheduleReservation(id: number, date: string, time: string): Promise<ReservationApi> {
  return authedRequest<ReservationApi>(`/reservations/${id}/reschedule`, {
    method: "PATCH",
    body: JSON.stringify({ date, time }),
  });
}

export interface HandoverItem {
  name: string;
  spec: string | null;
  tag: "BASIC" | "OPTION";
}

export interface HandoverDetail {
  reservationNo: string;
  progressStatus: string;
  car: string | null;
  vin: string | null;
  items: HandoverItem[];
  photos: string[]; // uploads/ 기준 상대경로
  completionMemo: string | null;
  completedAt: string | null;
  handoverConfirmedAt: string | null;
  handoverStatus: "pending" | "confirmed";
}

/** 시공완료·인수확인 상세(CU-RSVC-16/CU-NCPK-10) — 시공완료 상태의 예약만 조회 가능 */
export function getHandoverDetail(id: number): Promise<HandoverDetail> {
  return authedRequest<HandoverDetail>(`/reservations/${id}/handover`);
}

/** 인수확인 — 시공완료 상태에서 1회만 가능 */
export function confirmHandover(id: number): Promise<void> {
  return authedRequest<void>(`/reservations/${id}/handover-confirm`, { method: "PATCH" });
}

export interface ReviewApi {
  rating: number;
  content: string;
  photos: string[]; // uploads/ 기준 상대경로
  createdAt: string;
}

export interface CreateReviewInput {
  rating: number;
  content: string;
  photos?: string[]; // data URI(base64) 목록
}

/** 후기 조회(CU-RSVC-17) — 작성한 후기가 없으면 null */
export function getReview(id: number): Promise<ReviewApi | null> {
  return authedRequest<{ review: ReviewApi | null }>(`/reservations/${id}/review`).then((res) => res.review);
}

/** 후기 등록 — 시공완료 상태에서 예약당 1회만 가능 */
export function createReview(id: number, input: CreateReviewInput): Promise<ReviewApi> {
  return authedRequest<ReviewApi>(`/reservations/${id}/review`, { method: "POST", body: JSON.stringify(input) });
}
