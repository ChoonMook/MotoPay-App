// 앱 진입점: 로그인/회원가입 완료 전에는 AuthFlow, 완료 후에는 HomeScreen ↔ 신차패키지(NcpkFlow)를 전환 렌더링
import { useEffect, useState } from "react";
import AppShell from "./components/AppShell";
import { pushBackAction } from "./native/backHandler";
import { clearTokens, getAccessToken, setOnSessionExpired } from "./api/tokenStorage";
import { isNativeBridgeAvailable, requestPushToken } from "./native/bridge";
import { registerPushToken, unregisterPushToken } from "./api/pushToken";
import AuthFlow from "./screens/auth/AuthFlow";
import { getMe, type LoginUser } from "./api/auth";
import { getCommonCodeDetails } from "./api/commonCodes";
import HomeScreen from "./screens/home/HomeScreen";
import NcpkFlow from "./screens/ncp/NcpkFlow";
import RsvFlow from "./screens/rsv/RsvFlow";
import PointFlow from "./screens/point/PointFlow";
import ShopFlow from "./screens/shop/ShopFlow";
import MypFlow from "./screens/myp/MypFlow";
import CsFlow from "./screens/cs/CsFlow";
import type { NcpScreen } from "./screens/ncp/ncpTypes";
import type { MypScreenId } from "./screens/myp/mypTypes";
import type { ReqStatusFilter } from "./screens/rsv/BookingScreen";

type View = "home" | "ncpk" | "rsv" | "point" | "shop" | "myp" | "cs";

