// "YYYY-MM" 값을 datepicker 형태(연도 네비게이션 + 월 그리드 팝업)로 선택하는 월 선택기
import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const MONTH_LABELS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

interface MonthPickerProps {
  value: string; // "YYYY-MM"
  onChange: (value: string) => void;
  className?: string;
}

export default function MonthPicker({ value, onChange, className = "" }: MonthPickerProps) {
  const [open, setOpen] = useState(false);
  const [year, monthNum] = value.split("-").map(Number);
  const [viewYear, setViewYear] = useState(year);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setViewYear(year);
  }, [open, year]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-[#ced4da] bg-white px-2.5 py-1.5 text-xs font-normal outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
      >
        <span>
          {year}년 {monthNum}월
        </span>
        <Calendar className="h-3.5 w-3.5 text-outline" />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1.5 w-56 rounded-xl border border-outline-variant/40 bg-white p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              className="rounded-md p-1 text-outline transition-colors hover:bg-surface-container-low hover:text-on-surface"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-secondary">{viewYear}년</span>
            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              className="rounded-md p-1 text-outline transition-colors hover:bg-surface-container-low hover:text-on-surface"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {MONTH_LABELS.map((label, i) => {
              const m = i + 1;
              const selected = viewYear === year && m === monthNum;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    onChange(`${viewYear}-${String(m).padStart(2, "0")}`);
                    setOpen(false);
                  }}
                  className={`rounded-lg px-2 py-1.5 text-[11.5px] font-semibold transition-colors ${
                    selected ? "bg-primary text-white" : "text-on-surface hover:bg-surface-container-low"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
