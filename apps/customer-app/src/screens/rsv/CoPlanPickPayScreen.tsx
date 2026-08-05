// CU-RSVC-14: 업체/추천안 선정·결제 - 포인트 사용, 보유 쿠폰 1장 선택 적용, 결제수단 선택 후 인앱 결제(자유 입찰가)
import Button from "../../components/ui/Button";
import BottomSheet from "../../components/ui/BottomSheet";
import shopThumb from "../../assets/images/shop.png";
import RsvHeader from "./RsvHeader";
import { CloseIcon, CouponIcon, InfoIcon } from "./rsvIcons";
import { COUPON_DEFS, POINT_BALANCE, type Bidder, type PayMethodKey, type RecoPlan } from "./rsvTypes";
import { nfmt, parseDigits } from "./rsvFormat";
import { selectedEntry, computePayBreakdown, couponBadge } from "./rsvCalc";

interface CoPlanPickPayScreenProps {
  selId: string;
  isExpert: boolean;
  bidders: Bidder[];
  recos: RecoPlan[];
  payMethod: PayMethodKey;
  pointUse: number;
  couponSel: string | null;
  couponSheetOpen: boolean;
  onPointChange: (n: number) => void;
  onSelectPayMethod: (k: PayMethodKey) => void;
  onOpenCouponSheet: () => void;
  onCloseCouponSheet: () => void;
  onSelectCoupon: (id: string | null) => void;
  onConfirmCoupon: () => void;
  onBack: () => void;
  onPay: () => void;
}

