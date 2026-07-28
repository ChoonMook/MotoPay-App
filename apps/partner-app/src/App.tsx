// 앱 진입점: 로그인 완료 전에는 AuthFlow, 완료 후에는 HomeScreen ↔ 내 업체 관리(BizFlow)를 전환 렌더링
import { useEffect, useState } from "react";
import AppShell from "./components/AppShell";
import AuthFlow from "./screens/auth/AuthFlow";
import HomeScreen from "./screens/home/HomeScreen";
import BizFlow from "./screens/biz/BizFlow";
import { setOnSessionExpired, getAccessToken, clearTokens } from "./api/tokenStorage";
import { getMe } from "./api/partnerAuth";

type View = "home" | "biz";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  // 자동로그인 체크 후 저장된 토큰이 있으면 세션 복원을 시도하는 동안만 true — 토큰이 없으면 처음부터 false라 로그인 화면이 바로 보임
  const [booting, setBooting] = useState(() => !!getAccessToken());
  const [view, setView] = useState<View>("home");

  // accessToken/refreshToken 둘 다 만료되면 http.ts가 이 콜백을 호출해 로그인 화면으로 돌려보냄
  useEffect(() => {
    setOnSessionExpired(() => {
      setLoggedIn(false);
      setView("home");
    });
    return () => setOnSessionExpired(null);
  }, []);

  // 저장된 토큰으로 세션 복원 시도 — accessToken이 만료됐어도 http.ts가 refreshToken으로 자동 재발급을 시도한 뒤 결과를 알려줌
  useEffect(() => {
    if (!booting) return;
    getMe()
      .then(() => setLoggedIn(true))
      .catch(() => clearTokens())
      .finally(() => setBooting(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (booting) {
    return (
      <AppShell>
        <div className="absolute inset-0 flex items-center justify-center bg-brand">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-white/35 border-t-white" />
        </div>
      </AppShell>
    );
  }

  if (loggedIn) {
    return (
      <AppShell>
        {view === "home" && <HomeScreen onOpenMyPage={() => setView("biz")} />}
        {view === "biz" && (
          <BizFlow
            onExit={() => setView("home")}
            onLogout={() => {
              setLoggedIn(false);
              setView("home");
            }}
          />
        )}
      </AppShell>
    );
  }

  return <AuthFlow onAuthComplete={() => setLoggedIn(true)} />;
}

export default App;
