// apps/api의 시공업체 휴무일/일별 예약현황 조회(GET /shops/:shopCode/holidays, GET /shops/:shopCode/schedule) — 로그인 불필요
import { apiRequest } from "./http";

export function listShopHolidays(shopCode: string, year: number, month: number): Promise<string[]> {
  return apiRequest<string[]>(`/shops/${shopCode}/holidays?year=${year}&month=${month}`);
}

export interface DailySlotApi {
  time: string; // "HH:mm"
  capacity: number | null; // null이면 해당 시간대에 템플릿 자체가 없어 예약 불가
  isLocked: boolean;
  reservedCount: number;
  reservations: { reservationNo: string; seq: number; reservationType: string; customerName: string }[];
}

export interface DailyScheduleApi {
  date: string; // "YYYY-MM-DD"
  isHoliday: boolean;
  slots: DailySlotApi[];
}

export function getDailySchedule(shopCode: string, date: string): Promise<DailyScheduleApi> {
  return apiRequest<DailyScheduleApi>(`/shops/${shopCode}/schedule?date=${date}`);
}
