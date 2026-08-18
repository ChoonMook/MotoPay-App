// apps/api의 쿠폰 관리자 엔드포인트(/admin/coupons/*) 호출 — AD-CPN-02(쿠폰 발행)/AD-CPN-03(쿠폰 내역 조회) 전용
import { authedRequest } from "./http";

export interface AdminCouponListItem {
  couponNo: string;
  name: string;
  couponType: string; // -> CommonCodeDetail(code='COUPON_TYPE')
  discountValue: number;
  issuerType: string; // -> CommonCodeDetail(code='COUPON_ISSUER_TYPE')
  issuerCompanyName: string | null;
  targetType: string; // -> CommonCodeDetail(code='COUPON_TARGET_TYPE')
  validFrom: string;
  validTo: string;
  issuedCount: number;
  usedCount: number;
  status: "ACTIVE" | "CLOSED";
  createdAt: string;
}

export interface ListAdminCouponsParams {
  issuerType?: string;
  status?: "ACTIVE" | "CLOSED";
  dateFrom?: string;
  dateTo?: string;
}

export function listAdminCoupons(params: ListAdminCouponsParams = {}): Promise<AdminCouponListItem[]> {
  const query = new URLSearchParams();
  if (params.issuerType) query.set("issuerType", params.issuerType);
  if (params.status) query.set("status", params.status);
  if (params.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params.dateTo) query.set("dateTo", params.dateTo);
  const qs = query.toString();
  return authedRequest<AdminCouponListItem[]>(`/admin/coupons${qs ? `?${qs}` : ""}`);
}

export interface AdminCouponIssuanceItem {
  memberId: string;
  memberName: string;
  status: string; // -> CommonCodeDetail(code='COUPON_ISSUANCE_STATUS')
  usedAt: string | null;
  createdAt: string;
}

export interface AdminCouponDetail extends AdminCouponListItem {
  targetGrade: string | null;
  issuances: AdminCouponIssuanceItem[];
}

export function getAdminCouponDetail(couponNo: string): Promise<AdminCouponDetail> {
  return authedRequest<AdminCouponDetail>(`/admin/coupons/${couponNo}`);
}

export function previewCouponTargetCount(targetType: string, targetGrade?: string): Promise<number> {
  const query = new URLSearchParams({ targetType });
  if (targetGrade) query.set("targetGrade", targetGrade);
  return authedRequest<number>(`/admin/coupons/preview-target-count?${query.toString()}`);
}

export interface IssueCouponInput {
  name: string;
  couponType: string;
  discountValue?: number;
  issuerType: string;
  issuerCompanyId?: number;
  targetType: string;
  targetGrade?: string;
  memberIds?: string[];
  validFrom: string;
  validTo: string;
}

export function issueCoupon(input: IssueCouponInput): Promise<AdminCouponDetail> {
  return authedRequest<AdminCouponDetail>("/admin/coupons", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface AdminMemberCouponItem {
  couponNo: string;
  couponName: string;
  couponType: string; // -> CommonCodeDetail(code='COUPON_TYPE')
  discountValue: number;
  issuerType: string; // -> CommonCodeDetail(code='COUPON_ISSUER_TYPE')
  status: string; // -> CommonCodeDetail(code='COUPON_ISSUANCE_STATUS')
  validFrom: string;
  validTo: string;
  issuedAt: string;
  usedAt: string | null;
}

export function listMemberCoupons(memberId: string): Promise<AdminMemberCouponItem[]> {
  return authedRequest<AdminMemberCouponItem[]>(`/admin/coupons/member/${memberId}`);
}
