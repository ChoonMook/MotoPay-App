// CU-SHOP-03: 상품 상세 - 이미지·가격·옵션·수량 선택, 상세설명·스펙·리뷰, 장바구니 담기/바로구매
import Button from "../../components/ui/Button";
import BottomSheet from "../../components/ui/BottomSheet";
import { CloseIcon } from "../common/commonIcons";
import { HeartIcon } from "./shopIcons";
import { PRODUCTS } from "./shopData";
import { nfmt } from "./shopFormat";

const MOCK_REVIEWS = [
  { name: "박OO", stars: "★★★★★", text: "설명한 그대로예요. 배송도 빠르고 포장이 꼼꼼했어요." },
  { name: "최OO", stars: "★★★★☆", text: "가격 대비 만족스러운 품질이에요. 재구매 의사 있습니다." },
];

interface ProdDtlScreenProps {
  onBack: () => void;
  pid: string;
  qty: number;
  onQtyInc: () => void;
  onQtyDec: () => void;
  optSel: number;
  optionSheetOpen: boolean;
  onOpenOptionSheet: () => void;
  onCloseOptionSheet: () => void;
  onSelectOption: (idx: number) => void;
  wished: boolean;
  onToggleWish: () => void;
  onAddCart: () => void;
  onBuyNow: () => void;
}

export default function ProdDtlScreen({
  onBack,
  pid,
  qty,
  onQtyInc,
  onQtyDec,
  optSel,
  optionSheetOpen,
  onOpenOptionSheet,
  onCloseOptionSheet,
  onSelectOption,
  wished,
  onToggleWish,
  onAddCart,
  onBuyNow,
}: ProdDtlScreenProps) {
  const p = PRODUCTS[pid];
  const hasDisc = !!p.orig;
  const discPct = hasDisc ? Math.round((1 - p.price / (p.orig as number)) * 100) : 0;

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="mp-scroll flex-1 overflow-y-auto pb-[90px]">
        <div className="relative h-[280px] w-full overflow-hidden bg-gray-100">
          <img src={p.img} alt={p.name} className="h-full w-full object-cover" />
          <span onClick={onBack} className="absolute top-[50px] left-3.5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </span>
          <span onClick={onToggleWish} className="absolute top-[50px] right-3.5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-black/40">
            <HeartIcon filled={wished} color={wished ? "var(--color-accent)" : "#fff"} />
          </span>
        </div>

        <div className="px-5 pt-[18px]">
          <div className="text-xs font-extrabold text-brand">{p.brand}</div>
          <div className="mt-1 text-[18.5px] leading-[1.35] font-extrabold text-gray-900">{p.name}</div>
          <div className="mt-2 flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-accent)" stroke="none">
              <path d="M12 2 15 8l6 .9-4.5 4.3 1 6.1L12 16.6 6.5 19.3l1-6.1L3 8.9 9 8z" />
            </svg>
            <span className="text-[12.5px] font-bold text-gray-900">{p.rating}</span>
            <span className="text-xs text-gray-500">후기 {p.reviews}건</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            {hasDisc && (
              <>
                <span className="text-[17px] font-extrabold text-accent-strong">{discPct}%</span>
                <span className="text-[13px] text-gray-500 line-through">{nfmt(p.orig as number)}원</span>
              </>
            )}
            <span className="text-xl font-extrabold tracking-tight text-gray-900 tabular-nums">{nfmt(p.price)}원</span>
          </div>

          <div className="mx-0.5 mt-[22px] mb-2.5 text-[13px] font-extrabold text-gray-900">옵션</div>
          <div onClick={onOpenOptionSheet} className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-300 px-[15px] py-3.5">
            <span className="text-[13.5px] font-bold text-gray-800">{p.opts[optSel]}</span>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-[13.5px] font-bold text-gray-800">수량</span>
            <div className="flex items-center gap-3.5">
              <span onClick={onQtyDec} className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-lg bg-gray-100 text-base font-bold text-gray-800">
                −
              </span>
              <span className="min-w-[18px] text-center text-[14.5px] font-extrabold text-gray-900">{qty}</span>
              <span onClick={onQtyInc} className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-lg bg-gray-100 text-base font-bold text-gray-800">
                ＋
              </span>
            </div>
          </div>

          <div className="mx-0.5 mt-[22px] mb-2.5 text-[13px] font-extrabold text-gray-900">상품 설명</div>
          <div className="text-[13px] leading-relaxed text-gray-600">{p.desc}</div>

          <div className="mx-0.5 mt-[22px] mb-2.5 text-[13px] font-extrabold text-gray-900">상세 정보</div>
          <div className="rounded-2xl border border-gray-200 bg-white px-4 shadow-sm">
            {p.specs.map(([k, v], i) => (
              <div key={k} className={`flex items-center justify-between gap-3 py-[13px] ${i < p.specs.length - 1 ? "border-b border-gray-100" : ""}`}>
                <span className="text-[12.5px] text-gray-500">{k}</span>
                <span className="text-right text-[13px] font-bold text-gray-800">{v}</span>
              </div>
            ))}
          </div>

          <div className="mx-0.5 mt-[22px] mb-2.5 flex items-center justify-between">
            <span className="text-[13px] font-extrabold text-gray-900">리뷰 {p.reviews}건</span>
            <span className="text-[12.5px] font-bold text-brand">★ {p.rating} 평균</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {MOCK_REVIEWS.map((v) => (
              <div key={v.name} className="rounded-xl border border-gray-200 px-3.5 py-[13px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-gray-900">{v.name}</span>
                  <span className="text-[11px] text-accent-strong">{v.stars}</span>
                </div>
                <div className="mt-[5px] text-[12.5px] leading-relaxed text-gray-600">{v.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex gap-2.5 border-t border-gray-100 bg-white px-5 pt-3 pb-6">
        <span onClick={onToggleWish} className="flex h-[52px] w-[52px] flex-none cursor-pointer items-center justify-center rounded-xl bg-gray-100">
          <HeartIcon filled={wished} color={wished ? "var(--color-accent)" : "var(--gray-400)"} />
        </span>
        <div className="flex-1">
          <Button variant="outline" onClick={onAddCart}>
            장바구니
          </Button>
        </div>
        <div className="flex-1">
          <Button onClick={onBuyNow}>바로구매</Button>
        </div>
      </div>

      {optionSheetOpen && (
        <BottomSheet onClose={onCloseOptionSheet} maxHeight="70%">
          <div className="mb-3.5 flex items-center justify-between">
            <span className="text-lg font-extrabold text-gray-900">옵션 선택</span>
            <span onClick={onCloseOptionSheet} className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center text-gray-500">
              <CloseIcon />
            </span>
          </div>
          <div className="mp-scroll flex flex-col gap-2.5 overflow-y-auto">
            {p.opts.map((label, i) => {
              const on = optSel === i;
              return (
                <div
                  key={label}
                  onClick={() => onSelectOption(i)}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border px-[15px] py-3.5 ${
                    on ? "border-brand bg-brand-subtle" : "border-gray-200 bg-white"
                  }`}
                >
                  <span className="text-sm font-bold text-gray-800">{label}</span>
                  <span className={`text-[13px] font-extrabold ${on ? "text-brand" : "text-gray-300"}`}>{on ? "✓" : ""}</span>
                </div>
              );
            })}
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
