// apps/api의 업체 스케줄(휴무일) 엔드포인트(/shops/:shopCode/holidays) 호출
import { apiRequest, authedRequest } from "./http";

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
