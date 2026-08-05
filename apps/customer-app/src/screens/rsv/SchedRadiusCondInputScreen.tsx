// CU-RSVC-08: 일정·반경 조건 입력 - 일반/전문가 추천 공통. 희망 시공 일자(월 이동 가능한 캘린더) + 반경 + 평점 조건(선택)
import Button from "../../components/ui/Button";
import RsvHeader from "./RsvHeader";
import { WarnIcon } from "./rsvIcons";
import { ChevronLeftArrowIcon, ChevronRightArrowIcon } from "../common/commonIcons";

const WEEK_NAMES = ["일", "월", "화", "수", "목", "금", "토"];
const RADIUS_DEFS: Array<[string, string]> = [
  ["5", "5km"],
  ["10", "10km"],
  ["20", "20km"],
];
const RATING_DEFS = ["전체", "4.0★ ↑", "4.5★ ↑", "4.8★ ↑"];
// 요청 생성 API 연동용 — "전체"는 제한 없음(undefined), 나머지는 최소 평점 숫자값
export const RATING_LABEL_TO_VALUE: Record<string, number | undefined> = {
  "전체": undefined,
  "4.0★ ↑": 4.0,
  "4.5★ ↑": 4.5,
  "4.8★ ↑": 4.8,
};

interface SchedRadiusCondInputScreenProps {
  isExpert: boolean;
  year: number;
  month: number; // 1-indexed
  condDate: number | null;
  condRadius: string;
  condRating: string;
  onSelectDate: (day: number) => void;
  onSelectRadius: (radius: string) => void;
  onSelectRating: (rating: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onBack: () => void;
  onNext: () => void;
  submitting: boolean;
}

export default function SchedRadiusCondInputScreen({
  isExpert,
  year,
  month,
  condDate,
  condRadius,
  condRating,
  onSelectDate,
  onSelectRadius,
  onSelectRating,
  onPrevMonth,
  onNextMonth,
  onBack,
  onNext,
  submitting,
}: SchedRadiusCondInputScreenProps) {
  const today = new Date();
  const isCurMonth = year === today.getFullYear() && month === today.getMonth() + 1;
  const todayDate = today.getDate();
  const prevDisabled = isCurMonth;
  const monthsAhead = (year - today.getFullYear()) * 12 + (month - (today.getMonth() + 1));
  const nextDisabled = monthsAhead >= 5;

  const firstDow = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: Array<{ day: number; disabled: boolean } | null> = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, disabled: isCurMonth && d < todayDate });

  const condDateLabel = condDate
    ? `${month}월 ${condDate}일(${WEEK_NAMES[new Date(year, month - 1, condDate).getDay()]})`
    : "";
  const condOk = !!condDate && !!condRadius;

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <RsvHeader
        title="일정·반경 조건 입력"
        onBack={onBack}
        steps={isExpert ? ["항목 선택", "조건 입력", "입찰 비교"] : ["항목 선택", "제품·부위", "조건 입력", "입찰 비교"]}
        current={isExpert ? 1 : 2}
      />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-[18px] pb-6">
        <div className="mx-0.5 mb-2.5 text-sm font-extrabold text-gray-900">희망 시공 일자</div>
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
            {WEEK_NAMES.map((w, i) => (
              <span
                key={w}
                className={`text-center text-[11px] font-bold ${i === 0 ? "text-status-danger" : i === 6 ? "text-[#0EA5E9]" : "text-gray-500"}`}
              >
                {w}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-x-0 gap-y-1">
            {cells.map((c, i) => {
              if (!c) return <span key={i} />;
              const dow = new Date(year, month - 1, c.day).getDay();
              const sel = condDate === c.day;
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
                  onClick={() => (c.disabled ? undefined : onSelectDate(c.day))}
                  className={`rounded-[9px] py-[9px] text-center text-[13px] tabular-nums ${
                    c.disabled ? "cursor-default" : "cursor-pointer"
                  } ${sel ? "bg-brand font-extrabold text-white" : `font-semibold ${color}`}`}
                >
                  {c.day}
                </span>
              );
            })}
          </div>
        </div>
        {condDateLabel && <div className="mt-2 mb-0 px-0.5 text-[12.5px] font-bold text-brand">선택한 날짜 · {condDateLabel}</div>}

        <div className="mx-0.5 mt-[22px] mb-2.5 text-sm font-extrabold text-gray-900">업체 검색 반경</div>
        <div className="grid grid-cols-3 gap-2">
          {RADIUS_DEFS.map(([k, label]) => {
            const on = condRadius === k;
            return (
              <span
                key={k}
                onClick={() => onSelectRadius(k)}
                className={`cursor-pointer rounded-[11px] py-3.5 text-center text-[13px] tabular-nums ${
                  on ? "bg-brand font-extrabold text-white" : "border border-gray-400 bg-white font-bold text-gray-800"
                }`}
              >
                {label}
              </span>
            );
          })}
        </div>

        <div className="mx-0.5 mt-6 mb-2.5 text-sm font-extrabold text-gray-900">
          업체 평점 조건 <span className="text-[11px] font-semibold text-gray-500">· 선택</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {RATING_DEFS.map((label) => {
            const on = condRating === label;
            return (
              <span
                key={label}
                onClick={() => onSelectRating(label)}
                className={`cursor-pointer rounded-[10px] py-[11px] text-center text-[12.5px] ${
                  on ? "bg-brand-subtle font-extrabold text-brand ring-[1.5px] ring-brand ring-inset" : "bg-gray-100 font-semibold text-gray-600"
                }`}
              >
                {label}
              </span>
            );
          })}
        </div>

        <div className="mt-[18px] flex items-start gap-[9px] rounded-xl bg-gray-100 px-[15px] py-[13px]">
          <span className="mt-px flex-none text-gray-500">
            <WarnIcon />
          </span>
          <div className="text-xs leading-relaxed text-gray-600">
            <b>가격대 필터는 견적 도착 후</b> 입찰 업체 비교 단계에서 제공돼요. 지금은 조건이 될 견적가가 아직 없어요.
          </div>
        </div>
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-6">
        <Button size="xl" disabled={!condOk || submitting} onClick={onNext}>
          {submitting ? "등록 중..." : condOk ? "요청 등록하기" : "일자·반경을 선택하세요"}
        </Button>
      </div>
    </div>
  );
}
