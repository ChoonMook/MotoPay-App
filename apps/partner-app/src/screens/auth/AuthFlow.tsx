// 파트너(시공업체)앱 1 Depth "로그인" PT-AUTH-02~04를 엮는 상태 컨테이너
// 로그인·최초 비밀번호 변경·아이디 찾기·비밀번호 찾기 모두 apps/api(/partner-auth/*) 실 연동
import { useState } from "react";
import AppShell from "../../components/AppShell";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../components/ui/useToast";
import { login, changePassword, findUsername, requestPasswordReset, resetPassword } from "../../api/partnerAuth";
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
  const [findIdLoading, setFindIdLoading] = useState(false);
  const [foundUsername, setFoundUsername] = useState<string | null>(null);
  const [pwFindLoading, setPwFindLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [pwResetLoading, setPwResetLoading] = useState(false);
  const { toast, showToast } = useToast();

  const closeSheet = () => {
    setSheet(null);
    setFoundUsername(null);
    setResetToken(null);
  };

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
          loading={findIdLoading}
          foundUsername={foundUsername}
          onVerify={async (phone) => {
            setFindIdLoading(true);
            try {
              setFoundUsername(await findUsername(phone));
            } catch (err) {
              showToast(err instanceof Error ? err.message : "아이디 찾기에 실패했습니다", "danger");
            } finally {
              setFindIdLoading(false);
            }
          }}
          onGoLogin={() => {
            closeSheet();
            showToast("로그인 화면으로 이동했어요");
          }}
        />
      )}

      {sheet === "findPw" && (
        <PwdFindScreen
          onClose={closeSheet}
          loading={pwFindLoading}
          onVerified={async (username, phone) => {
            setPwFindLoading(true);
            try {
              setResetToken(await requestPasswordReset(username, phone));
              setSheet("resetPw");
            } catch (err) {
              showToast(err instanceof Error ? err.message : "비밀번호 찾기에 실패했습니다", "danger");
            } finally {
              setPwFindLoading(false);
            }
          }}
        />
      )}

      {sheet === "resetPw" && (
        <PwdResetScreen
          onClose={closeSheet}
          loading={pwResetLoading}
          onDone={async (newPassword) => {
            if (!resetToken) return;
            setPwResetLoading(true);
            try {
              await resetPassword(resetToken, newPassword);
              closeSheet();
              showToast("비밀번호가 변경되었어요", "success");
            } catch (err) {
              showToast(err instanceof Error ? err.message : "비밀번호 변경에 실패했습니다", "danger");
            } finally {
              setPwResetLoading(false);
            }
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
