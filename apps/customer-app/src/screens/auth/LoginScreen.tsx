// CU-AUTH-02: 아이디/비밀번호 로그인, SNS 간편로그인, 회원가입·아이디/비밀번호 찾기 진입
import { useState } from "react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Checkbox from "../../components/ui/Checkbox";
import { SNS_BG, SNS_PROVIDERS, SnsIcon, type SnsProvider } from "./snsIcons";

export type { SnsProvider };

interface LoginScreenProps {
  onLogin: (id: string, pw: string, autoLogin: boolean) => void;
  onFindId: () => void;
  onFindPw: () => void;
  onSignup: () => void;
  onSnsLogin: (provider: SnsProvider) => void;
  onOpenPartner: () => void;
  loading?: boolean;
}

export default function LoginScreen({
  onLogin,
  onFindId,
  onFindPw,
  onSignup,
  onSnsLogin,
  onOpenPartner,
  loading = false,
}: LoginScreenProps) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [autoLogin, setAutoLogin] = useState(false);

  return (
    <div
      className="mp-scroll absolute inset-0 overflow-y-auto px-6 pt-[78px] pb-8"
      style={{ animation: "mp-screen .32s ease" }}
    >
      <div className="text-[30px] font-extrabold tracking-tight text-gray-900">
        Moto<span className="text-brand">Pay</span>
      </div>
      <div className="mt-2 mb-7 text-[15px] text-gray-600">오너님, 반가워요. 로그인하고 시작해요.</div>

      <div className="flex flex-col gap-3.5">
        <Input
          label="아이디"
          placeholder="아이디를 입력하세요"
          value={id}
          onChange={(e) => setId(e.target.value)}
        />
        <Input
          label="비밀번호"
          placeholder="비밀번호를 입력하세요"
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
      </div>

      <div className="mt-3.5 mb-5 flex items-center justify-between px-0.5">
        <Checkbox checked={autoLogin} onChange={setAutoLogin} label="자동로그인" />
        <div className="flex items-center gap-2.5 text-[13px] text-gray-600">
          <span onClick={onFindId} className="cursor-pointer">
            아이디 찾기
          </span>
          <span className="text-gray-300">|</span>
          <span onClick={onFindPw} className="cursor-pointer">
            비밀번호 찾기
          </span>
        </div>
      </div>

      <Button onClick={() => onLogin(id, pw, autoLogin)} disabled={!id || !pw || loading}>
        {loading ? "로그인 중..." : "로그인"}
      </Button>

      <div className="my-[26px] flex items-center gap-3">
        <span className="h-px flex-1 bg-gray-100" />
        <span className="text-xs text-gray-500">간편 로그인</span>
        <span className="h-px flex-1 bg-gray-100" />
      </div>

      <div className="flex justify-center gap-[22px]">
        {SNS_PROVIDERS.map((provider) => (
          <div
            key={provider}
            onClick={() => onSnsLogin(provider)}
            className="flex cursor-pointer flex-col items-center gap-1.5"
          >
            <span
              className={`flex h-[54px] w-[54px] items-center justify-center rounded-full ${
                provider === "Gmail" ? "border border-gray-200" : ""
              }`}
              style={{ background: SNS_BG[provider] }}
            >
              <SnsIcon provider={provider} size={54} />
            </span>
            <span className="text-[11px] text-gray-500">{provider}</span>
          </div>
        ))}
      </div>

      <div className="mt-[30px] text-center text-sm text-gray-600">
        아직 회원이 아니신가요?{" "}
        <span onClick={onSignup} className="cursor-pointer font-bold text-brand">
          회원가입
        </span>
      </div>

      <div className="mt-[34px] border-t border-gray-100 pt-[18px] text-center">
        <span onClick={onOpenPartner} className="cursor-pointer text-[12.5px] text-gray-500">
          시공업체이신가요?{" "}
          <span className="font-semibold text-gray-600 underline underline-offset-2">
            파트너센터 로그인 ›
          </span>
        </span>
      </div>
    </div>
  );
}
