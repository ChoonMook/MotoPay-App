// CU-PNT-06: 포인트 내역 조회 - 잔액 요약 + 유형 필터 + 내역 리스트
import CommonHeader from "../common/CommonHeader";
import { KIND_META } from "./pointData";
import { nfmt, fmtDate } from "./pointFormat";
import type { PtHistFilter, PtHistItem } from "./pntTypes";

const FILTER_DEFS: { key: PtHistFilter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "charge", label: "충전" },
  { key: "use", label: "사용" },
  { key: "admin", label: "기타" },
];

interface PtHistScreenProps {
  onBack: () => void;
  filter: PtHistFilter;
  onSelectFilter: (f: PtHistFilter) => void;
  loading: boolean;
  balance: number;
  allHistory: PtHistItem[];
}

export default function PtHistScreen({ onBack, filter, onSelectFilter, loading, balance, allHistory }: PtHistScreenProps) {
  const rows = allHistory.filter((r) => filter === "all" || r.kind === filter);

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <CommonHeader title="포인트 내역" onBack={onBack} />

      <div className="flex-none border-b border-gray-100 bg-white px-5 pt-2 pb-3">
        <div className="flex items-center justify-between rounded-xl bg-brand-subtle px-[15px] py-[13px]">
          <span className="text-[12.5px] text-gray-600">현재 잔액</span>
          <span className="text-[17px] font-extrabold text-brand tabular-nums">{loading ? "-" : `${nfmt(balance)} P`}</span>
        </div>
        <div className="mt-3 flex gap-1.5">
          {FILTER_DEFS.map((c) => {
            const on = filter === c.key;
            return (
              <span
                key={c.key}
                onClick={() => onSelectFilter(c.key)}
                className={`flex-none cursor-pointer rounded-full px-[15px] py-[7px] text-[12.5px] ${
                  on ? "bg-brand font-extrabold text-white" : "bg-gray-50 font-semibold text-gray-600"
                }`}
              >
                {c.label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-1.5 pb-6">
        {loading ? (
          <div className="py-16 text-center text-xs text-gray-400">불러오는 중...</div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400">해당 내역이 없어요</div>
        ) : (
          rows.map((r, i) => (
            <div key={r.title + r.date + i} className={`flex items-center gap-3 py-[15px] ${i < rows.length - 1 ? "border-b border-gray-100" : ""}`}>
              <span
                className="flex-none rounded-[7px] px-[9px] py-[5px] text-[10.5px] font-extrabold"
                style={{ color: KIND_META[r.kind].color, background: `${KIND_META[r.kind].color}18` }}
              >
                {KIND_META[r.kind].label}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-bold text-gray-900">{r.title}</div>
                <div className="mt-0.5 text-[11px] text-gray-500">{fmtDate(r.date)}</div>
              </div>
              <div className="text-right">
                <div className={`text-[14.5px] font-extrabold tabular-nums ${r.amt > 0 ? "text-green-600" : "text-gray-900"}`}>
                  {r.amt > 0 ? "+" : ""}
                  {nfmt(r.amt)}P
                </div>
                <div className="mt-px text-[10.5px] text-gray-500 tabular-nums">잔액 {nfmt(r.bal)}P</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
