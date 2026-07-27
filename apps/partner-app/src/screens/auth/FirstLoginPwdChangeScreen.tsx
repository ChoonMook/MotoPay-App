// 최초 로그인 시 강제 비밀번호 변경 - 발급받은 초기 비밀번호로는 계속 로그인할 수 없어, 반드시 이 화면을 거쳐야 홈으로 진입 가능
import { useState } from "react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

interface FirstLoginPwdChangeScreenProps {
  onSubmit: (currentPassword: string, newPassword: string) => void;
  loading?: boolean;
}

const MIX_RE = /(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/;

export default function FirstLoginPwdChangeScreen({
  onSubmit,
  loading = false,
}: FirstLoginPwdChangeScreenProps) {
  const [currentPw, setCurrentPw] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  const ruleLen = pw.length >= 8;
  const ruleMix = MIX_RE.test(pw);
  const ruleMatch = pw.length > 0 && pw === pw2;
  const ruleDiff = pw.length > 0 && pw !== currentPw;
  const canSubmit = currentPw.length > 0 && ruleLen && ruleMix && ruleMatch && ruleDiff && !loading;

  const ruleRow = (ok: boolean, label: string) => (
    <div className={`flex items-center gap-2 text-[12.5px] ${ok ? "text-status-success" : "text-gray-400"}`}>
      <span>{ok ? "✓" : "○"}</span> {label}
    </div>
  );

  return (
    <div
      className="mp-scroll absolute inset-0 overflow-y-auto px-6 pt-[78px] pb-8"
      style={{ animation: "mp-screen .32s ease" }}
    >
      <div className="text-[30px] font-extrabold tracking-tight text-gray-900">
        Moto<span className="text-brand">Pay</span>
      </div>
      <div className="mt-2 mb-7 text-[15px] text-gray-600">
        최초 로그인이에요. 계속 이용하려면 비밀번호를 변경해 주세요.
      </div>

      <div className="mb-3.5">
        <Input
          label="현재 비밀번호"
          placeholder="발급받은 초기 비밀번호"
          type="password"
          value={currentPw}
          onChange={(e) => setCurrentPw(e.target.value)}
        />
      </div>

      <div className="mb-3.5 flex flex-col gap-3.5">
        <Input
          label="새 비밀번호"
          placeholder="새 비밀번호"
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        <Input
          label="새 비밀번호 확인"
          placeholder="새 비밀번호 확인"
          type="password"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
        />
      </div>

      <div className="mb-[18px] flex flex-col gap-1.5 rounded-lg bg-gray-100 px-3.5 py-3">
        {ruleRow(ruleLen, "8자 이상")}
        {ruleRow(ruleMix, "영문·숫자·특수문자 조합")}
        {ruleRow(ruleMatch, "비밀번호 일치")}
        {ruleRow(ruleDiff, "현재 비밀번호와 다르게 설정")}
      </div>

      <Button disabled={!canSubmit} onClick={() => onSubmit(currentPw, pw)}>
        {loading ? "변경 중..." : "비밀번호 변경"}
      </Button>
    </div>
  );
}
