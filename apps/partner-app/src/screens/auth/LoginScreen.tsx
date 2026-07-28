// PT-AUTH-02: 시공업체(파트너) 아이디/비밀번호 로그인. 자체 가입 없이 콜센터 문의로 계정 발급 안내
import { useState } from "react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Checkbox from "../../components/ui/Checkbox";

interface LoginScreenProps {
  onLogin: (id: string, pw: string, autoLogin: boolean) => void;
  onFindId: () => void;
  onFindPw: () => void;
  onOpenCallcenter: () => void;
  onOpenCustomer: () => void;
  loading?: boolean;
}

export default function LoginScreen({
  onLogin,
  onFindId,
  onFindPw,
  onOpenCallcenter,
  onOpenCustomer,
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
      <div className="flex items-center gap-2">
        <span className="text-[30px] font-extrabold tracking-tight text-gray-900">
          Moto<span className="text-brand">Pay</span>
        </span>
        <span className="rounded-[5px] bg-brand-subtle px-[7px] py-[2.5px] text-[10.5px] font-extrabold text-brand">
          파트너
        </span>
      </div>
      <div className="mt-2 mb-7 text-[15px] text-gray-600">
        시공업체 회원님, 파트너센터에 오신 걸 환영해요.
      </div>

      <div className="flex flex-col gap-3">
        <Input
          label="아이디"
          placeholder="파트너 아이디를 입력하세요"
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

      <div className="mt-6 flex gap-2.5 rounded-xl bg-gray-100 p-4">
        <span className="text-lg leading-none">🔧</span>
        <div className="text-[12.5px] leading-[1.6] text-gray-600">
          파트너 계정은 자체 가입이 불가해요. 계정 발급은{" "}
          <span
            onClick={onOpenCallcenter}
            className="cursor-pointer font-bold text-brand underline underline-offset-2"
          >
            콜센터
          </span>
          로 문의해주세요.
        </div>
      </div>

      <div className="mt-[34px] border-t border-gray-100 pt-[18px] text-center">
        <span onClick={onOpenCustomer} className="cursor-pointer text-[12.5px] text-gray-500">
          고객이신가요?{" "}
          <span className="font-semibold text-gray-600 underline underline-offset-2">
            고객앱 로그인 ›
          </span>
        </span>
      </div>
    </div>
  );
}
