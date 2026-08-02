// PT-STL-02: 정산 내역 조회 - 기간·상태 필터로 정산 대상·완료·보류 내역을 조회하고 엑셀로 다운로드
import Button from "../../components/ui/Button";
import { STATUS_LABEL, statusChipClass, won } from "./stlData";
import type { Settlement, SettlementPeriod, SettlementStatus } from "./stlTypes";

type PeriodFilter = SettlementPeriod | "all" | "custom";
type StatusFilter = SettlementStatus | "all";

const PERIOD_META: { key: PeriodFilter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "this", label: "이번달" },
  { key: "last", label: "지난달" },
  { key: "custom", label: "직접입력" },
];

const STATUS_META: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "wait", label: "대기" },
  { key: "done", label: "완료" },
  { key: "hold", label: "보류" },
];

interface StlHistScreenProps {
  rows: Settlement[];
  period: PeriodFilter;
  onChangePeriod: (period: PeriodFilter) => void;
  customLabel: string;
  status: StatusFilter;
  onChangeStatus: (status: StatusFilter) => void;
  onBack: () => void;
  onDownload: () => void;
  onOpenCustomPeriod: () => void;
}

export default function StlHistScreen({
  rows,
  period,
  onChangePeriod,
  customLabel,
  status,
  onChangeStatus,
  onBack,
  onDownload,
  onOpenCustomPeriod,
}: StlHistScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex-none border-b border-gray-100 bg-white pt-[50px] px-3 pb-3">
        <div className="flex h-[50px] items-center gap-1.5">
          <span onClick={onBack} className="flex h-9 w-9 cursor-pointer items-center justify-center text-[22px] text-gray-800">
            ‹
          </span>
          <span className="text-[17px] font-bold text-gray-900">정산 내역 조회</span>
        </div>
        <div className="mp-scroll flex gap-[7px] overflow-x-auto px-1.5 pt-0.5 pb-1">
          {PERIOD_META.map((p) => (
            <span
              key={p.key}
              onClick={() => (p.key === "custom" ? onOpenCustomPeriod() : onChangePeriod(p.key))}
              className={`flex-none cursor-pointer rounded-full px-3.5 py-[7px] text-[12.5px] font-bold whitespace-nowrap ${
                period === p.key ? "bg-brand text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {p.key === "custom" && period === "custom" && customLabel ? customLabel : p.label}
            </span>
          ))}
        </div>
        <div className="flex gap-[7px] px-1.5 pt-1.5 pb-0.5">
          {STATUS_META.map((s) => (
            <span
              key={s.key}
              onClick={() => onChangeStatus(s.key)}
              className={`flex-none cursor-pointer rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap ${
                status === s.key ? "bg-[#0E9A96] text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {s.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mp-scroll flex-1 overflow-y-auto px-[18px] py-3.5">
        {rows.length === 0 ? (
          <div className="py-[60px] text-center text-[13px] text-gray-500">해당 조건의 정산 내역이 없어요</div>
        ) : (
          <div className="flex flex-col gap-[9px]">
            {rows.map((h) => (
              <div key={h.id} className="rounded-[14px] border border-gray-200 bg-white p-[14px_15px] shadow-sm">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="flex-1 font-mono text-xs text-gray-500">{h.date}</span>
                  <span className={`rounded-md px-2.5 py-[3px] text-[11px] font-bold text-white ${statusChipClass(h.status)}`}>
                    {STATUS_LABEL[h.status]}
                  </span>
                </div>
                <div className="mb-2 text-[13.5px] font-bold text-gray-900">
                  {h.customer} · {h.car}
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-[11.5px] text-gray-500">수수료 {won(h.fee)}</div>
                  <div className="text-base font-extrabold tabular-nums text-gray-900">{won(h.amount)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-[22px]">
        <Button size="lg" onClick={onDownload}>
          엑셀 다운로드
        </Button>
      </div>
    </div>
  );
}
