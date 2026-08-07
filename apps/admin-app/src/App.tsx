// 라우팅 루트 - /login과 그 외 경로를 분리하고, ?frame=Y 여부에 따라 "콘텐츠만" 또는 "쉘+MDI 탭"을 렌더링한다.
// 원본 Site.Master의 IsFrame 분기(호스트 페이지는 빈 컨테이너만 그리고, JS가 그 안에 자기 자신을
// frame=Y로 다시 불러오는 iframe을 채워넣는 구조)를 React Router로 재현
import { BrowserRouter, Navigate, Routes, Route, useLocation, useSearchParams } from "react-router-dom";
import { getSession } from "./lib/mockAuth";
import AdminShell from "./components/AdminShell";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import UserAcctMgmtPage from "./pages/system/UserAcctMgmtPage";

function ContentSwitch({ path }: { path: string }) {
  if (path === "/main/dash") return <DashboardPage />;
  if (path === "/system/user-acct-mgmt") return <UserAcctMgmtPage />;
  return <PlaceholderPage path={path} />;
}

function RootGate() {
  const location = useLocation();
  const [params] = useSearchParams();

  if (params.get("frame") === "Y") {
    return <ContentSwitch path={location.pathname} />;
  }
  if (!getSession()) {
    return <Navigate to="/login" replace />;
  }
  if (location.pathname === "/") {
    return <Navigate to="/main/dash" replace />;
  }
  return <AdminShell />;
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
