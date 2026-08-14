// PT-RSVC-04: 입찰함 - 신규·진행중·마감 탭별 요청 카드 목록, 마감 임박 건은 카운트다운 뱃지로 강조
import { formatDesiredDateLabel, reqTypeChipClass, reqTypeLabel, reqUrgent, itemSummary } from "./rsvcData";
import type { BidReq, ReqStatus } from "./rsvcTypes";

export type BidTab = "new" | "active" | "closed";

const TAB_META: { key: BidTab; label: string; match: ReqStatus }[] = [
  { key: "new", label: "신규", match: "open" },
  { key: "active", label: "진행중", match: "active" },
  { key: "closed", label: "마감", match: "closed" },
];

interface RsvcBidboxScreenProps {
  reqs: BidReq[];
  loading: boolean;
  tab: BidTab;
  onChangeTab: (tab: BidTab) => void;
  onBack: () => void;
  onOpenReq: (req: BidReq) => void;
}

export default function RsvcBidboxScreen({ reqs, loading, tab, onChangeTab, onBack, onOpenReq }: RsvcBidboxScreenProps) {
  const list = reqs.filter((r) => r.status === TAB_META.find((t) => t.key === tab)!.match);

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex-none border-b border-gray-100 bg-white pt-[50px] px-3">
        <div className="mb-0.5 flex h-[50px] items-center gap-1.5">
          <span onClick={onBack} className="flex h-9 w-9 cursor-pointer items-center justify-center text-[22px] text-gray-800">
            ‹
          </span>
          <span className="text-[17px] font-bold text-gray-900">입찰함</span>
        </div>
        <div className="flex gap-1 pb-2">
          {TAB_META.map((t) => {
            const count = reqs.filter((r) => r.status === t.match).length;
            const active = tab === t.key;
            return (
              <div
                key={t.key}
                onClick={() => onChangeTab(t.key)}
                className={`flex-1 cursor-pointer rounded-[10px] py-[9px] text-center text-[13px] font-bold ${
                  active ? "bg-brand text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {t.label} <span className="ml-[3px] tabular-nums">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mp-scroll flex-1 overflow-y-auto px-[18px] py-4">
        {loading ? (
          <div className="py-10 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : list.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white py-10 text-center text-sm text-gray-400 shadow-sm">
            해당하는 요청이 없어요
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {list.map((r) => {
              const urgent = reqUrgent(r.deadlineLabel);
              return (
                <div
                  key={r.id}
                  onClick={() => onOpenReq(r)}
                  className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="mb-[9px] flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-[3px] text-[11px] font-bold ${reqTypeChipClass(r.type)}`}>
                      {reqTypeLabel(r.type)}
                    </span>
                    <span className="flex-1 text-[15px] font-extrabold tracking-tight text-gray-900">{r.customer}</span>
                    {urgent && (
                      <span className="rounded-full bg-status-danger px-2 py-[3px] text-[10.5px] font-bold text-white">
                        {r.deadlineLabel}
                      </span>
                    )}
                  </div>
                  <div className="mb-[3px] text-[13.5px] text-gray-800">{r.car}</div>
                  <div className="mb-[3px] text-[12.5px] text-gray-500">희망시공일 {formatDesiredDateLabel(r.desiredDate)}</div>
                  <div className="mb-[9px] text-[12.5px] text-gray-500">
                    {itemSummary(r.items)} · {r.distance}
                  </div>
                  <div className="flex items-center justify-between rounded-[9px] bg-gray-100 px-[11px] py-[9px]">
                    <span className="text-xs text-gray-500">{r.budgetLabel}</span>
                    {!urgent && <span className="text-[11.5px] font-bold text-gray-600">{r.deadlineLabel}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
