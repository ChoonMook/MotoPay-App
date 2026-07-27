// CU-RSVC-11: 입찰 내용 상세 - 시공항목별 상품·가격과 합계 확인 후 선택하거나 업체 프로필로 이동
import shopThumb from "../../../assets/images/shop.png";
import Button from "../../../components/ui/Button";
import RsvHeader from "../RsvHeader";
import { StarIcon, ChevronRightIcon, InfoIcon } from "../rsvIcons";
import { BIDDERS } from "../rsvTypes";
import { nfmt } from "../rsvFormat";

interface BidContDtlScreenProps {
  selId: string;
  onBack: () => void;
  onOpenProfile: () => void;
  onOpenProdDtl: () => void;
  onPick: () => void;
}

export default function BidContDtlScreen({ selId, onBack, onOpenProfile, onOpenProdDtl, onPick }: BidContDtlScreenProps) {
  const bidder = BIDDERS.find((b) => b.id === selId) || BIDDERS[0];
  const total = bidder.items.reduce((s, [, p]) => s + p, 0);

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <RsvHeader title="입찰 내용 상세" onBack={onBack} />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-[18px] pb-6">
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm">
          <span className="h-12 w-12 flex-none overflow-hidden rounded-xl bg-gray-100">
            <img src={shopThumb} alt={bidder.name} className="h-full w-full object-cover" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-extrabold text-gray-900">{bidder.name}</div>
            <div className="mt-[3px] flex items-center gap-1.5 text-[11.5px] text-gray-600">
              <StarIcon color="var(--color-accent)" />
              <span className="font-bold">{bidder.rating}</span>
              <span className="text-gray-500">· {bidder.when}</span>
            </div>
          </div>
          <span onClick={onOpenProfile} className="flex-none cursor-pointer text-[11.5px] font-bold text-brand">
            프로필 ›
          </span>
        </div>

        <div className="mx-0.5 mt-5 mb-2.5 text-[13px] font-extrabold text-gray-900">시공 항목별 견적</div>
        <div className="rounded-2xl border border-gray-200 bg-white px-4 shadow-sm">
          {bidder.items.map(([name, price], i) => (
            <div key={name} onClick={onOpenProdDtl} className={`flex cursor-pointer items-center justify-between gap-3 py-3.5 ${i < bidder.items.length - 1 ? "border-b border-gray-100" : ""}`}>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-bold text-gray-900">{name}</div>
                <div className="mt-0.5 inline-flex items-center gap-0.5 text-[11px] text-brand">
                  제품 상세
                  <ChevronRightIcon color="var(--color-brand)" />
                </div>
              </div>
              <span className="text-sm font-extrabold text-gray-900 tabular-nums">{nfmt(price)}원</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t-2 border-gray-100 py-[15px]">
            <span className="text-sm font-extrabold text-gray-900">합계</span>
            <span className="text-xl font-extrabold tracking-tight text-brand tabular-nums">{nfmt(total)}원</span>
          </div>
        </div>

        <div className="mt-3.5 flex items-start gap-[9px] rounded-xl bg-gray-100 px-[15px] py-[13px]">
          <span className="mt-px flex-none text-gray-500">
            <InfoIcon />
          </span>
          <div className="text-xs leading-relaxed text-gray-600">
            항목별 가격이 투명하게 공개돼요. 선택하면 결제 단계로 이동하며, 결제 후 업체가 일정 조율 연락을 드려요.
          </div>
        </div>
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-6">
        <Button size="xl" onClick={onPick}>
          이 업체로 선택 · {nfmt(total)}원
        </Button>
      </div>
    </div>
  );
}
