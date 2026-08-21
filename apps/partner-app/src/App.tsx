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
import { isNativeBridgeAvailable, requestPushToken } from "./native/bridge";
import { registerPushToken } from "./api/pushToken";
import { getCommonCodeDetails } from "./api/commonCodes";

type View = "home" | "biz" | "ncpk" | "rsvc" | "stl";
type RsvcTarget = { screen: "bidbox"; tab: BidTab } | { screen: "waitlist" } | undefined;

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  // 자동로그인 체크 후 저장된 토큰이 있으면 세션 복원을 시도하는 동안만 true — 토큰이 없으면 처음부터 false라 로그인 화면이 바로 보임
  const [booting, setBooting] = useState(() => !!getAccessToken());
  const [view, setView] = useState<View>("home");
  const [bizEntryScreen, setBizEntryScreen] = useState<"main" | "notiInbox">("main");
  const [ncpkTab, setNcpkTab] = useState<NcpkTab>("wait");
  const [rsvcTarget, setRsvcTarget] = useState<RsvcTarget>(undefined);
  // 홈 "오늘의 시공 일정" 카드에서 특정 예약을 바로 열 때만 값이 설정됨 — 그 외 진입 경로(바로가기·하단내비 등)는 항상 초기화
  const [ncpkTargetReservationNo, setNcpkTargetReservationNo] = useState<string | undefined>(undefined);
  const [rsvcTargetReservationNo, setRsvcTargetReservationNo] = useState<string | undefined>(undefined);
  // 푸시 알림 탭(입찰안내/낙찰/미선정) — RsvcFlow의 입찰함(bidbox)에서 해당 요청 상세를 바로 연다
  const [rsvcTargetRequestNo, setRsvcTargetRequestNo] = useState<string | undefined>(undefined);

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
  const openBizAt = (screen: "main" | "notiInbox") => {
    setBizEntryScreen(screen);
    setView("biz");
  };

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

  // 푸시 타입(RSV_NEW 등) -> "view" 또는 "view/screen" 이동 경로. 공통코드(PUSH_MSG_TYPE.ref2)에서 조회 —
  // 문구처럼 소스 수정 없이 관리자 화면에서 바꿀 수 있음. 로드 전/미등록 타입 대비 기본값을 같이 둔다
  const DEFAULT_PUSH_ROUTES: Record<string, string> = {
    RSV_NEW: "ncpk",
    RSV_RESCHED_ACCEPTED: "ncpk",
    RSV_RESCHED_REJECTED: "ncpk",
    RSV_HANDOVER_CONFIRMED: "ncpk",
    BID_NEW: "bidbox/new",
    BID_SELECTED: "bidbox",
    BID_NOT_SELECTED: "bidbox",
  };
  const [pushRoutes, setPushRoutes] = useState<Record<string, string>>(DEFAULT_PUSH_ROUTES);

  useEffect(() => {
    getCommonCodeDetails("PUSH_MSG_TYPE")
      .then((rows) => {
        const map: Record<string, string> = { ...DEFAULT_PUSH_ROUTES };
        for (const row of rows) {
          if (row.ref2) map[row.detailCode] = row.ref2;
        }
        setPushRoutes(map);
      })
      .catch(() => {}); // 실패해도 기본값(DEFAULT_PUSH_ROUTES)으로 계속 동작
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 푸시 알림 탭(알림함 탭 포함) 공통 처리 — window.__motoHandlePushTap(네이티브 셸)과 NotiInboxScreen onOpenTarget이 공유
  const handlePushTarget = (type: string, data: Record<string, string> | null | undefined) => {
    // 신차패키지(PKG)·예약시공(BID) 중 어느 예약인지에 따라 Flow 자체가 갈리는 타입 — PKG일 때만 ref2(공통코드)로
    // 탭을 정하고(NcpkFlow는 reservationNo가 있으면 상태를 보고 스스로 화면을 고름), BID는 항상 시공 현황(waitlist)으로 보낸다
    if (type === "RSV_NEW" || type === "RSV_RESCHED_ACCEPTED" || type === "RSV_RESCHED_REJECTED" || type === "RSV_HANDOVER_CONFIRMED") {
      const reservationNo = data?.reservationNo;
      if (!reservationNo) return;
      if (data?.reservationType === "PKG") {
        const [, sub] = (pushRoutes[type] ?? DEFAULT_PUSH_ROUTES[type]).split("/");
        setNcpkTab((sub as NcpkTab) ?? "wait");
        setNcpkTargetReservationNo(reservationNo);
        setView("ncpk");
      } else {
        setRsvcTarget({ screen: "waitlist" });
        setRsvcTargetReservationNo(reservationNo);
        setView("rsvc");
      }
      return;
    }

    if (type === "BID_NEW" || type === "BID_SELECTED" || type === "BID_NOT_SELECTED") {
      const requestNo = data?.requestNo;
      if (!requestNo) return;
      const [, sub] = (pushRoutes[type] ?? DEFAULT_PUSH_ROUTES[type]).split("/");
      setRsvcTarget({ screen: "bidbox", tab: (sub as BidTab) ?? "new" });
      setRsvcTargetRequestNo(requestNo);
      setView("rsvc");
      return;
    }
    // 모르는 타입은 조용히 무시 — 알림함 읽음 처리는 이미 별도로 됨
  };

  useEffect(() => {
    window.__motoHandlePushTap = (payload) => handlePushTarget(payload.type, payload);
    return () => {
      window.__motoHandlePushTap = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pushRoutes]);

  // 로그인 상태가 확정될 때마다(로그인·세션 복원 공통) 이 기기의 푸시 토큰을 등록 —
  // 네이티브 앱(웹뷰 셸)이 아니거나 아직 푸시 설정 전이면 조용히 건너뜀
  useEffect(() => {
    if (!loggedIn || !isNativeBridgeAvailable()) return;
    requestPushToken()
      .then(({ expoPushToken, platform }) => registerPushToken(expoPushToken, platform))
      .catch(() => {});
  }, [loggedIn]);

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
            onOpenNotiInbox={() => openBizAt("notiInbox")}
          />
        )}
        {view === "biz" && (
          <BizFlow
            initialScreen={bizEntryScreen}
            onExit={() => {
              setBizEntryScreen("main");
              setView("home");
            }}
            onLogout={() => {
              setBizEntryScreen("main");
              setLoggedIn(false);
              setView("home");
            }}
            onOpenRsvc={() => openRsvc()}
            onOpenStl={openStl}
            onOpenTarget={handlePushTarget}
          />
        )}
        {view === "ncpk" && (
          <NcpkFlow onExit={() => setView("home")} initialTab={ncpkTab} initialReservationNo={ncpkTargetReservationNo} />
        )}
        {view === "rsvc" && (
          <RsvcFlow
            onExit={() => {
              setRsvcTargetRequestNo(undefined);
              setView("home");
            }}
            onOpenStl={openStl}
            onOpenMyPage={() => setView("biz")}
            initialScreen={rsvcTarget?.screen ?? "main"}
            initialBidTab={rsvcTarget?.screen === "bidbox" ? rsvcTarget.tab : undefined}
            initialReservationNo={rsvcTargetReservationNo}
            targetRequestNo={rsvcTargetRequestNo}
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
