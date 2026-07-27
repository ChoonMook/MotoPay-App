// 앱 진입점: 로그인/회원가입 완료 전에는 AuthFlow, 완료 후에는 HomeScreen ↔ 신차패키지(NcpkFlow)를 전환 렌더링
import { useEffect, useState } from "react";
import AppShell from "./components/AppShell";
import { pushBackAction } from "./native/backHandler";
import { clearTokens, getAccessToken } from "./api/tokenStorage";
import AuthFlow from "./screens/auth/AuthFlow";
import { getMe, type LoginUser } from "./api/auth";
import HomeScreen from "./screens/home/HomeScreen";
import NcpkFlow from "./screens/ncp/NcpkFlow";
import RsvFlow from "./screens/rsv/RsvFlow";
import PointFlow from "./screens/point/PointFlow";
import ShopFlow from "./screens/shop/ShopFlow";
import MypFlow from "./screens/myp/MypFlow";
import CsFlow from "./screens/cs/CsFlow";
import type { NcpScreen } from "./screens/ncp/ncpTypes";
import type { MypScreenId } from "./screens/myp/mypTypes";

type View = "home" | "ncpk" | "rsv" | "point" | "shop" | "myp" | "cs";

function App() {
  const [user, setUser] = useState<LoginUser | null>(null);
  // 자동로그인 체크 후 저장된 토큰이 있으면 세션 복원을 시도하는 동안만 true — 토큰이 없으면 처음부터 false라 로그인 화면이 바로 보임
  const [booting, setBooting] = useState(() => !!getAccessToken());
  const [view, setView] = useState<View>("home");
  const [ncpkEntryScreen, setNcpkEntryScreen] = useState<NcpScreen>("main");
  const [mypEntryScreen, setMypEntryScreen] = useState<MypScreenId>("main");

  useEffect(() => {
    if (!booting) return;
    getMe()
      .then(setUser)
      .catch(() => clearTokens())
      .finally(() => setBooting(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openMyPageAt = (screen: MypScreenId) => {
    setMypEntryScreen(screen);
    setView("myp");
  };
  const openMyPage = () => openMyPageAt("main");

  // 하드웨어 백버튼 기본 동작: 각 탭(view)의 루트 화면에서 뒤로가기를 누르면 그 화면의 "나가기" 대상과 동일한 곳으로 이동
  // (CsFlow만 myp로 돌아가고 나머지는 home으로 돌아가는 것도 아래 JSX의 onExit과 동일하게 맞춤)
  useEffect(() => {
    if (view === "home") return;
    const target = view === "cs" ? "myp" : "home";
    return pushBackAction(() => setView(target));
  }, [view]);

  if (booting) {
    return (
      <AppShell>
        <div className="absolute inset-0 flex items-center justify-center bg-brand">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-white/35 border-t-white" />
        </div>
      </AppShell>
    );
  }

  if (user) {
    return (
      <AppShell>
        {view === "home" && (
          <HomeScreen
            name={user.name}
            onOpenNcpk={() => {
              setNcpkEntryScreen("main");
              setView("ncpk");
            }}
            onOpenNcpkHandover={() => {
              setNcpkEntryScreen("handover");
              setView("ncpk");
            }}
            onOpenNcpkBookingDtl={() => {
              setNcpkEntryScreen("bookingdtl");
              setView("ncpk");
            }}
            onOpenRsv={() => setView("rsv")}
            onOpenPoint={() => setView("point")}
            onOpenShop={() => setView("shop")}
            onOpenMyPage={openMyPage}
            onOpenCouponBox={() => openMyPageAt("couponbox")}
            onOpenOrderHist={() => openMyPageAt("shophist")}
            onOpenCs={() => setView("cs")}
          />
        )}
        {view === "ncpk" && <NcpkFlow initialScreen={ncpkEntryScreen} onExit={() => setView("home")} />}
        {view === "rsv" && <RsvFlow onExit={() => setView("home")} onOpenShop={() => setView("shop")} onOpenMyPage={openMyPage} />}
        {view === "point" && <PointFlow onExit={() => setView("home")} onOpenShop={() => setView("shop")} />}
        {view === "shop" && (
          <ShopFlow
            onExit={() => setView("home")}
            onOpenMyPage={openMyPage}
            onOpenRsv={() => setView("rsv")}
            onCancelReturnSubmitted={() => openMyPageAt("cancelhist")}
          />
        )}
        {view === "myp" && (
          <MypFlow
            user={user}
            initialScreen={mypEntryScreen}
            onExit={() => setView("home")}
            onOpenShop={() => setView("shop")}
            onOpenRsv={() => setView("rsv")}
            onOpenCs={() => setView("cs")}
            onUpdateUser={setUser}
            onLogout={() => {
              clearTokens();
              setUser(null);
              setView("home");
            }}
          />
        )}
        {view === "cs" && <CsFlow onExit={() => setView("myp")} />}
      </AppShell>
    );
  }

  return <AuthFlow onAuthComplete={setUser} />;
}

export default App;
