// CU-NCPK-08: 업그레이드 차액 결제(외부연동 PG) - 선택한 업그레이드 항목 차액을 쿠폰+포인트+결제수단으로 결제
import Button from "../../components/ui/Button";
import BottomSheet from "../../components/ui/BottomSheet";
import NcpHeader from "./NcpHeader";
import { CloseIcon } from "./ncpIcons";
import { nfmt } from "./ncpFormat";
import type { PayMethodKey } from "./ncpTypes";

export interface PayItem {
  name: string;
  sub: string;
  price: number;
}

// 포인트·쿠폰은 아직 백엔드에 관련 모델이 없어 항상 보유량 0 · 쿠폰 없음으로 취급
const POINT_BAL = 0;
const PAY_METHOD_DEFS: Array<{ id: PayMethodKey; label: string; note: string }> = [
  { id: "bank", label: "무통장 입금", note: "입금 계좌 · 국민 123456-01-234567 (모토페이)" },
  { id: "card", label: "신용/체크카드", note: "" },
];

interface CouponDef {
  id: string;
  name: string;
  desc: string;
  type: "amount" | "percent";
  value: number;
  cap?: number;
  minAmount?: number;
}
// 쿠폰도 포인트와 마찬가지로 백엔드에 모델이 없어 항상 빈 목록(보유 쿠폰 없음)으로 취급
const COUPON_DEFS: CouponDef[] = [];
const couponBadge = (c: CouponDef) => (c.type === "amount" ? `-${nfmt(c.value)}원` : `-${c.value}%`);

interface UpgDiffPayScreenProps {
  onBack: () => void;
  onPay: () => void;
  submitting: boolean;
  payItems: PayItem[];
  payTotal: number;
  pay: PayMethodKey;
  pointUse: number;
  couponSel: string | null;
  couponSheetOpen: boolean;
  onSelectPay: (key: PayMethodKey) => void;
  onPointInput: (raw: string) => void;
  onUseAllPoint: () => void;
  onOpenCouponSheet: () => void;
  onCloseCouponSheet: () => void;
  onSelectCoupon: (id: string | null) => void;
  onConfirmCoupon: () => void;
}

