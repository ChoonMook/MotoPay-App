// 앱 진입점: 로그인 완료 전에는 AuthFlow, 완료 후에는 HomeScreen ↔ 내 업체 관리(BizFlow)를 전환 렌더링
import { useEffect, useState } from "react";
import AppShell from "./components/AppShell";
import AuthFlow from "./screens/auth/AuthFlow";
import HomeScreen from "./screens/home/HomeScreen";
import BizFlow from "./screens/biz/BizFlow";
import NcpkFlow from "./screens/ncpk/NcpkFlow";
import type { NcpkTab } from "./screens/ncpk/ncpkData";
import RsvcFlow from "./screens/rsvc/RsvcFlow";
import type { BidTab } from "./screens/rsvc/RsvcBidboxScreen";
import StlFlow from "./screens/stl/StlFlow";
import { setOnSessionExpired, getAccessToken, clearTokens } from "./api/tokenStorage";
import { getMe } from "./api/partnerAuth";
import type { TodayReservation } from "./api/reservations";
import { pushBackAction } from "./native/backHandler";

type View = "home" | "biz" | "ncpk" | "rsvc" | "stl";
type RsvcTarget = { screen: "bidbox"; tab: BidTab } | { screen: "waitlist" } | undefined;

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  // 자동로그인 체크 후 저장된 토큰이 있으면 세션 복원을 시도하는 동안만 true — 토큰이 없으면 처음부터 false라 로그인 화면이 바로 보임
  const [booting, setBooting] = useState(() => !!getAccessToken());
  const [view, setView] = useState<View>("home");
  const [ncpkTab, setNcpkTab] = useState<NcpkTab>("wait");
  const [rsvcTarget, setRsvcTarget] = useState<RsvcTarget>(undefined);
  // 홈 "오늘의 시공 일정" 카드에서 특정 예약을 바로 열 때만 값이 설정됨 — 그 외 진입 경로(바로가기·하단내비 등)는 항상 초기화
  const [ncpkTargetReservationNo, setNcpkTargetReservationNo] = useState<string | undefined>(undefined);
  const [rsvcTargetReservationNo, setRsvcTargetReservationNo] = useState<string | undefined>(undefined);

  const openNcpk = (tab: NcpkTab) => {
    setNcpkTab(tab);
    setNcpkTargetReservationNo(undefined);
    setView("ncpk");
  };
  const openRsvc = (target?: RsvcTarget) => {
    setRsvcTarget(target);
    setRsvcTargetReservationNo(undefined);
    setView("rsvc");
  };
  const openStl = () => setView("stl");

  // 홈 "오늘의 시공 일정" 카드 탭 — 예약유형(PKG/BID)에 따라 해당 시공관리 화면으로 이동해 그 건을 바로 연다
  const openTodayJob = (r: TodayReservation) => {
    if (r.reservationType === "PKG") {
      setNcpkTargetReservationNo(r.reservationNo);
      setView("ncpk");
    } else {
      setRsvcTarget({ screen: "waitlist" });
      setRsvcTargetReservationNo(r.reservationNo);
      setView("rsvc");
    }
  };

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

  // 하드웨어 백버튼 기본 동작: 홈이 아닌 탭(view)에서 뒤로가기를 누르면 홈으로 돌아감(각 Flow 내부의 화면 이동은
  // 그 Flow 자신의 useEffect가 더 안쪽 단계의 뒤로가기를 처리 — 스택 구조라 안쪽이 항상 먼저 소비됨)
  useEffect(() => {
    if (view === "home") return;
    return pushBackAction(() => setView("home"));
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

  if (loggedIn) {
    return (
      <AppShell>
        {view === "home" && (
          <HomeScreen
            onOpenMyPage={() => setView("biz")}
            onOpenNcpk={openNcpk}
            onOpenRsvc={openRsvc}
            onOpenStl={openStl}
            onOpenTodayJob={openTodayJob}
          />
        )}
        {view === "biz" && (
          <BizFlow
            onExit={() => setView("home")}
            onLogout={() => {
              setLoggedIn(false);
              setView("home");
            }}
            onOpenRsvc={() => openRsvc()}
            onOpenStl={openStl}
          />
        )}
        {view === "ncpk" && (
          <NcpkFlow onExit={() => setView("home")} initialTab={ncpkTab} initialReservationNo={ncpkTargetReservationNo} />
        )}
        {view === "rsvc" && (
          <RsvcFlow
            onExit={() => setView("home")}
            onOpenStl={openStl}
            onOpenMyPage={() => setView("biz")}
            initialScreen={rsvcTarget?.screen ?? "main"}
            initialBidTab={rsvcTarget?.screen === "bidbox" ? rsvcTarget.tab : undefined}
            initialReservationNo={rsvcTargetReservationNo}
          />
        )}
        {view === "stl" && (
          <StlFlow onExit={() => setView("home")} onOpenRsvc={() => openRsvc()} onOpenMyPage={() => setView("biz")} />
        )}
      </AppShell>
    );
  }

  return <AuthFlow onAuthComplete={() => setLoggedIn(true)} />;
}

export default App;
