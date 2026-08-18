// 예약시공 선정·결제(CU-RSVC-14/15) 화면이 공유하는 금액 계산 헬퍼
import { COUPON_DEFS, type Bidder, type CouponDef, type RecoPlan } from "./rsvTypes";
import { nfmt } from "./rsvFormat";

export function bidTotal(items: Array<[string, number, string]>) {
  return items.reduce((s, [, p]) => s + p, 0);
}

export function recoTotal(plans: Array<[string, number, number, string]>) {
  return plans.reduce((s, [, , offer]) => s + offer, 0);
}

export function recoRetail(plans: Array<[string, number, number, string]>) {
  return plans.reduce((s, [, retail]) => s + retail, 0);
}

/**
 * bidders(GENERAL, 실API로 조회한 응찰 목록)/recos(EXPERT, 실API로 조회한 추천안 목록)는 호출부(RsvFlow)가 넘겨줘야 함.
 * offerNo/planNo가 둘 다 10자리 숫자라 id 접두사로 구분할 수 없어, 어느 흐름인지는 isExpert로 명시적으로 받는다.
 */
export function selectedEntry(selId: string, isExpert: boolean, bidders: Bidder[] = [], recos: RecoPlan[] = []) {
  const bidder = bidders.find((b) => b.id === selId);
  const reco = recos.find((r) => r.id === selId);
  const name = isExpert ? reco?.name ?? "" : bidder?.name ?? "";
  const total = isExpert ? recoTotal(reco?.plans ?? []) : bidTotal(bidder?.items ?? []);
  return { isRec: isExpert, bidder, reco, name, total };
}

export function couponDiscountFor(coupon: CouponDef | null, payTotal: number) {
  if (!coupon) return 0;
  const raw = coupon.type === "amount" ? coupon.value : Math.round(((payTotal * coupon.value) / 100 / 10)) * 10;
  return Math.min(raw, coupon.cap ?? Infinity, payTotal);
}

export function couponBadge(c: CouponDef) {
  return c.type === "amount" ? `-${nfmt(c.value)}원` : `-${c.value}%`;
}

export interface PayBreakdown {
  payTotal: number;
  selCoupon: CouponDef | null;
  couponDiscount: number;
  pointMax: number;
  pointsUsed: number;
  payRemain: number;
}

export function computePayBreakdown(
  selId: string,
  isExpert: boolean,
  couponSel: string | null,
  pointUse: number,
  memberPointBalance: number,
  bidders: Bidder[] = [],
  recos: RecoPlan[] = [],
): PayBreakdown {
  const { total: payTotal } = selectedEntry(selId, isExpert, bidders, recos);
  const couponUsable = COUPON_DEFS.filter((c) => !c.minAmount || payTotal >= c.minAmount);
  const selCoupon = couponUsable.find((c) => c.id === couponSel) || null;
  const couponDiscount = couponDiscountFor(selCoupon, payTotal);
  const afterCoupon = payTotal - couponDiscount;
  const pointMax = Math.min(memberPointBalance, afterCoupon);
  const pointsUsed = Math.max(0, Math.min(pointUse, pointMax));
  const payRemain = afterCoupon - pointsUsed;
  return { payTotal, selCoupon, couponDiscount, pointMax, pointsUsed, payRemain };
}
