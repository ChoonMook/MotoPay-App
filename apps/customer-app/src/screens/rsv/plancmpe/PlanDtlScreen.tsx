// CU-RSVC-13: 추천안 상세 - 소비자가(취소선)·제안가 구분 표시, 추천 사유 전문, 합계 확인 후 선택
// 평점은 DB에 리뷰 데이터가 없어 미표시(PlanCmpExpertScreen과 동일 정책)
import shopThumb from "../../../assets/images/shop.png";
import Button from "../../../components/ui/Button";
import RsvHeader from "../RsvHeader";
import { ChevronRightIcon } from "../rsvIcons";
import type { RecoPlan } from "../rsvTypes";
import { nfmt } from "../rsvFormat";

const RecoStarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--color-brand)" stroke="none">
    <path d="M12 2 15 8l6 .9-4.5 4.3 1 6.1L12 16.6 6.5 19.3l1-6.1L3 8.9 9 8z" />
  </svg>
);

interface PlanDtlScreenProps {
  reco: RecoPlan;
  onBack: () => void;
  onOpenProfile: () => void;
  onOpenProdDtl: () => void;
  onPick: () => void;
}

export default function PlanDtlScreen({ reco, onBack, onOpenProfile, onOpenProdDtl, onPick }: PlanDtlScreenProps) {
  const total = reco.plans.reduce((s, [, , offer]) => s + offer, 0);
  const retail = reco.plans.reduce((s, [, r]) => s + r, 0);

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <RsvHeader title="추천안 상세" onBack={onBack} />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-[18px] pb-6">
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm">
          <span className="h-12 w-12 flex-none overflow-hidden rounded-xl bg-gray-100">
            <img src={shopThumb} alt={reco.name} className="h-full w-full object-cover" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-extrabold text-gray-900">{reco.name}</div>
            <div className="mt-[3px] text-[11.5px] text-gray-500">{reco.when}</div>
          </div>
          <span onClick={onOpenProfile} className="flex-none cursor-pointer text-[11.5px] font-bold text-brand">
            프로필 ›
          </span>
        </div>

        <div className="mt-3.5 flex items-start gap-2.5 rounded-xl bg-brand-subtle p-3.5">
          <span className="mt-px flex-none text-brand">
            <RecoStarIcon />
          </span>
          <div>
            <div className="mb-0.5 text-[12.5px] font-extrabold text-brand">전문가 추천 사유</div>
            <div className="text-[12.5px] leading-[1.55] text-gray-600">{reco.reason}</div>
          </div>
        </div>

        <div className="mx-0.5 mt-5 mb-2.5 text-[13px] font-extrabold text-gray-900">추천 상품 구성</div>
        <div className="rounded-2xl border border-gray-200 bg-white px-4 shadow-sm">
          {reco.plans.map(([name, r, offer], i) => (
            <div key={name} onClick={onOpenProdDtl} className={`flex cursor-pointer items-center justify-between gap-3 py-3.5 ${i < reco.plans.length - 1 ? "border-b border-gray-100" : ""}`}>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-bold text-gray-900">{name}</div>
                <div className="mt-0.5 inline-flex items-center gap-0.5 text-[11px] text-brand">
                  제품 상세
                  <ChevronRightIcon color="var(--color-brand)" />
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-gray-500 tabular-nums line-through">{nfmt(r)}원</div>
                <div className="text-sm font-extrabold text-gray-900 tabular-nums">{nfmt(offer)}원</div>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between border-t-2 border-gray-100 py-[15px]">
            <span className="text-sm font-extrabold text-gray-900">
              합계 <span className="text-[11px] font-bold text-accent-strong">{nfmt(retail - total)}원 절약</span>
            </span>
            <span className="text-xl font-extrabold tracking-tight text-brand tabular-nums">{nfmt(total)}원</span>
          </div>
        </div>
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-6">
        <Button size="xl" onClick={onPick}>
          이 추천안으로 선택 · {nfmt(total)}원
        </Button>
      </div>
    </div>
  );
}
