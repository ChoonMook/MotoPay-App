// 라우팅 루트 - /login과 그 외 경로를 분리하고, ?frame=Y 여부에 따라 "콘텐츠만" 또는 "쉘+MDI 탭"을 렌더링한다.
// 원본 Site.Master의 IsFrame 분기(호스트 페이지는 빈 컨테이너만 그리고, JS가 그 안에 자기 자신을
// frame=Y로 다시 불러오는 iframe을 채워넣는 구조)를 React Router로 재현
import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Routes, Route, useLocation, useSearchParams } from "react-router-dom";
import { getMe, type AdminAccount } from "./api/adminAuth";
import { listMenuPermissions } from "./api/menuPermissions";
import { clearTokens, getAccessToken } from "./api/tokenStorage";
import AdminShell from "./components/AdminShell";
import { DEFAULT_MENU_ITEM, findPgIdByPath } from "./lib/menuConfig";
import AccessDeniedPage from "./pages/AccessDeniedPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import BrandMgmtPage from "./pages/catalog/BrandMgmtPage";
import CarModelMstPage from "./pages/catalog/CarModelMstPage";
import CstItemMgmtPage from "./pages/catalog/CstItemMgmtPage";
import CarModelMapMgmtPage from "./pages/catalog/CarModelMapMgmtPage";
import DealerMapMgmtPage from "./pages/catalog/DealerMapMgmtPage";
import PkgCompMgmtPage from "./pages/catalog/PkgCompMgmtPage";
import ProdOptMgmtPage from "./pages/catalog/ProdOptMgmtPage";
import ProductMgmtPage from "./pages/catalog/ProductMgmtPage";
import CoListPage from "./pages/company/CoListPage";
import CustMbrListPage from "./pages/member/CustMbrListPage";
import DealerPtnMapPage from "./pages/ncp/DealerPtnMapPage";
import NewCarPurchaseInputPage from "./pages/ncp/NewCarPurchaseInputPage";
import CpnHistPage from "./pages/coupon/CpnHistPage";
import GradeRuleSetPage from "./pages/point/GradeRuleSetPage";
import PtHistPage from "./pages/point/PtHistPage";
import NcpkStatPage from "./pages/rsv/NcpkStatPage";
import RsvStatPage from "./pages/rsv/RsvStatPage";
import InquiryMgmtPage from "./pages/cs/InquiryMgmtPage";
import FaqMgmtPage from "./pages/cs/FaqMgmtPage";
import PushBroadcastPage from "./pages/cs/PushBroadcastPage";
import ReviewMgmtPage from "./pages/review/ReviewMgmtPage";
import AppVersionMgmtPage from "./pages/system/AppVersionMgmtPage";
import CommonCodeMgmtPage from "./pages/system/CommonCodeMgmtPage";
import MenuPermMgmtPage from "./pages/system/MenuPermMgmtPage";
import UserAcctMgmtPage from "./pages/system/UserAcctMgmtPage";

function ContentSwitch({ path }: { path: string }) {
  if (path === "/main/dash") return <DashboardPage />;
  if (path === "/member/cust-mbr-list") return <CustMbrListPage />;
  if (path === "/company/co-list") return <CoListPage />;
  if (path === "/system/user-acct-mgmt") return <UserAcctMgmtPage />;
  if (path === "/system/common-code-mgmt") return <CommonCodeMgmtPage />;
  if (path === "/system/menu-perm-mgmt") return <MenuPermMgmtPage />;
  if (path === "/system/app-version-mgmt") return <AppVersionMgmtPage />;
  if (path === "/catalog/car-model-mst") return <CarModelMstPage />;
  if (path === "/catalog/cst-item-mgmt") return <CstItemMgmtPage />;
  if (path === "/catalog/brand-mgmt") return <BrandMgmtPage />;
  if (path === "/catalog/prod-mgmt") return <ProductMgmtPage />;
  if (path === "/catalog/prod-opt-mgmt") return <ProdOptMgmtPage />;
  if (path === "/catalog/dealer-map-mgmt") return <DealerMapMgmtPage />;
  if (path === "/catalog/car-model-map-mgmt") return <CarModelMapMgmtPage />;
  if (path === "/catalog/pkg-comp-mgmt") return <PkgCompMgmtPage />;
  if (path === "/ncp/dealer-ptn-map") return <DealerPtnMapPage />;
  if (path === "/ncp/purchase") return <NewCarPurchaseInputPage />;
  if (path === "/rsv/rsv-stat") return <RsvStatPage />;
  if (path === "/rsv/ncpk-stat") return <NcpkStatPage />;
  if (path === "/point/pt-hist") return <PtHistPage />;
  if (path === "/point/mbr-grade-rule-cfg") return <GradeRuleSetPage />;
  if (path === "/coupon/cpn-hist") return <CpnHistPage />;
  if (path === "/cs/inquiry-mgmt") return <InquiryMgmtPage />;
  if (path === "/cs/faq-mgmt") return <FaqMgmtPage />;
  if (path === "/cs/push-broadcast") return <PushBroadcastPage />;
  if (path === "/review/review-mgmt") return <ReviewMgmtPage />;
  return <PlaceholderPage path={path} />;
}

function BootingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-surface">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-outline-variant border-t-primary" />
    </div>
  );
}

function RootGate() {
  const location = useLocation();
  const [params] = useSearchParams();
  const [adminAccount, setAdminAccount] = useState<AdminAccount | null>(null);
  // 로그인한 관리자의 권한그룹이 접근 가능한 메뉴 프로그램ID 집합(AD-SYS-05 메뉴권한관리 연동) — null이면
  // 필터링 없이 전체 메뉴 노출(SUPER_ADMIN은 메뉴권한 매트릭스가 비어 있어도 잠기지 않도록 항상 전체 노출)
  const [allowedMenuPgIds, setAllowedMenuPgIds] = useState<Set<string> | null>(null);
  // 저장된 토큰이 있을 때만 세션 복원(/admin-auth/me)을 시도 — 없으면 처음부터 로그인 화면을 바로 보여준다
  const [booting, setBooting] = useState(() => !!getAccessToken());

  useEffect(() => {
    if (!booting) return;
    getMe()
      .then(async (account) => {
        setAdminAccount(account);
        if (account.permGroup === "SUPER_ADMIN") {
          setAllowedMenuPgIds(null);
          return;
        }
        try {
          const rows = await listMenuPermissions(account.permGroup);
          setAllowedMenuPgIds(new Set(rows.filter((r) => r.canAccess).map((r) => r.menuPgId)));
        } catch {
          // 메뉴 권한 조회 실패 시 로그인 자체를 막지는 않되, 안전하게 메뉴를 전부 비노출 처리
          setAllowedMenuPgIds(new Set());
        }
      })
      .catch(() => clearTokens())
      .finally(() => setBooting(false));
  }, [booting]);

  const isFrame = params.get("frame") === "Y";

  if (booting) {
    return isFrame ? null : <BootingScreen />;
  }

  if (isFrame) {
    // 로그인 세션이 없는 상태(예: 별도 탭에 frame=Y URL을 직접 열어 sessionStorage 토큰이 없는 경우)로
    // 콘텐츠에 접근하면 리다이렉트 없이 안내만 표시 — 어차피 로그인 없이는 기본 화면도 열람 불가
    if (!adminAccount) {
      return <AccessDeniedPage message="로그인이 필요합니다." redirectToHome={false} />;
    }
    const pgId = findPgIdByPath(location.pathname);
    const allowed = pgId === null || allowedMenuPgIds === null || allowedMenuPgIds.has(pgId);
    if (!allowed) {
      return <AccessDeniedPage redirectToHome={location.pathname !== DEFAULT_MENU_ITEM.path} />;
    }
    return <ContentSwitch path={location.pathname} />;
  }

  if (!adminAccount) {
    return <Navigate to="/login" replace />;
  }
  if (location.pathname === "/") {
    return <Navigate to="/main/dash" replace />;
  }
  return <AdminShell adminAccount={adminAccount} onAdminAccountChange={setAdminAccount} allowedMenuPgIds={allowedMenuPgIds} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<RootGate />} />
      </Routes>
    </BrowserRouter>
  );
}
