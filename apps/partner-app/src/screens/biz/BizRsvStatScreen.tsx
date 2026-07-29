// PT-PROF-05: 예약 현황 - 월간 캘린더(예약건수/잠금·휴무 배지) 조회 + 일자별 시간대별 예약 목록·정원·잠금 관리(즉시 적용, 저장 버튼 없음)
import { useEffect, useState } from "react";
import { getCommonCodeDetails, type CommonCodeDetailApi } from "../../api/commonCodes";
import {
  getDailySchedule,
  getMonthlySchedule,
  upsertDailySlot,
  type DailySchedule,
  type MonthlyScheduleDay,
} from "../../api/shopSchedule";
import Switch from "../../components/ui/Switch";
import type { MyShop } from "../../api/shops";
import { BackIcon } from "./bizIcons";

const WEEK_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function firstWeekday(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addDays(dateStr: string, delta: number): string {
  const dt = new Date(`${dateStr}T00:00:00`);
  dt.setDate(dt.getDate() + delta);
  return formatDate(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
}

interface BizRsvStatScreenProps {
  shop: MyShop;
  onBack: () => void;
  onError: (message: string) => void;
}

export default function BizRsvStatScreen({ shop, onBack, onError }: BizRsvStatScreenProps) {
  const today = new Date();
  const [mode, setMode] = useState<"monthly" | "weekly">("monthly");
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [monthlyDays, setMonthlyDays] = useState<MonthlyScheduleDay[]>([]);
  const [loadingMonthly, setLoadingMonthly] = useState(true);

  const [selectedDate, setSelectedDate] = useState(
    formatDate(today.getFullYear(), today.getMonth() + 1, today.getDate()),
  );
  const [daily, setDaily] = useState<DailySchedule | null>(null);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [reservationTypes, setReservationTypes] = useState<CommonCodeDetailApi[]>([]);

  useEffect(() => {
    getCommonCodeDetails("RESERVATION_TYPE")
      .then(setReservationTypes)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoadingMonthly(true);
    getMonthlySchedule(shop.shopCode, year, month)
      .then(setMonthlyDays)
      .catch((err) => onError(err instanceof Error ? err.message : "월간 예약 현황을 불러오지 못했어요"))
      .finally(() => setLoadingMonthly(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  useEffect(() => {
    if (mode !== "weekly") return;
    setLoadingDaily(true);
    getDailySchedule(shop.shopCode, selectedDate)
      .then(setDaily)
      .catch((err) => onError(err instanceof Error ? err.message : "일자별 예약 현황을 불러오지 못했어요"))
      .finally(() => setLoadingDaily(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedDate]);

  const reservationTypeLabel = (code: string) =>
    reservationTypes.find((t) => t.detailCode === code)?.detailName ?? code;

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const openDay = (date: string) => {
    setSelectedDate(date);
    setMode("weekly");
  };

  const changeCapacity = async (time: string, currentCapacity: number, reservedCount: number, delta: number) => {
    const next = currentCapacity + delta;
    if (next < reservedCount) return;
    const prevDaily = daily;
    setDaily((prev) =>
      prev ? { ...prev, slots: prev.slots.map((s) => (s.time === time ? { ...s, capacity: next } : s)) } : prev,
    );
    try {
      await upsertDailySlot(shop.shopCode, { date: selectedDate, time, capacity: next });
    } catch (err) {
      setDaily(prevDaily);
      onError(err instanceof Error ? err.message : "정원 변경에 실패했습니다");
    }
  };

  const toggleLock = async (time: string, locked: boolean) => {
    const prevDaily = daily;
    setDaily((prev) =>
      prev ? { ...prev, slots: prev.slots.map((s) => (s.time === time ? { ...s, isLocked: locked } : s)) } : prev,
    );
    try {
      await upsertDailySlot(shop.shopCode, { date: selectedDate, time, isLocked: locked });
    } catch (err) {
      setDaily(prevDaily);
      onError(err instanceof Error ? err.message : "잠금 설정에 실패했습니다");
    }
  };

  const dim = daysInMonth(year, month);
  const fw = firstWeekday(year, month);
  const cells: (number | null)[] = [...Array(fw).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)];
  const monthlyByDate = new Map(monthlyDays.map((d) => [d.date, d]));

  const selDate = new Date(`${selectedDate}T00:00:00`);
  const weekStrip = Array.from({ length: 7 }, (_, i) => addDays(selectedDate, i - 2));

  return (
    <div className="absolute inset-0 bg-gray-50">
      {/* top app bar (sub) */}
      <div className="absolute inset-x-0 top-[46px] z-50 flex h-[52px] items-center gap-1.5 border-b border-gray-100 bg-white px-1.5">
        <span onClick={onBack} className="inline-flex cursor-pointer p-2.5 text-gray-800">
          <BackIcon />
        </span>
        <span className="text-[17px] font-extrabold tracking-tight text-gray-900">예약 현황</span>
      </div>

      <div
        className="mp-scroll absolute inset-x-0 top-[98px] bottom-0 overflow-y-auto px-[18px] pt-4 pb-6"
        style={{ animation: "mp-screen .32s ease" }}
      >
        <div className="mb-5 flex gap-1 rounded-full bg-gray-100 p-1">
          <span
            onClick={() => setMode("monthly")}
            className={`flex-1 rounded-full py-[9px] text-center text-sm font-bold transition-colors ${
              mode === "monthly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            월간
          </span>
          <span
            onClick={() => setMode("weekly")}
            className={`flex-1 rounded-full py-[9px] text-center text-sm font-bold transition-colors ${
              mode === "weekly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            주간
          </span>
        </div>

        {mode === "monthly" && (
          <>
            <div className="mb-[18px] flex items-center justify-between">
              <span onClick={prevMonth} className="cursor-pointer px-2.5 py-1 text-[19px] text-gray-500">
                ‹
              </span>
              <span className="text-[17px] font-extrabold text-gray-900">
                {year}년 {month}월
              </span>
              <span onClick={nextMonth} className="cursor-pointer px-2.5 py-1 text-[19px] text-gray-500">
                ›
              </span>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-0.5">
              {WEEK_LABELS.map((label, i) => (
                <div
                  key={label}
                  className={`text-center text-[13px] font-bold ${
                    i === 0 ? "text-status-danger" : i === 6 ? "text-[#2563EB]" : "text-gray-500"
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>

            {loadingMonthly ? (
              <div className="py-10 text-center text-sm text-gray-400">불러오는 중...</div>
            ) : (
              <div className="mb-5 grid grid-cols-7 gap-x-[3px] gap-y-1">
                {cells.map((d, i) => {
                  if (d === null) return <div key={`empty-${i}`} className="h-14" />;
                  const dateStr = formatDate(year, month, d);
                  const dow = new Date(year, month - 1, d).getDay();
                  const info = monthlyByDate.get(dateStr);
                  const count = info?.reservedCount ?? 0;
                  const locked = info ? info.isLocked || info.isHoliday : false;
                  const selected = dateStr === selectedDate;
                  const dateColorClass = locked
                    ? "text-status-danger"
                    : dow === 0
                      ? "text-status-danger"
                      : dow === 6
                        ? "text-[#2563EB]"
                        : "text-gray-900";
                  return (
                    <div
                      key={dateStr}
                      onClick={() => openDay(dateStr)}
                      className={`flex h-14 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-[10px] ${
                        selected
                          ? "border-2 border-brand"
                          : locked
                            ? "border border-[#FCA5A5] bg-[#FEF2F2]"
                            : count > 0
                              ? "border border-gray-200"
                              : "border border-transparent"
                      }`}
                    >
                      <span className={`text-sm ${selected ? "font-extrabold" : "font-semibold"} ${dateColorClass}`}>
                        {d}
                      </span>
                      {count > 0 && <span className="text-[11px] font-bold text-[#2563EB]">{count}건</span>}
                      {locked && <span className="text-[11px] font-bold text-status-danger">잠금</span>}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-[18px]">
              <span className="flex items-center gap-1.5 text-[12.5px] text-gray-600">
                <span className="h-2 w-2 rounded-full bg-brand" />
                예약 있음
              </span>
              <span className="flex items-center gap-1.5 text-[12.5px] text-gray-600">
                <span className="h-2 w-2 rounded-full bg-status-danger" />
                잠금·휴무
              </span>
            </div>
          </>
        )}

        {mode === "weekly" && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <span
                onClick={() => setSelectedDate((d) => addDays(d, -1))}
                className="cursor-pointer px-2.5 py-1 text-[19px] text-gray-500"
              >
                ‹
              </span>
              <span className="text-base font-extrabold text-gray-900">
                {selDate.getFullYear()}년 {selDate.getMonth() + 1}월 {selDate.getDate()}일 (
                {WEEK_LABELS[selDate.getDay()]})
              </span>
              <span
                onClick={() => setSelectedDate((d) => addDays(d, 1))}
                className="cursor-pointer px-2.5 py-1 text-[19px] text-gray-500"
              >
                ›
              </span>
            </div>

            <div className="mb-[18px] grid grid-cols-7 gap-1">
              {weekStrip.map((dateStr) => {
                const dt = new Date(`${dateStr}T00:00:00`);
                const dow = dt.getDay();
                const isSel = dateStr === selectedDate;
                return (
                  <div
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className="flex cursor-pointer flex-col items-center gap-1.5"
                  >
                    <span
                      className={`text-xs font-semibold ${
                        isSel
                          ? "text-brand"
                          : dow === 0
                            ? "text-status-danger"
                            : dow === 6
                              ? "text-[#2563EB]"
                              : "text-gray-400"
                      }`}
                    >
                      {WEEK_LABELS[dow]}
                    </span>
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-[15px] ${
                        isSel
                          ? "bg-brand font-extrabold text-white"
                          : `font-semibold ${dow === 0 ? "text-status-danger" : "text-gray-900"}`
                      }`}
                    >
                      {dt.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>

            {loadingDaily || !daily ? (
              <div className="py-10 text-center text-sm text-gray-400">불러오는 중...</div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {daily.slots.map((slot) => {
                  const hasBookings = slot.reservedCount > 0;
                  const cardTone = slot.isLocked
                    ? "border border-[#FCA5A5] bg-[#FEF2F2]"
                    : hasBookings
                      ? "border border-gray-200 bg-white"
                      : "border border-gray-200 bg-gray-100";
                  return (
                    <div key={slot.time} className={`flex items-start gap-3 rounded-[14px] p-[15px] ${cardTone}`}>
                      <span
                        className={`w-[46px] flex-none pt-px text-[15px] font-extrabold tabular-nums ${
                          slot.isLocked ? "text-status-danger" : "text-gray-900"
                        }`}
                      >
                        {slot.time}
                      </span>
                      <div className="min-w-0 flex-1">
                        {hasBookings ? (
                          slot.reservations.map((r) => (
                            <div key={r.reservationNo} className="mb-1 flex items-center gap-1.5">
                              <span className="text-[14.5px] font-bold text-gray-900">{r.customerName}</span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                  r.reservationType === "PKG"
                                    ? "bg-brand-subtle text-brand"
                                    : "bg-[#0E9A9614] text-[#0E9A96]"
                                }`}
                              >
                                {reservationTypeLabel(r.reservationType)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span
                            className={`text-[13.5px] ${
                              slot.isLocked ? "font-bold text-status-danger" : "font-semibold text-gray-500"
                            }`}
                          >
                            {slot.isLocked ? "잠금 처리됨 · 예약 불가" : "예약 없음"}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-none flex-col items-end gap-1.5">
                        {!slot.isLocked && (
                          <>
                            {hasBookings && (
                              <span className="text-[11px] text-gray-500">
                                예약 {slot.reservedCount} · 정원 {slot.capacity ?? 0}
                              </span>
                            )}
                            <div className="flex items-center gap-1.5">
                              <span
                                onClick={() => changeCapacity(slot.time, slot.capacity ?? 0, slot.reservedCount, -1)}
                                className="flex h-[26px] w-[26px] cursor-pointer items-center justify-center rounded-[7px] bg-gray-100 text-sm text-gray-800"
                              >
                                −
                              </span>
                              <span className="w-5 text-center text-sm font-extrabold tabular-nums">
                                {slot.capacity ?? 0}
                              </span>
                              <span
                                onClick={() => changeCapacity(slot.time, slot.capacity ?? 0, slot.reservedCount, 1)}
                                className="flex h-[26px] w-[26px] cursor-pointer items-center justify-center rounded-[7px] bg-gray-100 text-sm text-gray-800"
                              >
                                ＋
                              </span>
                            </div>
                          </>
                        )}
                        {!hasBookings && (
                          <Switch checked={slot.isLocked} onChange={(checked) => toggleLock(slot.time, checked)} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
