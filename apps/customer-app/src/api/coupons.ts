// apps/api의 내 쿠폰함 조회 엔드포인트(/me/coupons) 호출 — 보유 쿠폰함(CU-MYPG-16) 전용, 로그인 필요
import { authedRequest } from "./http";

export interface MyCouponItemApi {
  couponNo: string;
  name: string;
  couponType: string; // DISCOUNT(할인권)/EXCHANGE(교환권)/AMOUNT(금액권)
  discountValue: number;
  issuerType: string; // OPERATOR(운영사)/DEALER(딜러사)
  issuerCompanyName: string | null;
  status: string; // ISSUED(사용가능)/USED(사용완료)/EXPIRED(만료)
  validFrom: string;
  validTo: string;
  issuedAt: string;
  usedAt: string | null;
}

export function getMyCoupons(): Promise<MyCouponItemApi[]> {
  return authedRequest<MyCouponItemApi[]>("/me/coupons");
}
