// CU-NCPK-07: 시공 일정 예약 - 선택한 업체의 예약가능 날짜·시간대 선택
import Button from "../../components/ui/Button";
import NcpHeader from "./NcpHeader";
import { ChevronLeftArrowIcon, ChevronRightArrowIcon } from "./ncpIcons";

const today = new Date();
const REF_YEAR = today.getFullYear();
const REF_MONTH = today.getMonth() + 1;
const REF_DAY = today.getDate();
const WEEK_DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const pad2 = (n: number) => String(n).padStart(2, "0");

export interface DaySlotView {
  time: string; // "HH:mm"
  disabled: boolean;
}

interface CstSchedRsvScreenProps {
  onBack: () => void;
  onConfirm: () => void;
  shopName: string;
  calY: number;
  calM: number;
  sel: string; // "YYYY-MM-DD"
  time: string;
  holidays: string[]; // 현재 보이는 달의 휴무일("YYYY-MM-DD"[])
  daySlots: DaySlotView[]; // 선택한 날짜의 예약 가능 시간대(날짜 미선택 시 빈 배열)
  scheduleLoading: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (key: string) => void;
  onSelectTime: (label: string) => void;
}

export default function CstSchedRsvScreen({
  onBack,
  onConfirm,
  shopName,
  calY,
  calM,
  sel,
  time,
  holidays,
  daySlots,
  scheduleLoading,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
  onSelectTime,
}: CstSchedRsvScreenProps) {
  const calTitle = `${calY}. ${pad2(calM)}`;
  const atRef = calY === REF_YEAR && calM === REF_MONTH;
  const monthsAhead = (calY - REF_YEAR) * 12 + (calM - REF_MONTH);
  const prevDisabled = atRef;
  const nextDisabled = monthsAhead >= 5;

  const firstWd = new Date(calY, calM - 1, 1).getDay();
  const dim = new Date(calY, calM, 0).getDate();
  const cells: Array<{ day: number; key: string; disabled: boolean } | null> = [];
  for (let i = 0; i < firstWd; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) {
    const past = calY < REF_YEAR || (calY === REF_YEAR && calM < REF_MONTH) || (calY === REF_YEAR && calM === REF_MONTH && d < REF_DAY);
    const key = `${calY}-${pad2(calM)}-${pad2(d)}`;
    const disabled = past || holidays.includes(key);
    cells.push({ day: d, key, disabled });
  }

  const ready = !!sel && !!time;

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <NcpHeader title="시공 일정 예약" onBack={onBack} step={2} />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-[18px] pb-6">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              onClick={() => !prevDisabled && onPrevMonth()}
              className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 ${
                prevDisabled ? "cursor-default text-gray-300" : "cursor-pointer text-gray-700"
              }`}
            >
              <ChevronLeftArrowIcon />
            </span>
            <span className="min-w-[78px] text-center text-base font-extrabold text-gray-900 tabular-nums">
              {calTitle}
            </span>
            <span
              onClick={() => !nextDisabled && onNextMonth()}
              className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 ${
                nextDisabled ? "cursor-default text-gray-300" : "cursor-pointer text-gray-700"
              }`}
            >
              <ChevronRightArrowIcon />
            </span>
          </div>
          <span className="text-[11.5px] text-gray-500">{shopName} 예약 가능일</span>
        </div>

        <div className="mb-1.5 grid grid-cols-7 gap-0.5">
          {WEEK_DAYS.map((d, i) => (
            <span
              key={d}
              className={`text-center text-[11px] font-semibold ${
                i === 0 ? "text-status-danger" : i === 6 ? "text-brand" : "text-gray-500"
              }`}
            >
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-[3px]">
          {cells.map((c, i) =>
            c === null ? (
              <span key={i} className="aspect-square" />
            ) : (
              <span
                key={c.key}
                onClick={() => !c.disabled && onSelectDate(c.key)}
                className={`flex aspect-square items-center justify-center rounded-[9px] text-[13px] tabular-nums ${
                  c.disabled ? "cursor-default" : "cursor-pointer"
                } ${
                  sel === c.key
                    ? "bg-brand font-extrabold text-white"
                    : c.disabled
                      ? "font-medium text-gray-300"
                      : "bg-brand-subtle font-medium text-gray-800"
                }`}
              >
                {c.day}
              </span>
            )
          )}
        </div>

        <div className="mx-0.5 my-3.5 flex gap-3.5 text-[11px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[3px] border border-brand bg-brand-subtle" />
            예약 가능
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-gray-100" />
            휴무·마감
          </span>
        </div>

        <div className="mb-2.5 text-sm font-extrabold text-gray-900">시간대 선택</div>
        {!sel ? (
          <div className="rounded-[10px] bg-gray-100 px-3.5 py-3.5 text-center text-[13px] text-gray-500">
            날짜를 먼저 선택하세요
          </div>
        ) : scheduleLoading ? (
          <div className="rounded-[10px] bg-gray-100 px-3.5 py-3.5 text-center text-[13px] text-gray-500">
            예약 가능 시간을 불러오는 중이에요
          </div>
        ) : daySlots.length === 0 ? (
          <div className="rounded-[10px] bg-gray-100 px-3.5 py-3.5 text-center text-[13px] text-gray-500">
            예약 가능한 시간이 없어요
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {daySlots.map((s) => {
              const sel2 = time === s.time;
              return (
                <span
                  key={s.time}
                  onClick={() => !s.disabled && onSelectTime(s.time)}
                  className={`rounded-[10px] py-3 text-center text-[13px] font-semibold tabular-nums ${
                    s.disabled ? "cursor-default" : "cursor-pointer"
                  } ${
                    sel2
                      ? "bg-brand font-extrabold text-white"
                      : s.disabled
                        ? "bg-gray-100 text-gray-300 line-through"
                        : "border border-gray-400 bg-white text-gray-800"
                  }`}
                >
                  {s.time}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-6">
        <Button size="xl" disabled={!ready} onClick={onConfirm}>
          {ready ? "예약 확정하기" : "날짜·시간을 선택하세요"}
        </Button>
      </div>
    </div>
  );
}