export default function UpgDiffPayScreen({
  onBack,
  onPay,
  submitting,
  payItems,
  payTotal,
  pay,
  pointUse,
  couponSel,
  couponSheetOpen,
  onSelectPay,
  onPointInput,
  onUseAllPoint,
  onOpenCouponSheet,
  onCloseCouponSheet,
  onSelectCoupon,
  onConfirmCoupon,
}: UpgDiffPayScreenProps) {
  const couponUsable = COUPON_DEFS.filter((c) => !c.minAmount || payTotal >= c.minAmount);
  const selCoupon = couponUsable.find((c) => c.id === couponSel) || null;
  const couponDiscount = selCoupon
    ? Math.min(selCoupon.type === "amount" ? selCoupon.value : Math.round(((payTotal * selCoupon.value) / 100 / 10)) * 10, selCoupon.cap ?? Infinity, payTotal)
    : 0;
  const afterCoupon = payTotal - couponDiscount;
  const pointMax = Math.min(POINT_BAL, afterCoupon);
  const pointsUsed = Math.max(0, Math.min(pointUse || 0, pointMax));
  const payRemain = afterCoupon - pointsUsed;
  const cta8Label =
    payTotal === 0
      ? "예약 확정하기"
      : pay === "bank"
        ? `${nfmt(payRemain)}원 입금 예약하기`
        : payRemain > 0
          ? `${nfmt(payRemain)}원 결제하기`
          : "포인트로 결제 완료하기";

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <NcpHeader title="업그레이드 차액 결제" onBack={onBack} />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-5 pb-6">
        <div className="mb-2 text-[13px] font-extrabold tracking-wide text-gray-500">결제 대상</div>
        <div className="rounded-[14px] border border-gray-200 bg-white px-4 shadow-sm">
          {payItems.length === 0 ? (
            <div className="py-[18px] text-center text-[13px] text-gray-500">추가 결제할 항목이 없어요</div>
          ) : (
            payItems.map((p, i) => (
              <div
                key={p.name}
                className={`flex items-center justify-between py-[13px] ${i < payItems.length - 1 ? "border-b border-gray-100" : ""}`}
              >
                <div>
                  <div className="text-[13.5px] font-bold text-gray-900">{p.name}</div>
                  <div className="mt-px text-[11.5px] text-gray-500">{p.sub}</div>
                </div>
                <span className="text-sm font-bold text-gray-900 tabular-nums">+{nfmt(p.price)}원</span>
              </div>
            ))
          )}
        </div>

        <div className="mt-5 mb-2 text-[13px] font-extrabold tracking-wide text-gray-500">포인트 사용</div>
        <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-brand-subtle text-[13px] font-extrabold text-brand">
                P
              </span>
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

        <div className="mt-5 mb-2 text-[13px] font-extrabold tracking-wide text-gray-500">할인 쿠폰</div>
        <div
          onClick={onOpenCouponSheet}
          className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white px-[15px] py-3.5 shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-accent-subtle text-accent-strong">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6" />
                <path d="M2 8h20v4H2z" />
                <path d="M12 8v14M12 8a3 3 0 1 0-3-3c0 1.5 3 3 3 3Z" />
                <path d="M12 8a3 3 0 1 1 3-3c0 1.5-3 3-3 3Z" />
              </svg>
            </span>
            <div>
              <div className="text-[13.5px] font-bold text-gray-900">{selCoupon ? selCoupon.name : `보유 쿠폰 ${couponUsable.length}장`}</div>
              <div className="mt-px text-[11.5px] text-gray-500">{selCoupon ? `${couponBadge(selCoupon)} 적용됨` : "적용 가능한 쿠폰이 있어요"}</div>
            </div>
          </div>
          <span className="text-[12.5px] font-bold text-brand">선택 ›</span>
        </div>

        <div className="mt-5 mb-2 text-[13px] font-extrabold tracking-wide text-gray-500">
          결제 수단 <span className="font-semibold text-gray-500">· 남은 금액</span>
        </div>
        <div className="flex flex-col gap-[9px]">
          {PAY_METHOD_DEFS.map((m) => {
            const sel = pay === m.id;
            return (
              <div
                key={m.id}
                onClick={() => onSelectPay(m.id)}
                className={`flex cursor-pointer items-center gap-[11px] rounded-xl border px-[15px] py-3.5 ${
                  sel ? "border-brand bg-brand-subtle" : "border-gray-200 bg-white"
                }`}
              >
                <span
                  className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px] text-white ${
                    sel ? "bg-brand" : "border-2 border-gray-300"
                  }`}
                >
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

        <div className="mt-5 rounded-xl bg-gray-100 px-4 py-3.5">
          <div className="flex items-center justify-between py-[3px]">
            <span className="text-[12.5px] text-gray-600">업그레이드 차액</span>
            <span className="text-[13px] font-semibold text-gray-800 tabular-nums">{nfmt(payTotal)}원</span>
          </div>
          {couponDiscount > 0 && (
            <div className="flex items-center justify-between py-[3px]">
              <span className="text-[12.5px] text-gray-600">쿠폰 할인</span>
              <span className="text-[13px] font-bold text-green-600 tabular-nums">-{nfmt(couponDiscount)}원</span>
            </div>
          )}
          {pointsUsed > 0 && (
            <div className="flex items-center justify-between py-[3px]">
              <span className="text-[12.5px] text-gray-600">포인트 사용</span>
              <span className="text-[13px] font-bold text-green-600 tabular-nums">-{nfmt(pointsUsed)}원</span>
            </div>
          )}
          <div className="mt-1.5 flex items-center justify-between border-t border-gray-100 py-[3px] pt-2.5">
            <span className="text-sm font-bold text-gray-900">최종 결제금액</span>
            <span className="text-[22px] font-extrabold text-brand tabular-nums">{nfmt(payRemain)}원</span>
          </div>
        </div>
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-6">
        <Button size="xl" disabled={submitting} onClick={onPay}>
          {submitting ? "예약 처리 중..." : cta8Label}
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
