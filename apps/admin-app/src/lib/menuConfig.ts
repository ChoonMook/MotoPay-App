// 사이드바 메뉴 트리(그룹/아이템/아이콘/경로) - uploads/MotoPay_메뉴구조도_v1_29.xlsx의 "관리자웹_사이트맵" 시트
// (AD-DASH-01 ~ AD-SYS-05 범위, 로그인/계정설정 AD-AUTH-*는 인증 흐름이라 사이드바 메뉴 대상이 아니라 제외)를
// 그대로 데이터화. pgId는 시트의 프로그램ID를 그대로 사용 — 추후 메뉴 권한 기능에서 재사용 가능하도록 보존.
// URL경로가 "-"인 항목(팝업 액션: 포인트 강제 부여/차감 등)과 3 Depth(상세화면 내부 탭) 항목은 독립된
// 사이드바 목적지가 아니라 이번 메뉴 트리에서 제외.
// v1_25 변경분: 포인트 관리 + 쿠폰 관리 그룹이 "포인트·쿠폰 관리"로 통합, 후기 관리 그룹이 CS(고객센터) 관리로
// 편입, 시스템 설정에 사용자 계정 관리(AD-SYS-04) 추가.
// v1_27 변경분: 업체 관리의 권한 관리(AD-CO-06)가 시스템 설정의 메뉴권한관리(AD-SYS-05)로 이동, 시스템 설정의
// 자동확정 기간 설정(AD-SYS-02)이 공통 코드 관리(AD-SYS-03)로 통합되어 별도 메뉴 항목에서 제외.
// v1_28 변경분: 회원 관리의 사업자 회원 목록(AD-MBR-03)이 제거되고, 업체 관리의 업체 사용자 목록(AD-CO-06,
// 신규 프로그램ID)으로 재설계되어 이동.
// v1_29 변경분(2026-08-10): 업체 등록(AD-CO-02)·업체 상세(AD-CO-04)·업체 사용자 목록(AD-CO-06)이 독립 URL을
// 잃고 팝업/탭으로 통합되어("-") 사이트맵상 독립 목적지가 아니게 됨 — 아래 MENU_GROUPS의 "업체 관리"에는
// 이미 반영되어 있던 상태(2026-08-08 논의)를 문서에 사후 반영.
import {
  BookOpen,
  Building2,
  CalendarClock,
  Car,
  Coins,
  Headset,
  LayoutDashboard,
  ShoppingBag,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface MenuLeaf {
  pgId: string; // -> 사이트맵 프로그램ID(AD-XXX-NN)
  label: string;
  path: string;
}

export interface MenuGroup {
  key: string;
  label: string;
  icon: LucideIcon;
  items: MenuLeaf[];
}

export const MENU_GROUPS: MenuGroup[] = [
  {
    key: "dash",
    label: "대시보드",
    icon: LayoutDashboard,
    items: [
      { pgId: "AD-DASH-02", label: "메인 대시보드", path: "/main/dash" },
      { pgId: "AD-DASH-03", label: "서비스별 통계", path: "/main/by-svc-stat" },
    ],
  },
  {
    key: "member",
    label: "회원 관리",
    icon: Users,
    items: [{ pgId: "AD-MBR-02", label: "고객 회원 목록", path: "/member/cust-mbr-list" }],
  },
  {
    key: "company",
    label: "업체 관리",
    icon: Building2,
    // 업체 등록(AD-CO-02)·업체 상세(AD-CO-04)는 독립된 화면이 아니라 업체 목록(AD-CO-03)에서 여는 팝업이고,
    // 업체 사용자 목록(AD-CO-06)의 계정 관리 기능도 업체 상세 팝업의 "소속 사용자 계정" 섹션이 대신하고 있어
    // 사이드바에는 업체 목록만 노출한다(2026-08-08 논의 반영).
    items: [{ pgId: "AD-CO-03", label: "업체 목록", path: "/company/co-list" }],
  },
  {
    key: "ncpk",
    label: "신차패키지 관리",
    icon: Car,
    items: [
      { pgId: "AD-NCPK-02", label: "패키지 상품 등록", path: "/ncp/pkg-prod-reg" },
      { pgId: "AD-NCPK-03", label: "항목별 업그레이드 가능 품목 설정", path: "/ncp/item-upg-avail-cfg" },
      { pgId: "AD-NCPK-04", label: "딜러사-시공업체 매핑", path: "/ncp/dealer-ptn-map" },
      { pgId: "AD-NCPK-05", label: "패키지 상품 목록", path: "/ncp/pkg-prod-list" },
      { pgId: "AD-NCPK-06", label: "발급 현황", path: "/ncp/issue-stat" },
    ],
  },
  {
    key: "rsvc",
    label: "예약시공 관리",
    icon: CalendarClock,
    items: [
      { pgId: "AD-RSVC-02", label: "입찰 현황 모니터링", path: "/rsv/bid-stat-mon" },
      { pgId: "AD-RSVC-03", label: "추천형 입찰 현황", path: "/rsv/rcmd-bid-stat" },
      { pgId: "AD-RSVC-04", label: "입찰 마감시간 설정", path: "/rsv/bid-deadline-cfg" },
      { pgId: "AD-RSVC-05", label: "시공일시 변경 (관리자)", path: "/rsv/cst-chg-admin" },
    ],
  },
  {
    key: "shop",
    label: "쇼핑몰 관리",
    icon: ShoppingBag,
    items: [
      { pgId: "AD-SHOP-02", label: "카테고리 관리", path: "/shop/cat-mgmt" },
      { pgId: "AD-SHOP-03", label: "반품 배송비 정책 관리", path: "/shop/return-dlv-policy-mgmt" },
      { pgId: "AD-SHOP-04", label: "상품 관리 (대행)", path: "/shop/prod-mgmt-proxy" },
      { pgId: "AD-SHOP-05", label: "배송 관리 (대행)", path: "/shop/dlv-mgmt-proxy" },
    ],
  },
  {
    key: "settle",
    label: "결제·정산 관리",
    icon: Wallet,
    items: [
      { pgId: "AD-STL-02", label: "정산 기준 관리", path: "/settle/settle-rule-mgmt" },
      { pgId: "AD-STL-03", label: "수수료 관리", path: "/settle/fee-mgmt" },
      { pgId: "AD-STL-04", label: "정산 내역 조회", path: "/settle/settle-hist" },
      { pgId: "AD-STL-05", label: "매입 계산서 발행", path: "/settle/buy-invoice" },
      { pgId: "AD-STL-06", label: "매출 계산서 발행", path: "/settle/sales-invoice" },
    ],
  },
  {
    key: "point",
    label: "포인트·쿠폰 관리",
    icon: Coins,
    items: [
      { pgId: "AD-PNT-02", label: "포인트 상품 설정", path: "/point/pt-prod-cfg" },
      { pgId: "AD-PNT-03", label: "포인트 유효기간 설정", path: "/point/pt-valid-cfg" },
      { pgId: "AD-PNT-06", label: "포인트 내역 조회", path: "/point/pt-hist" },
      { pgId: "AD-PNT-07", label: "회원 등급 기준 설정", path: "/point/mbr-grade-rule-cfg" },
      { pgId: "AD-CPN-02", label: "쿠폰 발행", path: "/coupon/cpn" },
      { pgId: "AD-CPN-03", label: "쿠폰 내역 조회", path: "/coupon/cpn-hist" },
    ],
  },
  {
    key: "catalog",
    label: "시공상품 카탈로그",
    icon: BookOpen,
    items: [
      { pgId: "AD-CTLG-02", label: "차종 마스터", path: "/catalog/car-model-mst" },
      { pgId: "AD-CTLG-03", label: "시공항목 관리", path: "/catalog/cst-item-mgmt" },
      { pgId: "AD-CTLG-04", label: "브랜드 관리", path: "/catalog/brand-mgmt" },
      { pgId: "AD-CTLG-05", label: "상품 관리", path: "/catalog/prod-mgmt" },
      { pgId: "AD-CTLG-07", label: "상품 옵션 관리", path: "/catalog/prod-opt-mgmt" },
      { pgId: "AD-CTLG-08", label: "딜러사 매핑 관리", path: "/catalog/dealer-map-mgmt" },
      { pgId: "AD-CTLG-09", label: "차종 매핑 관리", path: "/catalog/car-model-map-mgmt" },
      { pgId: "AD-CTLG-10", label: "신차패키지 구성 관리", path: "/catalog/pkg-comp-mgmt" },
    ],
  },
  {
    key: "cs",
    label: "CS(고객센터) 관리",
    icon: Headset,
    items: [
      { pgId: "AD-CS-02", label: "1:1 문의 관리", path: "/cs/inquiry-mgmt" },
      { pgId: "AD-CS-03", label: "FAQ 관리", path: "/cs/faq-mgmt" },
      { pgId: "AD-NOTI-02", label: "후기 관리", path: "/review/review-mgmt" },
    ],
  },
  {
    key: "system",
    label: "시스템 설정",
    icon: Settings,
    items: [
      { pgId: "AD-SYS-03", label: "공통 코드 관리", path: "/system/common-code-mgmt" },
      { pgId: "AD-SYS-04", label: "사용자 계정 관리", path: "/system/user-acct-mgmt" },
      { pgId: "AD-SYS-05", label: "메뉴권한관리", path: "/system/menu-perm-mgmt" },
    ],
  },
];

// 로고 클릭·기본 탭(항상 열려있는 첫 탭)이 가리키는 목적지 — 대시보드 그룹의 첫 항목
export const DEFAULT_MENU_ITEM: MenuLeaf = MENU_GROUPS[0].items[0];

const ALL_MENU_ITEMS: MenuLeaf[] = MENU_GROUPS.flatMap((g) => g.items);

export function findMenuLabel(path: string): string {
  return ALL_MENU_ITEMS.find((m) => m.path === path)?.label ?? path;
}

/** breadcrumb용 — "HOME > 그룹 > 항목" */
export function findBreadcrumb(path: string): { groupLabel: string | null; itemLabel: string } {
  const group = MENU_GROUPS.find((g) => g.items.some((i) => i.path === path));
  const item = group?.items.find((i) => i.path === path);
  return { groupLabel: group?.label ?? null, itemLabel: item?.label ?? path };
}

/** URL 직접 접근 차단(AD-SYS-05)용 — 경로가 메뉴 트리에 속하면 해당 프로그램ID, 메뉴 트리 밖의 경로면 null */
export function findPgIdByPath(path: string): string | null {
  return ALL_MENU_ITEMS.find((m) => m.path === path)?.pgId ?? null;
}

// 로그인한 관리자의 권한그룹이 접근권한(canAccess)을 가진 메뉴만 남기고 사이드바 트리를 필터링(AD-SYS-05
// 메뉴권한관리와 연동). allowedPgIds가 null이면 필터링 없이 전체 노출(SUPER_ADMIN 등 항상 전체 접근 그룹 전용).
// 항목이 모두 걸러진 그룹은 사이드바에서 그룹 자체를 표시하지 않는다.
export function filterMenuGroups(allowedPgIds: Set<string> | null): MenuGroup[] {
  if (allowedPgIds === null) return MENU_GROUPS;
  return MENU_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => allowedPgIds.has(item.pgId)),
  })).filter((group) => group.items.length > 0);
}
