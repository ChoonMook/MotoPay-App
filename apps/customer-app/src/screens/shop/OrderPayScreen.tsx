// CU-SHOP-05: 주문/결제(외부연동 PG) - 주문상품·배송지 확인, 포인트·쿠폰 적용, 결제수단 선택 후 인앱 결제
import Button from "../../components/ui/Button";
import BottomSheet from "../../components/ui/BottomSheet";
import { CloseIcon } from "../common/commonIcons";
import { CouponIcon } from "./shopIcons";
import { COUPON_DEFS, POINT_BAL } from "./shopData";
import { nfmt } from "./shopFormat";
import type { PayMethodKey } from "./shopTypes";

const couponBadge = (c: (typeof COUPON_DEFS)[number]) => (c.type === "amount" ? `-${nfmt(c.value)}원` : `-${c.value}%`);

export interface CheckoutItem {
  name: string;
  img: string;
  opt: string;
  qty: number;
  price: number;
}

interface OrderPayScreenProps {
  onBack: () => void;
  checkoutItems: CheckoutItem[];
  selAddrName: string;
  selAddrText: string;
  onOpenAddrChg: () => void;
  pointUse: number;
  onPointInput: (raw: string) => void;
  onUseAllPoint: () => void;
  couponSel: string | null;
  couponSheetOpen: boolean;
  onOpenCouponSheet: () => void;
  onCloseCouponSheet: () => void;
  onSelectCoupon: (id: string | null) => void;
  onConfirmCoupon: () => void;
  payMethod: PayMethodKey;
  onSelectPay: (key: PayMethodKey) => void;
  onPay: () => void;
}

