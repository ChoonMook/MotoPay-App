// apps/api의 예약 생성/조회/취소/일정변경/결제확정/일정변경요청 수락·거절/시공완료·인수확인/후기
// (POST /reservations, GET /reservations/me, PATCH /reservations/:id/cancel|reschedule|pay|resched-accept|resched-reject,
// GET/PATCH /reservations/:id/handover*, GET/POST /reservations/:id/review) 호출 — 로그인 필요
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
  paymentMethod: string | null; // "BANK"|"CARD" — 결제 확정 전이면 null
  couponName: string | null; // 적용한 쿠폰명 스냅샷 — 미적용이면 null
  couponDiscount: number | null; // 쿠폰 할인액(원) — 미적용이면 null
  pointsUsed: number | null; // 사용한 포인트(원)
  paidAmount: number | null; // 최종 결제금액(원) — 결제 확정 전이면 null
  paidAt: string | null; // 결제 확정 일시 — 결제 확정 전이면 null
  // 파트너 일정변경 요청(CU-RSVC-21) — "REQUESTED"(응답 대기)|"REJECTED"(거절됨)|null(활성 요청 없음)
  reschedStatus: string | null;
  reschedDate: string | null; // "YYYY-MM-DD" — 파트너가 제안한 새 날짜
  reschedTime: string | null; // "HH:mm" — 파트너가 제안한 새 시각
  reschedReason: string | null; // 파트너가 남긴 변경 사유
  reschedRejectReason: string | null; // 내가 거절 시 남긴 사유(선택)
  createdAt: string;
  updatedAt: string;
}

/** 파트너 일정변경 요청 수락(CU-RSVC-21) — 실제 일정이 파트너가 제안한 일시로 바뀜 */
export function acceptReservationResched(id: number): Promise<ReservationApi> {
  return authedRequest<ReservationApi>(`/reservations/${id}/resched-accept`, { method: "PATCH" });
}

/** 파트너 일정변경 요청 거절(CU-RSVC-21) — 기존 일정 유지, 거절 사유는 선택 입력 */
export function rejectReservationResched(id: number, reason?: string): Promise<ReservationApi> {
  return authedRequest<ReservationApi>(`/reservations/${id}/resched-reject`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export interface ConfirmPaymentInput {
  paymentMethod: "BANK" | "CARD";
  couponName?: string;
  couponDiscount?: number;
  pointsUsed?: number;
  paidAmount: number;
}

/** 결제 확정(CU-RSVC-14) — 업체/추천안 선정으로 생성된 예약에 쿠폰/포인트/결제수단/최종금액을 기록, 예약당 1회만 가능 */
export function confirmReservationPayment(id: number, input: ConfirmPaymentInput): Promise<ReservationApi> {
  return authedRequest<ReservationApi>(`/reservations/${id}/pay`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export interface CreateReservationInput {
  shopCode: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  reservationType: string;
  /** 신차패키지(PKG) 예약확정 시 최종 선택한 구성상품 전체(분류별 기본/업그레이드 1건 + 추가옵션들, 가격 포함) */
  selectedItems?: { componentCode: string; price: number }[];
  /** 신차패키지(PKG) 예약확정 시 선택한 썬팅 부위별 농도(패키지에 썬팅이 포함된 경우만) */
  tintPositions?: { position: string; level: string }[];
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
  price: number;
  prodCat: string | null;
}

export interface HandoverDetail {
  reservationNo: string;
  progressStatus: string;
  car: string | null;
  vin: string | null;
  packageName: string | null;
  items: HandoverItem[];
  tintPositions: { position: string; level: string }[];
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

export interface PackageSelectionItem {
  name: string;
  spec: string | null;
  tag: "BASIC" | "OPTION";
  price: number;
  prodCat: string | null;
}

export interface PackageSelectionDetail {
  car: string | null;
  vin: string | null;
  packageName: string | null;
  items: PackageSelectionItem[];
  tintPositions: { position: string; level: string }[];
}

/** 신차패키지 선택 내역(CU-NCPK-09/CU-RSVC-20) — 예약확정 시점에 저장된 시공 항목·제품·가격, 썬팅 부위별 농도.
 * getHandoverDetail과 달리 진행상태 상관없이(시공완료 전에도) 조회 가능 */
export function getPackageSelection(id: number): Promise<PackageSelectionDetail> {
  return authedRequest<PackageSelectionDetail>(`/reservations/${id}/package-items`);
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
