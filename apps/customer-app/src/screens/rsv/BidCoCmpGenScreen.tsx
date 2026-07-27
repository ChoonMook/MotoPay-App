// CU-RSVC-10: 입찰 업체 비교(일반) - 응찰 업체 견적가·평점·거리 비교, 정렬. 카드 탭 시 입찰 내용 상세로 이동
import shopThumb from "../../assets/images/shop.png";
import RsvHeader from "./RsvHeader";
import Button from "../../components/ui/Button";
import { ClockIcon, StarIcon, CircleXIcon } from "./rsvIcons";
import { BIDDERS, type SortBidKey } from "./rsvTypes";
import { nfmt } from "./rsvFormat";

const SORT_DEFS: Array<[SortBidKey, string]> = [
  ["rating", "평점순"],
  ["price", "견적가순"],
  ["dist", "거리순"],
];

function bidTotal(items: Array<[string, number]>) {
  return items.reduce((s, [, p]) => s + p, 0);
}

interface BidCoCmpGenScreenProps {
  emptyDemo: boolean;
  onToggleEmpty: () => void;
  sortBid: SortBidKey;
  onSortChange: (key: SortBidKey) => void;
  onSelectBid: (id: string) => void;
  onReRequest: () => void;
  onBack: () => void;
}

export default function BidCoCmpGenScreen({ emptyDemo, onToggleEmpty, sortBid, onSortChange, onSelectBid, onReRequest, onBack }: BidCoCmpGenScreenProps) {
  const sorted = [...BIDDERS].sort((a, b) => {
    if (sortBid === "rating") return parseFloat(b.rating) - parseFloat(a.rating);
    if (sortBid === "price") return bidTotal(a.items) - bidTotal(b.items);
    return parseFloat(a.dist) - parseFloat(b.dist);
  });

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <RsvHeader title="입찰 업체 비교" onBack={onBack} />

      <div className="flex-none border-b border-gray-100 bg-brand-subtle px-5 py-2.5">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-brand">
            <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">
              <ClockIcon />
            </span>
            입찰 진행중 · 마감 D-1
          </span>
          <span
            onClick={onToggleEmpty}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-[5px] text-[11px] font-extrabold ${
              emptyDemo ? "bg-accent text-white" : "bg-white text-gray-600 ring-1 ring-gray-400 ring-inset"
            }`}
          >
            {emptyDemo ? "정상 상태로" : "응찰 0건 미리보기"}
          </span>
        </div>
      </div>

      {!emptyDemo && (
        <div className="flex-none border-b border-gray-100 bg-white px-5 py-3">
          <div className="flex gap-[7px]">
            {SORT_DEFS.map(([k, label]) => {
              const on = sortBid === k;
              return (
                <span
                  key={k}
                  onClick={() => onSortChange(k)}
                  className={`cursor-pointer rounded-full px-3.5 py-[7px] text-[12.5px] ${
                    on ? "bg-brand font-extrabold text-white" : "bg-gray-100 font-semibold text-gray-600"
                  }`}
                >
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-4 pb-6">
        {emptyDemo ? (
          <div className="flex flex-col items-center gap-3 px-6 pt-11 pb-5 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-subtle text-accent-strong">
              <CircleXIcon />
            </span>
            <div className="text-base font-extrabold text-gray-900">도착한 입찰이 없어요</div>
            <div className="max-w-[280px] text-[13px] leading-[1.55] text-gray-600">
              마감까지 응찰한 업체가 없으면 요청은 <b>자동 취소</b>되며, 취소 전 알림으로 미리 안내해 드려요.
            </div>
            <div className="mt-1.5 w-full rounded-xl border border-orange-100 bg-accent-subtle px-[15px] py-[13px] text-left text-xs leading-relaxed text-gray-600">
              <b className="text-accent-strong">자동 취소 예정 · D-1</b>
              <br />
              반경을 넓히거나 조건을 완화해 다시 요청하면 응찰 확률이 높아져요.
            </div>
            <div className="mt-2 w-full">
              <Button variant="outline" size="lg" onClick={onReRequest}>
                조건 바꿔 다시 요청
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sorted.map((b) => {
              const total = bidTotal(b.items);
              return (
                <div key={b.id} onClick={() => onSelectBid(b.id)} className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-[15px] shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="h-[46px] w-[46px] flex-none overflow-hidden rounded-xl bg-gray-100">
                      <img src={shopThumb} alt={b.name} className="h-full w-full object-cover" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[14.5px] font-extrabold text-gray-900">{b.name}</span>
                        {b.best && <span className="flex-none rounded bg-accent-subtle px-1.5 py-0.5 text-[9.5px] font-extrabold text-accent-strong">최저가</span>}
                      </div>
                      <div className="mt-[3px] flex items-center gap-1.5 text-[11.5px] text-gray-600">
                        <StarIcon color="var(--color-accent)" />
                        <span className="font-bold">{b.rating}</span>
                        <span className="text-gray-500">
                          · {b.dist} · {b.when}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-end justify-between border-t border-gray-100 pt-3">
                    <span className="text-xs text-gray-600">{b.items.length}개 항목 · 견적 합계</span>
                    <span className="text-[19px] font-extrabold tracking-tight text-brand tabular-nums">{nfmt(total)}원</span>
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