function App() {
  const [user, setUser] = useState<LoginUser | null>(null);
  // 자동로그인 체크 후 저장된 토큰이 있으면 세션 복원을 시도하는 동안만 true — 토큰이 없으면 처음부터 false라 로그인 화면이 바로 보임
  const [booting, setBooting] = useState(() => !!getAccessToken());
  const [view, setView] = useState<View>("home");
  const [ncpkEntryScreen, setNcpkEntryScreen] = useState<NcpScreen>("main");
  // 홈 화면의 "신차패키지 진행중 예약" 카드에서 어떤 예약을 탭했는지 — bookingdtl/handover 진입 시 NcpkFlow가
  // 자체적으로 "가장 최근 예약"을 추측하지 않고 정확히 이 예약을 보여주도록 함(추측 로직은 여러 건 예약 시 다른
  // 화면과 서로 다른 건을 골라 정보가 어긋나는 문제가 있었음)
  const [ncpkTargetReservationNo, setNcpkTargetReservationNo] = useState<string | undefined>(undefined);
  const [mypEntryScreen, setMypEntryScreen] = useState<MypScreenId>("main");
  const [rsvEntryFilter, setRsvEntryFilter] = useState<ReqStatusFilter>("ALL");
  // 푸시 알림 탭(예약시공/BID) — 위 ncpkTargetReservationNo와 동일한 목적, RsvFlow.openMyRequest가 자체적으로
  // 상태(완료/진행중 등)를 보고 화면을 고르므로 여기선 requestNo만 전달하면 됨
  const [rsvTargetRequestNo, setRsvTargetRequestNo] = useState<string | undefined>(undefined);

  // 푸시 타입(RSV_CONFIRMED 등) -> "view" 또는 "view/screen" 이동 경로. 공통코드(PUSH_MSG_TYPE.ref2)에서
  // 조회 — 문구처럼 소스 수정 없이 관리자 화면에서 바꿀 수 있음. 로드 전/미등록 타입 대비 기본값을 같이 둔다
  const DEFAULT_PUSH_ROUTES: Record<string, string> = {
    RSV_CONFIRMED: "ncpk/bookingdtl",
    RSV_RESCHED_REQUESTED: "ncpk/bookingdtl",
    RSV_COMPLETED: "ncpk/handover",
    NCPK_MAPPED: "ncpk",
    POINT_GRANTED: "point",
    COUPON_ISSUED: "myp/couponbox",
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

  // "view" 또는 "view/screen" 경로 문자열을 실제 네비게이션으로 적용 — 예약 관련 타입 이외의 단순 이동에 사용
  const applyRoute = (route: string) => {
    const [v, sub] = route.split("/");
    switch (v) {
      case "ncpk":
        setNcpkTargetReservationNo(undefined);
        setNcpkEntryScreen((sub as NcpScreen) ?? "main");
        setView("ncpk");
        break;
      case "myp":
        openMyPageAt((sub as MypScreenId) ?? "main");
        break;
      case "point":
        setView("point");
        break;
      default:
        break;
    }
  };

  // 푸시 알림 탭(알림함 탭 포함) 공통 처리 — window.__motoHandlePushTap(네이티브 셸)과 NotiInboxScreen onOpenTarget이 공유
  const handlePushTarget = (type: string, data: Record<string, string> | null | undefined) => {
    // 신차패키지(PKG)·예약시공(BID) 중 어느 예약인지에 따라 Flow 자체가 갈리는 타입 — PKG일 때만 ref2(공통코드)로
    // 화면을 정하고, BID는 RsvFlow.openMyRequest가 예약 상태를 보고 스스로 화면을 고르므로 requestNo만 넘긴다
    if (type === "RSV_CONFIRMED" || type === "RSV_COMPLETED" || type === "RSV_RESCHED_REQUESTED") {
      const reservationNo = data?.reservationNo;
      const requestNo = data?.requestNo;
      if (data?.reservationType === "BID" && requestNo) {
        setRsvTargetRequestNo(requestNo);
        setView("rsv");
      } else if (reservationNo) {
        const [, sub] = (pushRoutes[type] ?? DEFAULT_PUSH_ROUTES[type]).split("/");
        setNcpkTargetReservationNo(reservationNo);
        setNcpkEntryScreen((sub as NcpScreen) ?? "bookingdtl");
        setView("ncpk");
      }
      return;
    }

    const route = pushRoutes[type];
    if (route) applyRoute(route);
    // 모르는 타입은 조용히 무시 — 알림함 읽음 처리는 이미 별도로 됨
  };

  useEffect(() => {
    window.__motoHandlePushTap = (payload) => handlePushTarget(payload.type, payload);
    return () => {
      window.__motoHandlePushTap = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pushRoutes]);

  // accessToken/refreshToken 둘 다 만료되면 http.ts가 이 콜백을 호출해 로그인 화면으로 돌려보냄
  useEffect(() => {
    setOnSessionExpired(() => {
      setUser(null);
      setView("home");
    });
    return () => setOnSessionExpired(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 저장된 토큰으로 세션 복원 시도 — accessToken이 만료됐어도 http.ts가 refreshToken으로 자동 재발급을 시도한 뒤 결과를 알려줌
  useEffect(() => {
    if (!booting) return;
    getMe()
      .then(setUser)
      .catch(() => clearTokens())
      .finally(() => setBooting(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 로그인 상태가 확정될 때마다(신규 로그인·회원가입·세션 복원 공통) 이 기기의 푸시 토큰을 등록 —
  // 네이티브 앱(웹뷰 셸)이 아니거나 아직 푸시 설정 전이면 조용히 건너뜀
  useEffect(() => {
    if (!user || !isNativeBridgeAvailable()) return;
    requestPushToken()
      .then(({ expoPushToken, platform }) => registerPushToken(expoPushToken, platform))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const openMyPageAt = (screen: MypScreenId) => {
    setMypEntryScreen(screen);
    setView("myp");
  };
  const openMyPage = () => openMyPageAt("main");

  const openRsv = (filter: ReqStatusFilter = "ALL") => {
    setRsvEntryFilter(filter);
    setView("rsv");
  };

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
            onOpenNcpkHandover={(reservationNo) => {
              setNcpkTargetReservationNo(reservationNo);
              setNcpkEntryScreen("handover");
              setView("ncpk");
            }}
            onOpenNcpkBookingDtl={(reservationNo) => {
              setNcpkTargetReservationNo(reservationNo);
              setNcpkEntryScreen("bookingdtl");
              setView("ncpk");
            }}
            onOpenRsv={openRsv}
            onOpenPoint={() => setView("point")}
            onOpenShop={() => setView("shop")}
            onOpenMyPage={openMyPage}
            onOpenCouponBox={() => openMyPageAt("couponbox")}
            onOpenOrderHist={() => openMyPageAt("shophist")}
            onOpenCs={() => setView("cs")}
            onOpenNotiInbox={() => openMyPageAt("notis")}
          />
        )}
        {view === "ncpk" && (
          <NcpkFlow
            initialScreen={ncpkEntryScreen}
            targetReservationNo={ncpkTargetReservationNo}
            onExit={() => {
              setNcpkTargetReservationNo(undefined);
              setView("home");
            }}
          />
        )}
        {view === "rsv" && (
          <RsvFlow
            initialFilter={rsvEntryFilter}
            targetRequestNo={rsvTargetRequestNo}
            onExit={() => {
              setRsvTargetRequestNo(undefined);
              setView("home");
            }}
            onOpenShop={() => setView("shop")}
            onOpenMyPage={openMyPage}
          />
        )}
        {view === "point" && <PointFlow onExit={() => setView("home")} onOpenShop={() => setView("shop")} />}
        {view === "shop" && (
          <ShopFlow
            onExit={() => setView("home")}
            onOpenMyPage={openMyPage}
            onOpenRsv={openRsv}
            onCancelReturnSubmitted={() => openMyPageAt("cancelhist")}
          />
        )}
        {view === "myp" && (
          <MypFlow
            user={user}
            initialScreen={mypEntryScreen}
            onExit={() => setView("home")}
            onOpenShop={() => setView("shop")}
            onOpenRsv={openRsv}
            onOpenCs={() => setView("cs")}
            onUpdateUser={setUser}
            onOpenTarget={handlePushTarget}
            onLogout={async () => {
              // 토큰을 지우기 전에(그래야 인증된 상태로 해제 요청을 보낼 수 있음) 먼저 이 기기의 푸시 토큰을 해제
              if (isNativeBridgeAvailable()) {
                try {
                  const { expoPushToken } = await requestPushToken();
                  await unregisterPushToken(expoPushToken);
                } catch {
                  // 무시 — 로그아웃 자체는 계속 진행
                }
              }
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
