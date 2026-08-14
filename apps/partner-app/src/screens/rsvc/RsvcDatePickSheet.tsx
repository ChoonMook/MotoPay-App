// PT-RSVC-14: 시공 예정일 변경 팝업 - 고객 희망일에 예약 가능한 시간이 없을 때 파트너가 달력에서 다른 날짜를 선택(기간 제한 없음, 2026-08-14 사용자 확정)
// 휴무일은 애초에 시공이 불가능하므로 달력에서 선택하지 못하게 비활성화(회색 표시) — 2026-08-14 버그 리포트로 추가
import { useEffect, useState } from "react";
import BottomSheet from "../../components/ui/BottomSheet";
import { listHolidays } from "../../api/shopSchedule";
import { ChevronLeftArrowIcon, ChevronRightArrowIcon, CloseIcon } from "./rsvcIcons";

const WEEK_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

interface RsvcDatePickSheetProps {
  shopCode: string;
  year: number;
  month: number; // 1-indexed
  selectedDate: string; // "YYYY-MM-DD"
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onClose: () => void;
}

export default function RsvcDatePickSheet({
  shopCode,
  year,
  month,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onClose,
}: RsvcDatePickSheetProps) {
  const [holidays, setHolidays] = useState<string[]>([]);

  useEffect(() => {
    listHolidays(shopCode, year, month)
      .then(setHolidays)
      .catch(() => setHolidays([]));
  }, [shopCode, year, month]);

  const today = new Date();
  const isCurMonth = year === today.getFullYear() && month === today.getMonth() + 1;
  const todayDate = today.getDate();
  const monthsAhead = (year - today.getFullYear()) * 12 + (month - (today.getMonth() + 1));
  const prevDisabled = monthsAhead <= 0;

  const pad = (n: number) => String(n).padStart(2, "0");
  const holidaySet = new Set(holidays);

  const firstDow = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: Array<{ day: number; disabled: boolean } | null> = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${pad(month)}-${pad(d)}`;
    cells.push({ day: d, disabled: (isCurMonth && d < todayDate) || holidaySet.has(dateStr) });
  }

  const cellDate = (day: number) => `${year}-${pad(month)}-${pad(day)}`;

  return (
    <BottomSheet onClose={onClose} maxHeight="90%">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-lg font-extrabold text-gray-900">시공 예정일 변경</span>
        <span onClick={onClose} className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center text-gray-500">
          <CloseIcon />
        </span>
      </div>
      <div className="mb-3.5 text-[12.5px] text-gray-600">
        고객 희망일에 예약 가능한 시간이 없어요. 다른 날짜를 선택하면 그 날짜의 예약 가능 시간으로 다시 보여드려요.
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
          <span className="min-w-[72px] text-center text-[13.5px] font-extrabold tabular-nums text-gray-900">
            {year}년 {month}월
          </span>
          <span onClick={onNextMonth} className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg bg-gray-100 text-gray-700">
            <ChevronRightArrowIcon />
          </span>
        </div>
        <div className="mb-1.5 grid grid-cols-7 gap-1">
          {WEEK_NAMES.map((w, i) => (
            <span key={w} className={`text-center text-[11px] font-bold ${i === 0 ? "text-status-danger" : i === 6 ? "text-[#0EA5E9]" : "text-gray-500"}`}>
              {w}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-x-0 gap-y-1">
          {cells.map((c, i) => {
            if (!c) return <span key={i} />;
            const dow = new Date(year, month - 1, c.day).getDay();
            const sel = selectedDate === cellDate(c.day);
            const color = sel
              ? ""
              : c.disabled
                ? "text-gray-300"
                : dow === 0
                  ? "text-status-danger"
                  : dow === 6
                    ? "text-[#0EA5E9]"
                    : "text-gray-800";
            return (
              <span
                key={i}
                onClick={() => (c.disabled ? undefined : onSelectDate(cellDate(c.day)))}
                className={`rounded-[9px] py-[9px] text-center text-[13px] tabular-nums ${c.disabled ? "cursor-default" : "cursor-pointer"} ${
                  sel ? "bg-brand font-extrabold text-white" : `font-semibold ${color}`
                }`}
              >
                {c.day}
              </span>
            );
          })}
        </div>
      </div>
      <div className="mt-2 px-0.5 text-[11.5px] text-gray-500">회색으로 표시된 날짜는 지난 날짜이거나 우리 업체 휴무일이에요</div>
    </BottomSheet>
  );
}
