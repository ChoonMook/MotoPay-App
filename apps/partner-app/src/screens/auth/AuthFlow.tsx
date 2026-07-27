// 파트너(시공업체)앱 1 Depth "로그인" PT-AUTH-02~04를 엮는 상태 컨테이너
// 로그인·최초 비밀번호 변경은 apps/api(/partner-auth/*) 실 연동, 아이디·비밀번호 찾기는 아직 UI 프로토타입(Mock)
import { useState } from "react";
import AppShell from "../../components/AppShell";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../components/ui/useToast";
import { login, changePassword } from "../../api/partnerAuth";
import { setTokens } from "../../api/tokenStorage";
import LoginScreen from "./LoginScreen";
import AcctFindScreen from "./AcctFindScreen";
import PwdFindScreen from "./PwdFindScreen";
import PwdResetScreen from "./PwdResetScreen";
import FirstLoginPwdChangeScreen from "./FirstLoginPwdChangeScreen";
import CallCenterSheet from "./CallCenterSheet";
import { CUSTOMER_APP_URL } from "../../config";

type Screen = "login" | "firstLoginPwdChange";
type Sheet = null | "findId" | "findPw" | "resetPw" | "callcenter";

interface AuthFlowProps {
  onAuthComplete: () => void;
}

export default function AuthFlow({ onAuthComplete }: AuthFlowProps) {
  const [screen, setScreen] = useState<Screen>("login");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [pwdChangeLoading, setPwdChangeLoading] = useState(false);
  const { toast, showToast } = useToast();

  const closeSheet = () => setSheet(null);

  return (
    <AppShell>
      {screen === "login" && (
        <LoginScreen
          loading={loginLoading}
          onLogin={async (id, pw, autoLogin) => {
            setLoginLoading(true);
            try {
              const result = await login(id, pw);
              setTokens(result.accessToken, result.refreshToken, autoLogin);
              if (result.partnerUser.mustChangePassword) {
                setScreen("firstLoginPwdChange");
              } else {
                onAuthComplete();
              }
            } catch (err) {
              showToast(err instanceof Error ? err.message : "로그인에 실패했습니다", "danger");
            } finally {
              setLoginLoading(false);
            }
          }}
          onFindId={() => setSheet("findId")}
          onFindPw={() => setSheet("findPw")}
          onOpenCallcenter={() => setSheet("callcenter")}
          onOpenCustomer={() => { window.location.href = CUSTOMER_APP_URL; }}
        />
      )}

      {screen === "firstLoginPwdChange" && (
        <FirstLoginPwdChangeScreen
          loading={pwdChangeLoading}
          onSubmit={async (currentPassword, newPassword) => {
            setPwdChangeLoading(true);
            try {
              await changePassword(currentPassword, newPassword);
              onAuthComplete();
            } catch (err) {
              showToast(err instanceof Error ? err.message : "비밀번호 변경에 실패했습니다", "danger");
            } finally {
              setPwdChangeLoading(false);
            }
          }}
        />
      )}

      {sheet === "findId" && (
        <AcctFindScreen
          onClose={closeSheet}
          onGoLogin={() => {
            closeSheet();
            showToast("로그인 화면으로 이동했어요");
          }}
        />
      )}

      {sheet === "findPw" && (
        <PwdFindScreen onClose={closeSheet} onVerified={() => setSheet("resetPw")} />
      )}

      {sheet === "resetPw" && (
        <PwdResetScreen
          onClose={closeSheet}
          onDone={() => {
            closeSheet();
            showToast("비밀번호가 변경되었어요", "success");
          }}
        />
      )}

      {sheet === "callcenter" && (
        <CallCenterSheet
          onClose={closeSheet}
          onCall={() => showToast("1588-0000으로 전화를 겁니다")}
        />
      )}

      {toast && (
        <div className="absolute inset-x-0 bottom-10 z-[90] flex justify-center px-6">
          <Toast tone={toast.tone}>{toast.message}</Toast>
        </div>
      )}
    </AppShell>
  );
}
