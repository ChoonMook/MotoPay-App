// 사이드바 메뉴 트리(그룹/아이템/아이콘/경로) - uploads/MotoPay_메뉴구조도_v1_30.xlsx의 "관리자웹_사이트맵" 시트
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
// v1_30 변경분(2026-08-11): 신차패키지 관리의 패키지 상품 등록(AD-NCPK-02)·항목별 업그레이드 가능 품목 설정
// (AD-NCPK-03)·패키지 상품 목록(AD-NCPK-05)이 AD-CTLG-05(상품 관리)·AD-CTLG-10(신차패키지 구성 관리)과 기능이
// 중복돼 독립 URL을 잃고("-") 사이트맵상 독립 목적지가 아니게 됨.
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
    // 패키지 상품 등록(AD-NCPK-02)·항목별 업그레이드 가능 품목 설정(AD-NCPK-03)·패키지 상품 목록(AD-NCPK-05)은
    // AD-CTLG-05(상품 관리)·AD-CTLG-10(신차패키지 구성 관리)과 기능이 중복돼 제외(2026-08-11 논의).
    // DL-NCPK-01(신차 구매내역 입력, 원래 딜러사웹_프로그램 시트 소속)은 딜러 직원도 시공업체 직원과 동일하게
    // AdminAccount(accountType=DEALER)로 admin-app에 로그인한다는 점에 착안해 이 그룹으로 편입(2026-08-11 확정).
    items: [
      { pgId: "AD-CTLG-08", label: "딜러사 매핑 관리", path: "/catalog/dealer-map-mgmt" },
      { pgId: "AD-CTLG-09", label: "차종 매핑 관리", path: "/catalog/car-model-map-mgmt" },
      { pgId: "AD-NCPK-04", label: "딜러사-시공업체 매핑", path: "/ncp/dealer-ptn-map" },
      { pgId: "AD-CTLG-10", label: "신차패키지 구성 관리", path: "/catalog/pkg-comp-mgmt" },
      { pgId: "DL-NCPK-01", label: "신차 구매내역", path: "/ncp/purchase" },
      // AD-NCPK-06(발급 현황) 메뉴 제거 — 미구현 플레이스홀더였음(2026-08-16 사용자 확정)
    ],
  },
  {
    key: "rsvc",
    label: "예약시공 관리",
    icon: CalendarClock,
    items: [
      // 신차패키지 시공현황 신규 추가 — pgId는 신차패키지 관리에 이미 AD-NCPK-05가 배정돼 있어(패키지 상품
      // 목록, 미사용) 다음 빈 번호(AD-NCPK-07)로 채번, 메뉴 위치는 예약시공현황과 성격이 같아 이 그룹에 배치
      // (2026-08-18 사용자 확정). 메뉴 순서는 신차패키지 시공현황 -> 예약시공현황(2026-08-18 사용자 확정)
      { pgId: "AD-NCPK-07", label: "신차패키지 시공현황", path: "/rsv/ncpk-stat" },
      // AD-RSVC-02(입찰 현황 모니터링)·AD-RSVC-03(추천형 입찰 현황)을 하나로 통합(2026-08-16 사용자 확정)
      { pgId: "AD-RSVC-02", label: "예약시공현황", path: "/rsv/rsv-stat" },
      // AD-RSVC-04(입찰 마감시간 설정) 메뉴 제거 — 값 목록이 아니라 숫자 하나(BID_DEADLINE_DAYS)라 전용 화면 없이
      // apps/api/src/bid-requests/bid-requests.service.ts의 코드 상수로 계속 관리(2026-08-16 사용자 확정)
      // AD-RSVC-05(시공일시 변경 (관리자)) 메뉴도 제거 — 미구현 플레이스홀더였음(2026-08-16 사용자 확정)
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
      // AD-PNT-02(포인트 상품 설정) 메뉴 제거 — customer-app 포인트 충전은 "추가 적립 없이 충전액 그대로
      // 1P=1원" 정책이라(PtChargeAmtSelScreen.tsx 안내문구) 추가지급비율을 설정할 대상 자체가 없음(2026-08-18 사용자 확정)
      // AD-PNT-03(포인트 유효기간 설정) 메뉴도 제거 — 값 목록이 아니라 스칼라 값 2개(유효기간 년수·만료임박
      // 알림 시점)뿐이고, 포인트 적립/소멸 백엔드 로직 자체가 아직 없어 지금은 읽어갈 곳도 없음. BID_DEADLINE_DAYS와
      // 동일하게, 실제로 포인트 소멸 로직을 구현할 때 전용 화면 없이 코드 상수로 관리(2026-08-18 사용자 확정)
      { pgId: "AD-PNT-06", label: "포인트 내역 조회", path: "/point/pt-hist" },
      { pgId: "AD-PNT-07", label: "회원 등급 기준 설정", path: "/point/mbr-grade-rule-cfg" },
      // AD-CPN-02(쿠폰 발행) 메뉴 제거 — 포인트 강제 부여/차감과 동일하게 팝업 액션으로 전환해 아래
      // 쿠폰 발행 내역(AD-CPN-03) 화면 상단 버튼으로 이동(2026-08-18 사용자 확정)
      { pgId: "AD-CPN-03", label: "쿠폰 발행 내역", path: "/coupon/cpn-hist" },
    ],
  },
  {
    key: "catalog",
    label: "기준정보",
    icon: BookOpen,
    items: [
      { pgId: "AD-CTLG-02", label: "차종 마스터", path: "/catalog/car-model-mst" },
      { pgId: "AD-CTLG-03", label: "시공항목 관리", path: "/catalog/cst-item-mgmt" },
      { pgId: "AD-CTLG-04", label: "브랜드 관리", path: "/catalog/brand-mgmt" },
      { pgId: "AD-CTLG-05", label: "상품 관리", path: "/catalog/prod-mgmt" },
      { pgId: "AD-CTLG-07", label: "상품 옵션 관리", path: "/catalog/prod-opt-mgmt" },
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
      // AD-CS-04(푸시 발송) 신규 추가 — 원본 사이트맵엔 없던 화면, 회원/시공업체 사용자 대상 임의 공지 푸시
      // 발송 + 발송이력 조회(2026-08-20 사용자 확정)
      { pgId: "AD-CS-04", label: "푸시 발송", path: "/cs/push-broadcast" },
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
      // AD-SYS-06(앱버전관리) 신규 추가 — 원본 사이트맵엔 없던 화면, motopay-mobile 강제 업데이트 정책 관리(2026-08-21 사용자 확정)
      { pgId: "AD-SYS-06", label: "앱버전관리", path: "/system/app-version-mgmt" },
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
