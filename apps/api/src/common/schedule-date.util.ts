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

/** 오늘(한국시간 기준 달력 날짜를 UTC 자정으로 인코딩) — @db.Date 컬럼은 사용자가 고른 한국(KST) 달력 날짜를
 * UTC 자정으로 저장하므로(parseDateOnly 참고), "오늘"도 서버 프로세스의 시스템 타임존과 무관하게 반드시
 * Asia/Seoul 기준으로 계산해야 함. (버그였던 이전 구현: 서버가 UTC 달력 날짜를 그대로 썼는데, 한국시간
 * 00:00~08:59 사이에는 UTC 날짜가 아직 전날이라 "오늘"이 하루 전으로 잘못 계산됐음 — 2026-08-14 발견) */
export function todayUtcMidnight(): Date {
  const kstDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
  }).format(new Date()); // "YYYY-MM-DD"
  return parseDateOnly(kstDateStr);
}

export type ShopDayType = 'WEEKDAY' | 'SAT' | 'SUN';

// 주의: 공휴일(HOLIDAY) 자동 판별은 별도 공휴일 데이터 소스가 없어 아직 지원하지 않음 — 요일만으로 평일/토/일을 구분
export function resolveDayType(date: Date): ShopDayType {
  const day = date.getUTCDay();
  if (day === 6) return 'SAT';
  if (day === 0) return 'SUN';
  return 'WEEKDAY';
}
