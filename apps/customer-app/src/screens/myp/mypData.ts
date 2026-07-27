// 마이페이지 데모 데이터: 시공내역·쇼핑몰주문내역·취소반품내역·알림·SNS 목업 (원본 dc.html의 renderVals() 목업 그대로 이식)
// 차량 목록/제조사·차종 옵션은 apps/api의 /cars/me, /common-codes 실 데이터를 씀(MypFlow.tsx)

export interface CstHistItem {
  date: string;
  shop: string;
  items: string;
  price: string;
  status: "done" | "ing";
}

export const CST_HIST: CstHistItem[] = [
  { date: "2026.07.15", shop: "강남 카프로 디테일링", items: "썬팅 · 블랙박스", price: "640,000원", status: "done" },
  { date: "2026.07.02", shop: "서초 오토스타일", items: "유리막 코팅", price: "360,000원", status: "ing" },
  { date: "2026.06.10", shop: "프리미엄 카케어 방배", items: "하부 언더코팅", price: "280,000원", status: "done" },
];

export const CST_STATUS_META: Record<CstHistItem["status"], { label: string; color: string; bg: string }> = {
  done: { label: "시공완료", color: "var(--green-600)", bg: "var(--status-success-bg)" },
  ing: { label: "시공중", color: "var(--color-brand)", bg: "var(--surface-brand-subtle)" },
};

export interface ShopOrderHistItem {
  date: string;
  no: string;
  name: string;
  itemsLabel: string;
  total: string;
  status: "prep" | "ship" | "done";
}

export const SHOP_ORDER_HIST: ShopOrderHistItem[] = [
  { date: "2026.07.18", no: "SHOP-240718", name: "ZIC M7 5W30 엔진오일 외 1건", itemsLabel: "2종 · 총 2개", total: "82,000원", status: "prep" },
  { date: "2026.07.10", no: "SHOP-240710", name: "아이나비 QXD3000 블랙박스", itemsLabel: "1종 · 1개", total: "189,000원", status: "ship" },
  { date: "2026.06.28", no: "SHOP-240628", name: "루마 버텍스 300 썬팅필름 세트", itemsLabel: "1종 · 1개", total: "280,000원", status: "done" },
];

export const SHOP_ORDER_STATUS_META: Record<ShopOrderHistItem["status"], { label: string; color: string; bg: string }> = {
  prep: { label: "상품준비중", color: "var(--color-accent-strong)", bg: "var(--color-accent-subtle)" },
  ship: { label: "배송중", color: "var(--color-brand)", bg: "var(--surface-brand-subtle)" },
  done: { label: "배송완료", color: "var(--green-600)", bg: "var(--status-success-bg)" },
};

export interface CancelHistItem {
  date: string;
  type: string;
  name: string;
  reason: string;
  amount: string;
  status: "done" | "ing";
}

export const CANCEL_HIST: CancelHistItem[] = [
  { date: "2026.07.05", type: "반품", name: "차량용 방향제 세트", reason: "단순 변심", amount: "-18,000원", status: "done" },
  { date: "2026.06.20", type: "취소", name: "미쉐린 프라이머시4 타이어", reason: "주문 실수", amount: "-145,000원", status: "done" },
];

export const CANCEL_STATUS_META: Record<CancelHistItem["status"], { label: string; color: string; bg: string }> = {
  done: { label: "처리완료", color: "var(--green-600)", bg: "var(--status-success-bg)" },
  ing: { label: "처리중", color: "var(--color-accent-strong)", bg: "var(--color-accent-subtle)" },
};

export type NotiIconKey = "clock" | "coupon" | "truck" | "caralert";

export interface NotiItem {
  id: string;
  icon: NotiIconKey;
  title: string;
  body: string;
  time: string;
}

