// 내 업체 관리 PT-PROF-01(메인)~02(기본정보 관리)를 엮는 상태 컨테이너
import { useEffect, useState } from "react";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../components/ui/useToast";
import { clearTokens } from "../../api/tokenStorage";
import { getMyShop, type MyShop } from "../../api/shops";
import BizMainScreen from "./BizMainScreen";
import BizBasicInfoScreen from "./BizBasicInfoScreen";
import LogoutConfirmModal from "./LogoutConfirmModal";

type Screen = "main" | "basicInfo";

interface BizFlowProps {
  onExit: () => void;
  onLogout: () => void;
}

export default function BizFlow({ onExit, onLogout }: BizFlowProps) {
  const [screen, setScreen] = useState<Screen>("main");
  const [shop, setShop] = useState<MyShop | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { toast, showToast } = useToast();

  useEffect(() => {
    getMyShop()
      .then(setShop)
      .catch((err) => showToast(err instanceof Error ? err.message : "업체 정보를 불러오지 못했어요", "danger"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {screen === "main" && (
        <BizMainScreen
          shop={shop}
          onOpenBasicInfo={() => setScreen("basicInfo")}
          onOpenHome={onExit}
          onOpenLogoutConfirm={() => setShowLogoutConfirm(true)}
          onPlaceholder={(label) => showToast(`${label}(으)로 이동해요`)}
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

      {showLogoutConfirm && (
        <LogoutConfirmModal
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={() => {
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
