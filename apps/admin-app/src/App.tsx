// 라우팅 루트 - /login과 그 외 경로를 분리하고, ?frame=Y 여부에 따라 "콘텐츠만" 또는 "쉘+MDI 탭"을 렌더링한다.
// 원본 Site.Master의 IsFrame 분기(호스트 페이지는 빈 컨테이너만 그리고, JS가 그 안에 자기 자신을
// frame=Y로 다시 불러오는 iframe을 채워넣는 구조)를 React Router로 재현
import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Routes, Route, useLocation, useSearchParams } from "react-router-dom";
import { getMe, type AdminAccount } from "./api/adminAuth";
import { clearTokens, getAccessToken } from "./api/tokenStorage";
import AdminShell from "./components/AdminShell";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import CommonCodeMgmtPage from "./pages/system/CommonCodeMgmtPage";
import UserAcctMgmtPage from "./pages/system/UserAcctMgmtPage";

function ContentSwitch({ path }: { path: string }) {
  if (path === "/main/dash") return <DashboardPage />;
  if (path === "/system/user-acct-mgmt") return <UserAcctMgmtPage />;
  if (path === "/system/common-code-mgmt") return <CommonCodeMgmtPage />;
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
  // 저장된 토큰이 있을 때만 세션 복원(/admin-auth/me)을 시도 — 없으면 처음부터 로그인 화면을 바로 보여준다
  const [booting, setBooting] = useState(() => !!getAccessToken());

  useEffect(() => {
    if (!booting) return;
    getMe()
      .then(setAdminAccount)
      .catch(() => clearTokens())
      .finally(() => setBooting(false));
  }, [booting]);

  if (params.get("frame") === "Y") {
    return <ContentSwitch path={location.pathname} />;
  }
  if (booting) {
    return <BootingScreen />;
  }
  if (!adminAccount) {
    return <Navigate to="/login" replace />;
  }
  if (location.pathname === "/") {
    return <Navigate to="/main/dash" replace />;
  }
  return <AdminShell displayName={adminAccount.name} />;
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
