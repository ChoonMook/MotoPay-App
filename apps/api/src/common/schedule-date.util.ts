// 시공업체 스케줄(휴무일/시간대/예약)에서 공통으로 쓰는 날짜·시간 변환 유틸 — Prisma @db.Date/@db.Time <-> "YYYY-MM-DD"/"HH:mm" 문자열
export function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function formatDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function parseTimeOnly(value: string): Date {
  return new Date(`1970-01-01T${value}:00.000Z`);
}

export function formatTimeOnly(value: Date): string {
  return value.toISOString().slice(11, 16);
}

export type ShopDayType = 'WEEKDAY' | 'SAT' | 'SUN';

// 주의: 공휴일(HOLIDAY) 자동 판별은 별도 공휴일 데이터 소스가 없어 아직 지원하지 않음 — 요일만으로 평일/토/일을 구분
export function resolveDayType(date: Date): ShopDayType {
  const day = date.getUTCDay();
  if (day === 6) return 'SAT';
  if (day === 0) return 'SUN';
  return 'WEEKDAY';
}
