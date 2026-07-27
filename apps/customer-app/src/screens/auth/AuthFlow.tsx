// 고객앱 1 Depth "시작(로그인/회원가입)" 13개 화면(CU-AUTH-01~13)을 엮는 상태 컨테이너
import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../components/ui/useToast";
import { pushBackAction } from "../../native/backHandler";
import {
  checkUsernameAvailable,
  findUsername,
  login,
  requestPasswordReset,
  resetPassword,
  signup,
  type LoginUser,
} from "../../api/auth";
import { setTokens } from "../../api/tokenStorage";
import { PARTNER_APP_URL } from "../../config";
import StartLoginSignupScreen from "./StartLoginSignupScreen";
import LoginScreen, { type SnsProvider } from "./LoginScreen";
import SignupVerifyScreen from "./SignupVerifyScreen";
import SignupInfoScreen from "./SignupInfoScreen";
import SignupTermsScreen from "./SignupTermsScreen";
import TermsViewScreen from "./TermsViewScreen";
import PrivacyViewScreen from "./PrivacyViewScreen";
import MktgViewScreen from "./MktgViewScreen";
import SignupDoneScreen from "./SignupDoneScreen";
import SnsLinkConfirmScreen from "./SnsLinkConfirmScreen";
import AcctFindScreen from "./AcctFindScreen";
import PwdFindScreen from "./PwdFindScreen";
import PwdResetScreen from "./PwdResetScreen";

type Screen = "splash" | "login" | "verify" | "info" | "done";
type Sheet =
  | null
  | "findId"
  | "findPw"
  | "resetPw"
  | "sns"
  | "terms"
  | "viewService"
  | "viewPrivacy"
  | "viewMkt";

interface AuthFlowProps {
  onAuthComplete: (user: LoginUser) => void;
}