export const NOTI_DEFS: NotiItem[] = [
  { id: "a1", icon: "clock", title: "시공 예약이 확정됐어요", body: "강남 카프로 디테일링 · 07.15 시공 예정", time: "2시간 전" },
  { id: "a2", icon: "coupon", title: "신규 쿠폰이 도착했어요", body: "전 모듈 5,000원 할인 쿠폰이 지급됐어요", time: "어제" },
  { id: "a3", icon: "truck", title: "주문하신 상품이 배송을 시작했어요", body: "ZIC M7 5W30 엔진오일 외 1건", time: "2일 전" },
  { id: "a4", icon: "caralert", title: "차량 정보를 확인해주세요", body: "대표차량 번호판 정보가 오래됐어요", time: "3일 전" },
];

export const WITHDRAW_REASONS = ["서비스를 잘 이용하지 않아요", "원하는 기능이 없어요", "다른 서비스를 이용해요", "개인정보 우려"];

export interface SnsDef {
  key: string;
  label: string;
  initial: string;
  iconBg: string;
  iconColor: string;
}

export const SNS_DEFS: SnsDef[] = [
  { key: "kakao", label: "카카오", initial: "카", iconBg: "#FEE500", iconColor: "#3C1E1E" },
  { key: "naver", label: "네이버", initial: "N", iconBg: "#03C75A", iconColor: "#fff" },
  { key: "google", label: "구글", initial: "G", iconBg: "var(--surface-sunken)", iconColor: "var(--text-secondary)" },
];

export type CouponStatus = "usable" | "used" | "expired";
export type CouponIssuer = "운영사" | "딜러사";

export interface CouponItem {
  id: string;
  issuer: CouponIssuer;
  name: string;
  desc: string;
  expiryLabel: string;
  discountLabel: string;
  status: CouponStatus;
}

export const COUPON_DEFS: CouponItem[] = [
  { id: "cp1", issuer: "운영사", name: "전 모듈 5,000원 할인 쿠폰", desc: "3만원 이상 결제 시 사용 가능", expiryLabel: "2026.08.31까지", discountLabel: "5,000원", status: "usable" },
  { id: "cp2", issuer: "딜러사", name: "KCC 오토 신차패키지 쿠폰", desc: "신차패키지 시공 10% 할인", expiryLabel: "2026.09.15까지", discountLabel: "10%", status: "usable" },
  { id: "cp3", issuer: "운영사", name: "쇼핑몰 무료배송 쿠폰", desc: "금액 제한 없이 배송비 무료", expiryLabel: "2026.08.10까지", discountLabel: "무료배송", status: "usable" },
  { id: "cp4", issuer: "운영사", name: "여름맞이 3,000원 할인 쿠폰", desc: "전 모듈 공통 사용", expiryLabel: "2026.06.30 사용완료", discountLabel: "3,000원", status: "used" },
  { id: "cp5", issuer: "딜러사", name: "KCC 오토 엔진오일 교환권", desc: "엔진오일 무상 교환 1회", expiryLabel: "2026.05.31 만료", discountLabel: "교환권", status: "expired" },
];

export const COUPON_STATUS_META: Record<CouponStatus, { label: string; color: string; bg: string }> = {
  usable: { label: "사용가능", color: "var(--green-600)", bg: "var(--status-success-bg)" },
  used: { label: "사용완료", color: "var(--text-tertiary)", bg: "var(--surface-sunken)" },
  expired: { label: "만료", color: "var(--text-tertiary)", bg: "var(--surface-sunken)" },
};

export const COUPON_ISSUER_META: Record<CouponIssuer, { color: string; bg: string }> = {
  운영사: { color: "var(--color-brand)", bg: "var(--surface-brand-subtle)" },
  딜러사: { color: "var(--color-accent-strong)", bg: "var(--color-accent-subtle)" },
};

export const COUPON_TAB_DEFS: { key: CouponStatus; label: string }[] = [
  { key: "usable", label: "사용가능" },
  { key: "used", label: "사용완료" },
  { key: "expired", label: "만료" },
];
