// 내 업체 관리 PT-PROF-01(메인)~07(비밀번호 변경)를 엮는 상태 컨테이너
import { useEffect, useState } from "react";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../components/ui/useToast";
import { pushBackAction } from "../../native/backHandler";
import { clearTokens } from "../../api/tokenStorage";
import { getMyShop, type MyShop } from "../../api/shops";
import { listMyNotifications, markNotificationRead, type NotificationApi } from "../../api/notifications";
import { isNativeBridgeAvailable, requestPushToken } from "../../native/bridge";
import { unregisterPushToken } from "../../api/pushToken";
import BizMainScreen from "./BizMainScreen";
import BizBasicInfoScreen from "./BizBasicInfoScreen";
import BizHolidayScreen from "./BizHolidayScreen";
import BizAvailTimeScreen from "./BizAvailTimeScreen";
import BizRsvStatScreen from "./BizRsvStatScreen";
import BizPwdChangeScreen from "./BizPwdChangeScreen";
import NotiInboxScreen from "./NotiInboxScreen";
import LogoutConfirmModal from "./LogoutConfirmModal";

type Screen = "main" | "basicInfo" | "holiday" | "availtime" | "rsvstat" | "pwdChange" | "notiInbox";

interface BizFlowProps {
  onExit: () => void;
  onLogout: () => void;
  onOpenRsvc: () => void;
  onOpenStl: () => void;
  initialScreen?: Screen;
}

export default function BizFlow({ onExit, onLogout, onOpenRsvc, onOpenStl, initialScreen = "main" }: BizFlowProps) {
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [shop, setShop] = useState<MyShop | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notifications, setNotifications] = useState<NotificationApi[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const { toast, showToast } = useToast();

  useEffect(() => {
    getMyShop()
      .then(setShop)
      .catch((err) => showToast(err instanceof Error ? err.message : "업체 정보를 불러오지 못했어요", "danger"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 알림함 진입할 때마다 재조회 — 이전 진입 때 목록이 그대로 남아있지 않도록
  const loadNotifications = () => {
    setNotificationsLoading(true);
    listMyNotifications()
      .then(setNotifications)
      .catch((err) => showToast(err instanceof Error ? err.message : "알림을 불러오지 못했어요", "danger"))
      .finally(() => setNotificationsLoading(false));
  };

  const goNotiInbox = () => {
    setScreen("notiInbox");
    loadNotifications();
  };

  // 홈 알림 아이콘에서 initialScreen="notiInbox"로 곧장 진입한 경우 마운트 시 1회 조회
  useEffect(() => {
    if (initialScreen === "notiInbox") loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 하드웨어 백버튼: 화면 상단 '‹' 버튼의 onBack과 동일한 대상으로 이동. 루트 화면(main)에서는 등록하지 않아
  // 상위(App.tsx)의 "홈으로" 처리로 자연스럽게 넘어감
  useEffect(() => {
    if (showLogoutConfirm) return pushBackAction(() => setShowLogoutConfirm(false));
    if (screen === "main") return;
    return pushBackAction(() => setScreen("main"));
  }, [screen, showLogoutConfirm]);

  return (
    <>
      {screen === "main" && (
        <BizMainScreen
          shop={shop}
          onOpenBasicInfo={() => setScreen("basicInfo")}
          onOpenHoliday={() => setScreen("holiday")}
          onOpenAvailTime={() => setScreen("availtime")}
          onOpenRsvStat={() => setScreen("rsvstat")}
          onOpenPwdChange={() => setScreen("pwdChange")}
          onOpenHome={onExit}
          onOpenRsvc={onOpenRsvc}
          onOpenStl={onOpenStl}
          onOpenLogoutConfirm={() => setShowLogoutConfirm(true)}
          onOpenNotiInbox={goNotiInbox}
          onPlaceholder={(label) => showToast(`${label}(으)로 이동해요`)}
        />
      )}

      {screen === "notiInbox" && (
        <NotiInboxScreen
          onBack={() => setScreen("main")}
          notifications={notifications}
          loading={notificationsLoading}
          onMarkRead={(id) => {
            setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
            markNotificationRead(id).catch(() => {});
          }}
        />
      )}

      {screen === "basicInfo" && shop && (
        <BizBasicInfoScreen
          shop={shop}
          onBack={() => setScreen("main")}
          onSaved={(updated) => {
            setShop(updated);
            showToast("저장되었어요.", "success");
          }}
          onError={(message) => showToast(message, "danger")}
        />
      )}

      {screen === "holiday" && shop && (
        <BizHolidayScreen
          shop={shop}
          onBack={() => setScreen("main")}
          onSaved={() => showToast("휴무일이 저장되었어요.", "success")}
          onError={(message) => showToast(message, "danger")}
        />
      )}

      {screen === "availtime" && shop && (
        <BizAvailTimeScreen
          shop={shop}
          onBack={() => setScreen("main")}
          onSaved={() => showToast("예약 가능 시간이 저장되었어요.", "success")}
          onError={(message) => showToast(message, "danger")}
        />
      )}

      {screen === "rsvstat" && shop && (
        <BizRsvStatScreen
          shop={shop}
          onBack={() => setScreen("main")}
          onError={(message) => showToast(message, "danger")}
        />
      )}

      {screen === "pwdChange" && (
        <BizPwdChangeScreen
          onBack={() => setScreen("main")}
          onSaved={() => {
            setScreen("main");
            showToast("비밀번호가 변경되었어요.", "success");
          }}
          onError={(message) => showToast(message, "danger")}
        />
      )}

      {showLogoutConfirm && (
        <LogoutConfirmModal
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={async () => {
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
            onLogout();
          }}
        />
      )}

      {toast && (
        <div className="absolute inset-x-0 bottom-10 z-[90] flex justify-center px-6">
          <Toast tone={toast.tone}>{toast.message}</Toast>
        </div>
      )}
    </>
  );
}
