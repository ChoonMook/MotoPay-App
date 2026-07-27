// 예약시공 선정·결제(CU-RSVC-14/15) 화면이 공유하는 금액 계산 헬퍼
import { BIDDERS, RECOS, COUPON_DEFS, POINT_BALANCE, type CouponDef } from "./rsvTypes";
import { nfmt } from "./rsvFormat";

export function isRecoId(selId: string) {
  return selId.startsWith("r");
}

export function bidTotal(items: Array<[string, number]>) {
  return items.reduce((s, [, p]) => s + p, 0);
}

export function recoTotal(plans: Array<[string, number, number]>) {
  return plans.reduce((s, [, , offer]) => s + offer, 0);
}

export function recoRetail(plans: Array<[string, number, number]>) {
  return plans.reduce((s, [, retail]) => s + retail, 0);
}

export function selectedEntry(selId: string) {
  const isRec = isRecoId(selId);
  const bidder = BIDDERS.find((b) => b.id === selId);
  const reco = RECOS.find((r) => r.id === selId);
  const name = isRec ? reco?.name ?? "" : bidder?.name ?? "";
  const total = isRec ? recoTotal(reco?.plans ?? []) : bidTotal(bidder?.items ?? []);
  return { isRec, bidder, reco, name, total };
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

export function computePayBreakdown(selId: string, couponSel: string | null, pointUse: number): PayBreakdown {
  const { total: payTotal } = selectedEntry(selId);
  const couponUsable = COUPON_DEFS.filter((c) => !c.minAmount || payTotal >= c.minAmount);
  const selCoupon = couponUsable.find((c) => c.id === couponSel) || null;
  const couponDiscount = couponDiscountFor(selCoupon, payTotal);
  const afterCoupon = payTotal - couponDiscount;
  const pointMax = Math.min(POINT_BALANCE, afterCoupon);
  const pointsUsed = Math.max(0, Math.min(pointUse, pointMax));
  const payRemain = afterCoupon - pointsUsed;
  return { payTotal, selCoupon, couponDiscount, pointMax, pointsUsed, payRemain };
}