export default function OrderPayScreen({
  onBack,
  checkoutItems,
  selAddrName,
  selAddrText,
  onOpenAddrChg,
  pointUse,
  onPointInput,
  onUseAllPoint,
  couponSel,
  couponSheetOpen,
  onOpenCouponSheet,
  onCloseCouponSheet,
  onSelectCoupon,
  onConfirmCoupon,
  payMethod,
  onSelectPay,
  onPay,
}: OrderPayScreenProps) {
  const checkoutTotal = checkoutItems.reduce((s, c) => s + c.price * c.qty, 0);
  const checkoutShip = checkoutTotal > 0 && checkoutTotal < 50000 ? 3000 : 0;
  const payTotal = checkoutTotal + checkoutShip;

  const couponUsable = COUPON_DEFS.filter((c) => !c.minAmount || payTotal >= c.minAmount);
  const selCoupon = couponUsable.find((c) => c.id === couponSel) || null;
  const couponDiscount = selCoupon
    ? Math.min(selCoupon.type === "amount" ? selCoupon.value : Math.round(((payTotal * selCoupon.value) / 100 / 10)) * 10, selCoupon.cap ?? Infinity, payTotal)
    : 0;
  const afterCoupon = payTotal - couponDiscount;
  const pointMax = Math.min(POINT_BAL, afterCoupon);
  const pointsUsed = Math.max(0, Math.min(pointUse || 0, pointMax));
  const payRemain = afterCoupon - pointsUsed;
  const ctaPayLabel = payMethod === "bank" ? `${nfmt(payRemain)}원 입금 예약하기` : payRemain > 0 ? `${nfmt(payRemain)}원 결제하기` : "포인트로 결제 완료하기";

  const payMethodDefs: { key: PayMethodKey; label: string; note?: string }[] = [
    { key: "bank", label: "무통장 입금", note: "입금 계좌 · 국민 123456-01-234567 (모토페이)" },
    { key: "card", label: "신용/체크카드" },
  ];

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex-none bg-white pt-[50px] pr-2.5 pl-2.5">
        <div className="flex items-center gap-1.5">
          <span onClick={onBack} className="flex h-9 w-9 cursor-pointer items-center justify-center text-gray-800">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </span>
          <span className="text-base font-bold text-gray-900">주문/결제</span>
        </div>
      </div>

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-[18px] pb-6">
        <div className="mx-0.5 mb-2.5 text-[13px] font-extrabold text-gray-900">주문 상품 {checkoutItems.length}건</div>
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm">
          {checkoutItems.map((c) => (
            <div key={c.name + c.opt} className="flex items-center gap-2.5">
              <span className="h-[52px] w-[52px] flex-none overflow-hidden rounded-[10px] bg-gray-100">
                <img src={c.img} alt={c.name} className="h-full w-full object-cover" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold text-gray-800">{c.name}</div>
                <div className="mt-0.5 text-[11px] text-gray-500">
                  {c.opt} · {c.qty}개
                </div>
              </div>
              <span className="text-[13.5px] font-extrabold text-gray-900 tabular-nums">{nfmt(c.price * c.qty)}원</span>
            </div>
          ))}
        </div>

        <div className="mx-0.5 mt-5 mb-2.5 text-[13px] font-extrabold text-gray-900">배송지</div>
        <div onClick={onOpenAddrChg} className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white px-[15px] py-3.5 shadow-sm">
          <div>
            <div className="text-[13.5px] font-bold text-gray-900">{selAddrName}</div>
            <div className="mt-[3px] text-xs leading-[1.4] text-gray-600">{selAddrText}</div>
          </div>
          <span className="flex-none text-xs font-bold whitespace-nowrap text-brand">변경</span>
        </div>

        <div className="mx-0.5 mt-5.5 mb-2.5 text-[13px] font-extrabold text-gray-900">포인트 사용</div>
        <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-brand-subtle text-[13px] font-extrabold text-brand">P</span>
              <div>
                <div className="text-[13.5px] font-bold text-gray-900">포인트 사용</div>
                <div className="mt-px text-[11.5px] text-gray-500">{nfmt(POINT_BAL)}P 보유</div>
              </div>
            </div>
            <span onClick={onUseAllPoint} className="cursor-pointer rounded-lg bg-brand-subtle px-3 py-1.5 text-xs font-bold text-brand">
              전액 사용
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-[10px] border border-gray-400 bg-white px-3">
            <input
              value={String(pointsUsed)}
              onChange={(e) => onPointInput(e.target.value)}
              inputMode="numeric"
              className="flex-1 border-none bg-transparent py-3 text-base font-bold text-gray-900 outline-none tabular-nums"
            />
            <span className="text-sm font-bold text-gray-500">P</span>
          </div>
          <div className="mt-1.5 text-[11.5px] text-gray-500">최대 {nfmt(pointMax)}P 사용 가능</div>
        </div>

        <div className="mx-0.5 mt-5 mb-2.5 text-[13px] font-extrabold text-gray-900">할인 쿠폰</div>
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
          <span className="text-[12.5px] font-bold text-brand">선택 ›</span>
        </div>

        <div className="mx-0.5 mt-5 mb-2.5 text-[13px] font-extrabold text-gray-900">결제 수단</div>
        <div className="flex flex-col gap-[9px]">
          {payMethodDefs.map((m) => {
            const sel = payMethod === m.key;
            return (
              <div
                key={m.key}
                onClick={() => onSelectPay(m.key)}
                className={`flex cursor-pointer items-center gap-[11px] rounded-xl border px-[15px] py-3.5 ${
                  sel ? "border-brand bg-brand-subtle" : "border-gray-200 bg-white"
                }`}
              >
                <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px] text-white ${sel ? "bg-brand" : "border-2 border-gray-300"}`}>
                  {sel ? "✓" : ""}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-800">{m.label}</div>
                  {sel && m.note && <div className="mt-[3px] text-[11.5px] text-gray-500 tabular-nums">{m.note}</div>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5.5 rounded-2xl border border-gray-200 bg-white px-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 py-3.5">
            <span className="text-[12.5px] text-gray-500">상품금액</span>
            <span className="text-[13.5px] font-semibold text-gray-800 tabular-nums">{nfmt(checkoutTotal)}원</span>
          </div>
          <div className="flex items-center justify-between border-b border-gray-100 py-3.5">
            <span className="text-[12.5px] text-gray-500">배송비</span>
            <span className="text-[13.5px] font-semibold text-gray-800 tabular-nums">{checkoutShip ? `${nfmt(checkoutShip)}원` : "무료"}</span>
          </div>
          {couponDiscount > 0 && (
            <div className="flex items-center justify-between border-b border-gray-100 py-3.5">
              <span className="text-[12.5px] text-gray-500">쿠폰 할인</span>
              <span className="text-[13.5px] font-bold text-green-600 tabular-nums">-{nfmt(couponDiscount)}원</span>
            </div>
          )}
          {pointsUsed > 0 && (
            <div className="flex items-center justify-between border-b border-gray-100 py-3.5">
              <span className="text-[12.5px] text-gray-500">포인트 사용</span>
              <span className="text-[13.5px] font-bold text-green-600 tabular-nums">-{nfmt(pointsUsed)}원</span>
            </div>
          )}
          <div className="flex items-center justify-between py-3.5">
            <span className="text-[12.5px] text-gray-500">총 결제금액</span>
            <span className="text-[13.5px] font-extrabold text-brand tabular-nums">{nfmt(payRemain)}원</span>
          </div>
        </div>
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-6">
        <Button size="xl" onClick={onPay}>
          {ctaPayLabel}
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
                  <span className="flex-none text-[13px] font-extrabold whitespace-nowrap text-accent-strong">{couponBadge(c)}</span>
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
