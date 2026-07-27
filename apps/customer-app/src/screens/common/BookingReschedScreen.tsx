// CU-RSVC-21: 일정 변경 - 현재 예약 안내 + 미니 캘린더(월 이동 가능) + 시간대 선택 + 변경 확정
// 신차패키지·예약시공 공용 화면. 변경은 즉시 확정이 아니라 업체 확인 대기로 전환됨을 안내
import CommonHeader from "./CommonHeader";
import Button from "../../components/ui/Button";
import { AlertCircleIcon, ChevronLeftArrowIcon, ChevronRightArrowIcon } from "./commonIcons";

const WEEK_DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const pad2 = (n: number) => String(n).padStart(2, "0");

export interface ReschedDaySlot {
  time: string;
  disabled: boolean;
}

interface BookingReschedScreenProps {
  onBack: () => void;
  onConfirm: () => void;
  submitting: boolean;
  shopName: string;
  currentVisitLabel: string;
  year: number;
  month: number; // 1-indexed
  day: number | null;
  time: string;
  holidays: string[]; // "YYYY-MM-DD"
  daySlots: ReschedDaySlot[];
  scheduleLoading: boolean;
  onSelectDay: (day: number) => void;
  onSelectTime: (time: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export default function BookingReschedScreen({
  onBack,
  onConfirm,
  submitting,
  shopName,
  currentVisitLabel,
  year,
  month,
  day,
  time,
  holidays,
  daySlots,
  scheduleLoading,
  onSelectDay,
  onSelectTime,
  onPrevMonth,
  onNextMonth,
}: BookingReschedScreenProps) {
  const today = new Date();
  const isCurMonth = year === today.getFullYear() && month === today.getMonth() + 1;
  const todayDate = today.getDate();
  const prevDisabled = isCurMonth;
  const monthsAhead = (year - today.getFullYear()) * 12 + (month - (today.getMonth() + 1));
  const nextDisabled = monthsAhead >= 5;

  const firstWd = new Date(year, month - 1, 1).getDay();
  const dim = new Date(year, month, 0).getDate();
  const cells: Array<{ day: number; key: string; disabled: boolean } | null> = [];
  for (let i = 0; i < firstWd; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) {
    const key = `${year}-${pad2(month)}-${pad2(d)}`;
    const past = isCurMonth ? d <= todayDate : year < today.getFullYear() || (year === today.getFullYear() && month < today.getMonth() + 1);
    const disabled = past || holidays.includes(key);
    cells.push({ day: d, key, disabled });
  }

  const ready = !!day && !!time;

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <CommonHeader title="일정 변경" onBack={onBack} />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-[18px] pb-6">
        <div className="mb-4 rounded-[10px] bg-gray-100 px-[13px] py-[11px] text-[13px] leading-relaxed text-gray-600">
          현재 예약 <b>{currentVisitLabel}</b> · {shopName}. 변경할 날짜와 시간을 선택하세요.
        </div>

        <div className="rounded-[14px] border border-gray-200 bg-white p-3.5">
          <div className="mb-3 flex items-center justify-center gap-3">
            <span
              onClick={() => !prevDisabled && onPrevMonth()}
              className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 ${
                prevDisabled ? "cursor-default text-gray-300" : "cursor-pointer text-gray-700"
              }`}
            >
              <ChevronLeftArrowIcon />
            </span>
            <span className="min-w-[72px] text-center text-[13.5px] font-extrabold text-gray-900 tabular-nums">
              {year}년 {month}월
            </span>
            <span
              onClick={() => !nextDisabled && onNextMonth()}
              className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 ${
                nextDisabled ? "cursor-default text-gray-300" : "cursor-pointer text-gray-700"
              }`}
            >
              <ChevronRightArrowIcon />
            </span>
          </div>
          <div className="mb-1.5 grid grid-cols-7 gap-1">
            {WEEK_DAYS.map((d, i) => (
              <span key={d} className={`text-center text-[11px] font-bold ${i === 0 ? "text-status-danger" : i === 6 ? "text-[#0EA5E9]" : "text-gray-500"}`}>
                {d}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((c, i) =>
              c === null ? (
                <span key={i} />
              ) : (
                <span
                  key={c.key}
                  onClick={() => !c.disabled && onSelectDay(c.day)}
                  className={`rounded-[9px] py-[9px] text-center text-[13px] tabular-nums ${c.disabled ? "cursor-default" : "cursor-pointer"} ${
                    day === c.day
                      ? "bg-brand font-extrabold text-white"
                      : c.disabled
                        ? "font-semibold text-gray-300"
                        : "bg-brand-subtle font-semibold text-gray-800"
                  }`}
                >
                  {c.day}
                </span>
              )
            )}
          </div>
        </div>

        <div className="mt-5 mb-2.5 text-sm font-extrabold text-gray-900">시간대 선택</div>
        {!day ? (
          <div className="rounded-[10px] bg-gray-100 px-3.5 py-3.5 text-center text-[13px] text-gray-500">날짜를 먼저 선택하세요</div>
        ) : scheduleLoading ? (
          <div className="rounded-[10px] bg-gray-100 px-3.5 py-3.5 text-center text-[13px] text-gray-500">예약 가능 시간을 불러오는 중이에요</div>
        ) : daySlots.length === 0 ? (
          <div className="rounded-[10px] bg-gray-100 px-3.5 py-3.5 text-center text-[13px] text-gray-500">예약 가능한 시간이 없어요</div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {daySlots.map((s) => (
              <span
                key={s.time}
                onClick={() => !s.disabled && onSelectTime(s.time)}
                className={`rounded-[10px] py-3 text-center text-[13px] font-semibold tabular-nums ${s.disabled ? "cursor-default" : "cursor-pointer"} ${
                  time === s.time
                    ? "bg-brand font-extrabold text-white"
                    : s.disabled
                      ? "bg-gray-100 text-gray-300 line-through"
                      : "border border-gray-400 bg-white text-gray-800"
                }`}
              >
                {s.time}
              </span>
            ))}
          </div>
        )}

        <div className="mt-[18px] flex items-start gap-2 rounded-xl bg-gray-100 px-[15px] py-[13px]">
          <span className="mt-px flex-none text-gray-500">
            <AlertCircleIcon />
          </span>
          <div className="text-xs leading-relaxed text-gray-600">
            변경 요청은 <b>업체 확인 후 확정</b>돼요. 업체 사정에 따라 반려될 수 있어요.
          </div>
        </div>
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-6">
        <Button size="xl" disabled={!ready || submitting} onClick={onConfirm}>
          {submitting ? "변경 처리 중..." : ready ? "변경 확정하기" : "날짜·시간을 선택하세요"}
        </Button>
      </div>
    </div>
  );
}