export default function CoPlanPickPayScreen({
  selId,
  isExpert,
  bidders,
  recos,
  payMethod,
  pointUse,
  couponSel,
  couponSheetOpen,
  onPointChange,
  onSelectPayMethod,
  onOpenCouponSheet,
  onCloseCouponSheet,
  onSelectCoupon,
  onConfirmCoupon,
  onBack,
  onPay,
}: CoPlanPickPayScreenProps) {
  const { isRec, bidder, reco, name: selName } = selectedEntry(selId, isExpert, bidders, recos);
  const selItemsLabel = isRec ? reco?.itemSummary ?? "" : (bidder?.items ?? []).map(([n]) => n.split(" · ")[0]).join(" · ");
  const { payTotal, selCoupon, couponDiscount, pointMax, pointsUsed, payRemain } = computePayBreakdown(
    selId,
    isExpert,
    couponSel,
    pointUse,
    bidders,
    recos,
  );
  const couponUsable = COUPON_DEFS.filter((c) => !c.minAmount || payTotal >= c.minAmount);

  const ctaLabel =
    payMethod === "bank" ? `${nfmt(payRemain)}원 입금 예약하기` : payRemain > 0 ? `${nfmt(payRemain)}원 결제하기` : "포인트로 결제 완료하기";

  const payRows: Array<{ k: string; v: string; strong?: boolean; green?: boolean }> = [
    { k: "견적 금액", v: `${nfmt(payTotal)}원` },
  ];
  if (couponDiscount > 0) payRows.push({ k: "쿠폰 할인", v: `-${nfmt(couponDiscount)}원`, green: true });
  if (pointsUsed > 0) payRows.push({ k: "포인트 사용", v: `-${nfmt(pointsUsed)}원`, green: true });
  payRows.push({ k: "총 결제금액", v: `${nfmt(payRemain)}원`, strong: true });

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <RsvHeader title="결제" onBack={onBack} />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-[18px] pb-6">
        <div className="mx-0.5 mb-2.5 text-[13px] font-extrabold text-gray-900">선정 {isRec ? "추천안" : "업체"}</div>
        <div className="flex items-center gap-3 rounded-2xl border border-brand bg-white p-3.5 shadow-sm">
          <span className="h-[46px] w-[46px] flex-none overflow-hidden rounded-xl bg-gray-100">
            <img src={shopThumb} alt={selName} className="h-full w-full object-cover" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[14.5px] font-extrabold text-gray-900">{selName}</div>
            <div className="mt-0.5 text-[11.5px] text-gray-500">{selItemsLabel}</div>
          </div>
        </div>

        <div className="mx-0.5 mt-[22px] mb-2.5 text-[13px] font-extrabold text-gray-900">포인트 사용</div>
        <div className="rounded-xl border border-gray-200 bg-white px-[15px] py-3.5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-brand-subtle text-[13px] font-extrabold text-brand">
                P
              </span>
              <div>
                <div className="text-[13.5px] font-bold text-gray-900">포인트 사용</div>
                <div className="mt-px text-[11.5px] text-gray-500">{nfmt(POINT_BALANCE)}P 보유</div>
              </div>
            </div>
            <span onClick={() => onPointChange(pointMax)} className="cursor-pointer rounded-lg bg-brand-subtle px-3 py-1.5 text-xs font-bold text-brand">
              전액 사용
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-[10px] border border-gray-400 bg-white px-3">
            <input
              value={String(pointsUsed)}
              onChange={(e) => onPointChange(parseDigits(e.target.value))}
              inputMode="numeric"
              className="flex-1 border-none bg-transparent py-3 text-base font-bold text-gray-900 tabular-nums outline-none"
            />
            <span className="text-sm font-bold text-gray-500">P</span>
          </div>
          <div className="mt-1.5 text-[11.5px] text-gray-500">최대 {nfmt(pointMax)}P 사용 가능</div>
        </div>

        <div className="mx-0.5 mt-[22px] mb-2.5 text-[13px] font-extrabold text-gray-900">할인 쿠폰</div>
        <div onClick={onOpenCouponSheet} className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white px-[15px] py-3.5 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-accent-subtle text-accent-strong">
              <CouponIcon />
            </span>
            <div>
              <div className="text-[13.5px] font-bold text-gray-900">{selCoupon ? selCoupon.name : `보유 쿠폰 ${couponUsable.length}장`}</div>
              <div className="mt-px text-[11.5px] text-gray-500">{selCoupon ? `${couponBadge(selCoupon)} 적용됨` : "적용 가능한 쿠폰이 있어요"}</div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[12.5px] font-bold text-brand">선택 ›</span>
        </div>

        <div className="mx-0.5 mt-[22px] mb-2.5 text-[13px] font-extrabold text-gray-900">
          결제 수단 <span className="font-semibold text-gray-500">· 남은 금액</span>
        </div>
        <div className="flex flex-col gap-2.5">
          {(
            [
              ["bank", "무통장 입금", "입금 계좌 · 국민 123456-01-234567 (모토페이)"],
              ["card", "신용/체크카드", ""],
            ] as Array<[PayMethodKey, string, string]>
          ).map(([k, label, note]) => {
            const on = payMethod === k;
            return (
              <div
                key={k}
                onClick={() => onSelectPayMethod(k)}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-[15px] py-3.5 ${on ? "border-brand bg-brand-subtle" : "border-gray-200 bg-white"}`}
              >
                <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px] text-white ${on ? "bg-brand" : "border-2 border-gray-300"}`}>
                  {on ? "✓" : ""}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-800">{label}</div>
                  {on && note && <div className="mt-[3px] text-[11.5px] text-gray-500 tabular-nums">{note}</div>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-[22px] rounded-2xl border border-gray-200 bg-white px-4 shadow-sm">
          {payRows.map((r, i) => (
            <div key={r.k} className={`flex items-center justify-between gap-3 py-3.5 ${i < payRows.length - 1 ? "border-b border-gray-100" : ""}`}>
              <span className="text-xs text-gray-500">{r.k}</span>
              <span className={`tabular-nums ${r.strong ? "text-[13.5px] font-extrabold text-brand" : r.green ? "text-[13.5px] font-bold text-green-600" : "text-[13.5px] font-semibold text-gray-800"}`}>
                {r.v}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3.5 flex items-start gap-[9px] rounded-xl bg-gray-100 px-[15px] py-[13px]">
          <span className="mt-px flex-none text-gray-500">
            <InfoIcon />
          </span>
          <div className="text-xs leading-relaxed text-gray-600">
            카탈로그 기준가가 아닌 <b>업체가 제시한 입찰가</b>로 결제돼요. 외부 PG를 통해 안전하게 처리됩니다.
          </div>
        </div>
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-6">
        <Button size="xl" onClick={onPay}>
          {ctaLabel}
        </Button>
      </div>

      {couponSheetOpen && (
        <BottomSheet onClose={onCloseCouponSheet} maxHeight="88%">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-lg font-extrabold text-gray-900">쿠폰함</span>
            <span onClick={onCloseCouponSheet} className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center text-gray-500">
              <CloseIcon />
            </span>
          </div>
          <div className="mt-1 mb-3.5 text-[12.5px] text-gray-600">적용할 쿠폰 1장을 선택하세요.</div>
          <div className="mp-scroll flex flex-col gap-2.5 overflow-y-auto">
            <div
              onClick={() => onSelectCoupon(null)}
              className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-[15px] py-3.5 ${!couponSel ? "border-brand bg-brand-subtle" : "border-gray-200 bg-white"}`}
            >
              <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px] text-white ${!couponSel ? "bg-brand" : "border-2 border-gray-300"}`}>
                {!couponSel ? "✓" : ""}
              </span>
              <span className="text-[13.5px] font-bold text-gray-900">쿠폰 사용 안 함</span>
            </div>
            {couponUsable.map((c) => {
              const sel = couponSel === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => onSelectCoupon(c.id)}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-[15px] py-3.5 ${sel ? "border-brand bg-brand-subtle" : "border-gray-200 bg-white"}`}
                >
                  <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px] text-white ${sel ? "bg-brand" : "border-2 border-gray-300"}`}>
                    {sel ? "✓" : ""}
                  </span>
                  <div className="flex-1">
                    <div className="text-[13.5px] font-bold text-gray-900">{c.name}</div>
                    <div className="mt-0.5 text-[11.5px] text-gray-500">{c.desc}</div>
                  </div>
                  <span className="flex-none whitespace-nowrap text-[13px] font-extrabold text-accent-strong">{couponBadge(c)}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4">
            <Button onClick={onConfirmCoupon}>선택 완료</Button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
