// PT-PROF-03: 매장 휴무일 설정 - 캘린더에서 여러 날짜를 선택해 휴무일로 일괄 지정/해제
import { useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import { addHolidays, listHolidays, removeHoliday } from "../../api/shopSchedule";
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

function weekdayLabelClass(index: number): string {
  if (index === 0) return "text-status-danger";
  if (index === 6) return "text-[#2563EB]";
  return "text-gray-500";
}

interface BizHolidayScreenProps {
  shop: MyShop;
  onBack: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
}

export default function BizHolidayScreen({ shop, onBack, onSaved, onError }: BizHolidayScreenProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [holidays, setHolidays] = useState<string[]>([]);
  const [originalHolidays, setOriginalHolidays] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    listHolidays(shop.shopCode, year, month)
      .then((result) => {
        setHolidays(result);
        setOriginalHolidays(result);
      })
      .catch((err) => onError(err instanceof Error ? err.message : "휴무일을 불러오지 못했어요"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const toggleDay = (dateStr: string) => {
    setHolidays((prev) =>
      prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr].sort(),
    );
  };

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

  const handleSave = async () => {
    const toAdd = holidays.filter((d) => !originalHolidays.includes(d));
    const toRemove = originalHolidays.filter((d) => !holidays.includes(d));
    if (toAdd.length === 0 && toRemove.length === 0) {
      onSaved();
      return;
    }
    setSaving(true);
    try {
      if (toAdd.length > 0) await addHolidays(shop.shopCode, toAdd);
      for (const date of toRemove) {
        await removeHoliday(shop.shopCode, date);
      }
      setOriginalHolidays(holidays);
      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : "휴무일 저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  const dim = daysInMonth(year, month);
  const fw = firstWeekday(year, month);
  const cells: (number | null)[] = [...Array(fw).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)];
  const sortedHolidays = holidays.slice().sort();

  return (
    <div className="absolute inset-0 bg-gray-50">
      {/* top app bar (sub) */}
      <div className="absolute inset-x-0 top-[46px] z-50 flex h-[52px] items-center gap-1.5 border-b border-gray-100 bg-white px-1.5">
        <span onClick={onBack} className="inline-flex cursor-pointer p-2.5 text-gray-800">
          <BackIcon />
        </span>
        <span className="text-[17px] font-extrabold tracking-tight text-gray-900">매장 휴무일 설정</span>
      </div>

      <div
        className="mp-scroll absolute inset-x-0 top-[98px] bottom-0 overflow-y-auto px-[18px] pt-4 pb-[120px]"
        style={{ animation: "mp-screen .32s ease" }}
      >
        <div className="mx-0.5 mb-3.5 text-[13px] leading-[1.6] text-gray-600">
          캘린더에서 날짜를 선택해 휴무일로 일괄 지정하세요. 토요일은 파란색, 일요일·공휴일은 빨간색으로 표시돼요.
        </div>

        <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span onClick={prevMonth} className="cursor-pointer px-2 py-1 text-gray-500">
              ‹
            </span>
            <span className="text-[15px] font-extrabold text-gray-900">
              {year}.{String(month).padStart(2, "0")}
            </span>
            <span onClick={nextMonth} className="cursor-pointer px-2 py-1 text-gray-500">
              ›
            </span>
          </div>

          <div className="mb-1.5 grid grid-cols-7 gap-1">
            {WEEK_LABELS.map((label, i) => (
              <div key={label} className={`text-center text-[11.5px] font-bold ${weekdayLabelClass(i)}`}>
                {label}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm text-gray-400">불러오는 중...</div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {cells.map((d, i) => {
                if (d === null) return <div key={`empty-${i}`} className="h-[34px]" />;
                const dateStr = formatDate(year, month, d);
                const dow = new Date(year, month - 1, d).getDay();
                const selected = holidays.includes(dateStr);
                const dayColorClass = dow === 0 ? "text-status-danger" : dow === 6 ? "text-[#2563EB]" : "text-gray-800";
                return (
                  <div
                    key={dateStr}
                    onClick={() => toggleDay(dateStr)}
                    className={`flex h-[34px] cursor-pointer items-center justify-center rounded-lg text-[12.5px] ${
                      selected ? "bg-brand font-extrabold text-white" : `font-semibold ${dayColorClass}`
                    }`}
                  >
                    {d}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mb-2 text-[13px] font-extrabold tracking-[0.02em] text-gray-500">
          선택된 휴무일 · {holidays.length}일
        </div>
        <div className="flex flex-wrap gap-2">
          {sortedHolidays.map((h) => (
            <span
              key={h}
              className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1.5 text-[12.5px] font-semibold text-gray-800"
            >
              {h.slice(5).replace("-", ".")}.
              <span onClick={() => toggleDay(h)} className="cursor-pointer text-gray-500">
                ✕
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-[55] border-t border-gray-100 bg-white px-5 pt-3.5 pb-[22px]">
        <Button disabled={saving} onClick={handleSave}>
          {saving ? "저장 중..." : "저장"}
        </Button>
      </div>
    </div>
  );
}
