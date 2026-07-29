// apps/api의 업체 스케줄(휴무일/예약가능 시간대/예약현황) 엔드포인트(/shops/:shopCode/holidays, /time-slots, /schedule) 호출
import { apiRequest, authedRequest } from "./http";

export interface TimeSlot {
  time: string; // "HH:mm"
  capacity: number;
}

export interface MonthlyScheduleDay {
  date: string; // "YYYY-MM-DD"
  reservedCount: number;
  isHoliday: boolean;
  isLocked: boolean;
}

export interface DailySlotReservation {
  reservationNo: string;
  seq: number;
  reservationType: string;
  customerName: string;
}

export interface DailySlot {
  time: string; // "HH:mm"
  capacity: number | null;
  isLocked: boolean;
  reservedCount: number;
  reservations: DailySlotReservation[];
}

export interface DailySchedule {
  date: string; // "YYYY-MM-DD"
  isHoliday: boolean;
  slots: DailySlot[];
}

/** 업체 휴무일 조회 — year/month 기준 월 단위, 로그인 불필요(공개) */
export function listHolidays(shopCode: string, year: number, month: number): Promise<string[]> {
  return apiRequest<string[]>(`/shops/${shopCode}/holidays?year=${year}&month=${month}`);
}

/** 휴무일 일괄 등록(파트너 로그인 전용·본인 소속 업체만) */
export function addHolidays(shopCode: string, dates: string[]): Promise<void> {
  return authedRequest<void>(`/shops/${shopCode}/holidays`, {
    method: "POST",
    body: JSON.stringify({ dates }),
  });
}

/** 휴무일 개별 해제(파트너 로그인 전용·본인 소속 업체만) */
export function removeHoliday(shopCode: string, date: string): Promise<void> {
  return authedRequest<void>(`/shops/${shopCode}/holidays/${date}`, {
    method: "DELETE",
  });
}

/** 요일구분(dayType)별 예약가능 시간대 템플릿 조회 — 로그인 불필요(공개) */
export function getTimeSlots(shopCode: string, dayType: string): Promise<TimeSlot[]> {
  return apiRequest<TimeSlot[]>(`/shops/${shopCode}/time-slots?dayType=${dayType}`);
}

/** 요일구분별 예약가능 시간대 템플릿 저장(전체 교체, 파트너 로그인 전용·본인 소속 업체만) */
export function replaceTimeSlots(shopCode: string, dayType: string, slots: TimeSlot[]): Promise<void> {
  return authedRequest<void>(`/shops/${shopCode}/time-slots/${dayType}`, {
    method: "PUT",
    body: JSON.stringify({ slots }),
  });
}

/** 월간 예약 현황 요약(일자별 예약건수·휴무여부·잠금여부) — 로그인 불필요(공개) */
export function getMonthlySchedule(shopCode: string, year: number, month: number): Promise<MonthlyScheduleDay[]> {
  return apiRequest<MonthlyScheduleDay[]>(`/shops/${shopCode}/schedule/monthly?year=${year}&month=${month}`);
}

/** 일자별 예약 현황(시간대별 정원·잠금여부·예약 목록 병합) — 로그인 불필요(공개) */
export function getDailySchedule(shopCode: string, date: string): Promise<DailySchedule> {
  return apiRequest<DailySchedule>(`/shops/${shopCode}/schedule?date=${date}`);
}

/** 특정 일자·시간의 정원/잠금 오버라이드(파트너 로그인 전용·본인 소속 업체만) */
export function upsertDailySlot(
  shopCode: string,
  params: { date: string; time: string; capacity?: number; isLocked?: boolean },
): Promise<void> {
  return authedRequest<void>(`/shops/${shopCode}/daily-slots`, {
    method: "PATCH",
    body: JSON.stringify(params),
  });
}
