// apps/api의 예약 생성/조회/취소/일정변경(POST /reservations, GET /reservations/me, PATCH /reservations/:id/cancel|reschedule) 호출 — 로그인 필요
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
