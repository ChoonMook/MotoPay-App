// 앱 진입점: 로그인 완료 전에는 AuthFlow, 완료 후에는 HomeScreen ↔ 내 업체 관리(BizFlow)를 전환 렌더링
import { useState } from "react";
import AppShell from "./components/AppShell";
import AuthFlow from "./screens/auth/AuthFlow";
import HomeScreen from "./screens/home/HomeScreen";
import BizFlow from "./screens/biz/BizFlow";

type View = "home" | "biz";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [view, setView] = useState<View>("home");

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
