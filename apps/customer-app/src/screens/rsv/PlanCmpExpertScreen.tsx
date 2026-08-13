// CU-RSVC-12: 추천안 비교(전문가추천) - 업체별 추천상품·추천사유·견적가 비교. 0건 시 일반 입찰과 동일하게 공지 후 취소
// 평점·거리는 DB에 리뷰/좌표 데이터가 없어 미표시(BidCoCmpGenScreen과 동일 정책)
import shopThumb from "../../assets/images/shop.png";
import RsvHeader from "./RsvHeader";
import Button from "../../components/ui/Button";
import { CircleXIcon } from "./rsvIcons";
import type { RecoPlan } from "./rsvTypes";
import { nfmt } from "./rsvFormat";

const RecoStarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-brand)" stroke="none">
    <path d="M12 2 15 8l6 .9-4.5 4.3 1 6.1L12 16.6 6.5 19.3l1-6.1L3 8.9 9 8z" />
  </svg>
);

function recoTotal(plans: Array<[string, number, number, string]>) {
  return plans.reduce((s, [, , offer]) => s + offer, 0);
}
function recoRetail(plans: Array<[string, number, number, string]>) {
  return plans.reduce((s, [, retail]) => s + retail, 0);
}

interface PlanCmpExpertScreenProps {
  recos: RecoPlan[];
  loading: boolean;
  budgetLabel: string;
  onSelectReco: (id: string) => void;
  onReRequest: () => void;
  onBack: () => void;
}

export default function PlanCmpExpertScreen({
  recos,
  loading,
  budgetLabel,
  onSelectReco,
  onReRequest,
  onBack,
}: PlanCmpExpertScreenProps) {
  const showEmpty = !loading && recos.length === 0;

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <RsvHeader title="전문가 추천안 비교" onBack={onBack} />

      <div className="flex-none border-b border-gray-100 bg-brand-subtle px-5 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-brand">
          <RecoStarIcon />
          예산 {budgetLabel} · 추천 {recos.length}건
        </span>
      </div>

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-4 pb-6">
        {loading ? (
          <div className="py-10 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : showEmpty ? (
          <div className="flex flex-col items-center gap-3 px-6 pt-11 pb-5 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-subtle text-accent-strong">
              <CircleXIcon />
            </span>
            <div className="text-base font-extrabold text-gray-900">도착한 추천안이 없어요</div>
            <div className="max-w-[280px] text-[13px] leading-[1.55] text-gray-600">
              마감까지 추천한 전문가가 없으면 요청은 <b>자동 취소</b>되며, 취소 전 알림으로 미리 안내해 드려요.
            </div>
            <div className="mt-1.5 w-full rounded-xl border border-orange-100 bg-accent-subtle px-[15px] py-[13px] text-left text-xs leading-relaxed text-gray-600">
              <b className="text-accent-strong">자동 취소 예정 · D-2</b>
              <br />
              예산을 조정하거나 카테고리를 넓혀 다시 요청해 보세요.
            </div>
            <div className="mt-2 w-full">
              <Button variant="outline" size="lg" onClick={onReRequest}>
                조건 바꿔 다시 요청
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recos.map((r) => {
              const total = recoTotal(r.plans);
              const retail = recoRetail(r.plans);
              return (
                <div key={r.id} onClick={() => onSelectReco(r.id)} className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-[15px] shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="h-[46px] w-[46px] flex-none overflow-hidden rounded-xl bg-gray-100">
                      <img src={shopThumb} alt={r.name} className="h-full w-full object-cover" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14.5px] font-extrabold text-gray-900">{r.name}</div>
                      <div className="mt-[3px] text-[11.5px] text-gray-500">{r.when}</div>
                    </div>
                  </div>
                  <div className="mt-3 rounded-[11px] bg-brand-subtle px-[13px] py-[11px]">
                    <div className="text-[12.5px] font-extrabold text-brand">{r.itemSummary}</div>
                    <div className="mt-1 text-xs leading-relaxed text-gray-600">{r.reason}</div>
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <span className="text-xs text-gray-600">추천 견적가</span>
                    <div className="text-right">
                      <span className="mr-1.5 text-[11.5px] text-gray-500 tabular-nums line-through">{nfmt(retail)}원</span>
                      <span className="text-[19px] font-extrabold tracking-tight text-brand tabular-nums">{nfmt(total)}원</span>
                    </div>
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