export default function AuthFlow({ onAuthComplete }: AuthFlowProps) {
  const [screen, setScreen] = useState<Screen>("splash");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [snsProvider, setSnsProvider] = useState<SnsProvider>("카카오");
  const [signupName, setSignupName] = useState("");
  const [signupContact, setSignupContact] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState("");
  const [signupAgreeService, setSignupAgreeService] = useState(false);
  const [signupAgreePrivacy, setSignupAgreePrivacy] = useState(false);
  const [signupAgreeMarketingSms, setSignupAgreeMarketingSms] = useState(false);
  const [signupAgreeMarketingEmail, setSignupAgreeMarketingEmail] = useState(false);
  const [signupAgreeMarketingPush, setSignupAgreeMarketingPush] = useState(false);
  // 약관동의 화면의 "마케팅 수신 동의" 대표 체크박스 — 채널 3개 중 하나라도 켜져 있으면 체크된 것으로 표시
  const signupAgreeMarketing =
    signupAgreeMarketingSms || signupAgreeMarketingEmail || signupAgreeMarketingPush;
  const setSignupAgreeMarketing = (checked: boolean) => {
    setSignupAgreeMarketingSms(checked);
    setSignupAgreeMarketingEmail(checked);
    setSignupAgreeMarketingPush(checked);
  };
  const [signupResultUser, setSignupResultUser] = useState<LoginUser | null>(null);
  const [signupLoading, setSignupLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
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

  // 하드웨어 백버튼: 시트가 열려 있으면 닫기(약관 상세 3종은 약관동의 시트로 복귀), 아니면 이전 단계로.
  // login 화면은 AuthFlow의 실질적 루트라 등록하지 않음(뒤로가기 시 앱 종료, 로그인 화면 표준 동작과 동일)
  useEffect(() => {
    if (sheet === "viewService" || sheet === "viewPrivacy" || sheet === "viewMkt") {
      return pushBackAction(() => setSheet("terms"));
    }
    if (sheet) {
      return pushBackAction(closeSheet);
    }
    if (screen === "verify") {
      return pushBackAction(() => setScreen("login"));
    }
    if (screen === "info") {
      return pushBackAction(() => setScreen("verify"));
    }
  }, [screen, sheet]);

  return (
    <AppShell>
      {screen === "splash" && (
          <StartLoginSignupScreen onContinue={() => setScreen("login")} />
        )}

        {screen === "login" && (
          <LoginScreen
            loading={loginLoading}
            onLogin={async (id, pw, autoLogin) => {
              setLoginLoading(true);
              try {
                const result = await login(id, pw);
                setTokens(result.accessToken, result.refreshToken, autoLogin);
                onAuthComplete(result.user);
              } catch (err) {
                showToast(err instanceof Error ? err.message : "로그인에 실패했습니다", "danger");
              } finally {
                setLoginLoading(false);
              }
            }}
            onFindId={() => setSheet("findId")}
            onFindPw={() => setSheet("findPw")}
            onSignup={() => setScreen("verify")}
            onSnsLogin={(provider) => {
              setSnsProvider(provider);
              setSheet("sns");
            }}
            onOpenPartner={() => { window.location.href = PARTNER_APP_URL; }}
          />
        )}

        {screen === "verify" && (
          <SignupVerifyScreen
            onBack={() => setScreen("login")}
            onNext={(name, phone) => {
              setSignupName(name);
              setSignupContact(phone);
              setScreen("info");
            }}
          />
        )}

        {screen === "info" && (
          <SignupInfoScreen
            name={signupName}
            contact={signupContact}
            username={signupUsername}
            onUsernameChange={setSignupUsername}
            email={signupEmail}
            onEmailChange={setSignupEmail}
            password={signupPassword}
            onPasswordChange={setSignupPassword}
            passwordConfirm={signupPasswordConfirm}
            onPasswordConfirmChange={setSignupPasswordConfirm}
            onCheckUsername={checkUsernameAvailable}
            onBack={() => setScreen("verify")}
            onNext={() => setSheet("terms")}
          />
        )}

        {screen === "done" && (
          <SignupDoneScreen
            name={signupName}
            onGoHome={() => signupResultUser && onAuthComplete(signupResultUser)}
          />
        )}

        {/* ============ SHEETS / POPUPS ============ */}
        {sheet === "findId" && (
          <AcctFindScreen
            onClose={closeSheet}
            onGoLogin={() => { closeSheet(); showToast("로그인 화면으로 이동했어요"); }}
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
          />
        )}

        {sheet === "findPw" && (
          <PwdFindScreen
            onClose={closeSheet}
            loading={pwFindLoading}
            onVerified={async (phone) => {
              setPwFindLoading(true);
              try {
                setResetToken(await requestPasswordReset(phone));
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
                showToast("비밀번호가 재설정되었습니다", "success");
              } catch (err) {
                showToast(err instanceof Error ? err.message : "비밀번호 재설정에 실패했습니다", "danger");
              } finally {
                setPwResetLoading(false);
              }
            }}
          />
        )}

        {sheet === "sns" && (
          <SnsLinkConfirmScreen
            provider={snsProvider}
            onCancel={closeSheet}
            onLink={() => { closeSheet(); showToast(`${snsProvider} 계정이 연결되었습니다`, "success"); }}
          />
        )}

        {sheet === "terms" && (
          <SignupTermsScreen
            onClose={closeSheet}
            onOpenService={() => setSheet("viewService")}
            onOpenPrivacy={() => setSheet("viewPrivacy")}
            onOpenMarketing={() => setSheet("viewMkt")}
            service={signupAgreeService}
            onServiceChange={setSignupAgreeService}
            privacy={signupAgreePrivacy}
            onPrivacyChange={setSignupAgreePrivacy}
            marketing={signupAgreeMarketing}
            onMarketingChange={setSignupAgreeMarketing}
            loading={signupLoading}
            onComplete={async () => {
              setSignupLoading(true);
              try {
                const result = await signup({
                  username: signupUsername,
                  password: signupPassword,
                  name: signupName,
                  email: signupEmail,
                  phone: signupContact,
                  agreedTerms: signupAgreeService,
                  agreedPrivacy: signupAgreePrivacy,
                  agreedMarketingSms: signupAgreeMarketingSms,
                  agreedMarketingEmail: signupAgreeMarketingEmail,
                  agreedMarketingPush: signupAgreeMarketingPush,
                });
                // 회원가입 화면엔 자동로그인 체크박스가 없어 기본적으로 로그인 상태를 유지시킴
                setTokens(result.accessToken, result.refreshToken, true);
                setSignupResultUser(result.user);
                setSheet(null);
                setScreen("done");
              } catch (err) {
                showToast(err instanceof Error ? err.message : "회원가입에 실패했습니다", "danger");
              } finally {
                setSignupLoading(false);
              }
            }}
          />
        )}

        {sheet === "viewService" && (
          <TermsViewScreen onClose={() => setSheet("terms")} onAgree={() => setSheet("terms")} />
        )}

        {sheet === "viewPrivacy" && (
          <PrivacyViewScreen onClose={() => setSheet("terms")} onAgree={() => setSheet("terms")} />
        )}

        {sheet === "viewMkt" && (
          <MktgViewScreen
            onClose={() => setSheet("terms")}
            onDeny={() => {
              setSignupAgreeMarketingSms(false);
              setSignupAgreeMarketingEmail(false);
              setSignupAgreeMarketingPush(false);
              setSheet("terms");
            }}
            onAgree={() => setSheet("terms")}
            sms={signupAgreeMarketingSms}
            onSmsChange={setSignupAgreeMarketingSms}
            email={signupAgreeMarketingEmail}
            onEmailChange={setSignupAgreeMarketingEmail}
            push={signupAgreeMarketingPush}
            onPushChange={setSignupAgreeMarketingPush}
          />
        )}

        {/* toast */}
        {toast && (
          <div className="absolute inset-x-0 bottom-10 z-[90] flex justify-center px-6">
            <Toast tone={toast.tone}>{toast.message}</Toast>
          </div>
        )}
    </AppShell>
  );
}
