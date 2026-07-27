// CU-AUTH-06: 회원가입 - 정보입력(연락처, 아이디 중복확인, 이메일, 비밀번호)
import { useState } from "react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import ProgressSteps from "../../components/ui/ProgressSteps";

interface SignupInfoScreenProps {
  name: string;
  contact: string;
  username: string;
  onUsernameChange: (value: string) => void;
  email: string;
  onEmailChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  passwordConfirm: string;
  onPasswordConfirmChange: (value: string) => void;
  onCheckUsername: (username: string) => Promise<boolean>;
  onBack: () => void;
  onNext: () => void;
}

const STEPS = ["실명인증", "정보입력", "약관동의"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupInfoScreen({
  name,
  contact,
  username,
  onUsernameChange,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  passwordConfirm,
  onPasswordConfirmChange,
  onCheckUsername,
  onBack,
  onNext,
}: SignupInfoScreenProps) {
  const [idChecked, setIdChecked] = useState(false);
  const [idTaken, setIdTaken] = useState(false);
  const [checking, setChecking] = useState(false);

  const idValid = username.length >= 4 && idChecked;
  const emailValid = EMAIL_RE.test(email);
  const pwRuleLen = password.length >= 8;
  const pwRuleMix = /[a-zA-Z]/.test(password) && /[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password);
  const pwValid = pwRuleLen && pwRuleMix;
  const pw2Valid = password.length > 0 && password === passwordConfirm;
  const infoValid = idValid && emailValid && pwValid && pw2Valid;

  const handleUsernameChange = (value: string) => {
    onUsernameChange(value);
    setIdChecked(false);
    setIdTaken(false);
  };

  const handleCheckUsername = async () => {
    setChecking(true);
    try {
      const available = await onCheckUsername(username);
      setIdChecked(available);
      setIdTaken(!available);
    } catch {
      setIdChecked(false);
      setIdTaken(false);
    } finally {
      setChecking(false);
    }
  };

  const idHint = idTaken
    ? "이미 사용 중인 아이디예요."
    : idChecked
      ? "사용 가능한 아이디예요."
      : username
        ? "중복확인을 해주세요."
        : "로그인에 사용할 아이디를 입력하세요.";

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex-none bg-white px-6 pt-[50px] pb-4">
        <div className="mb-[22px] flex items-center gap-3">
          <span onClick={onBack} className="cursor-pointer text-[22px] leading-none text-gray-800">
            ‹
          </span>
          <span className="text-lg font-bold text-gray-900">회원가입</span>
        </div>
        <ProgressSteps steps={STEPS} current={1} />
      </div>
      <div className="mp-scroll flex-1 overflow-y-auto px-6 pt-2 pb-5">
        <div className="mt-2 mb-5 text-[22px] font-extrabold tracking-tight text-gray-900">
          정보를 입력해 주세요
        </div>

        <div className="flex flex-col gap-3.5">
          <Input label="이름" value={name} disabled />
          <Input label="연락처" value={contact} disabled />
          <div>
            <div className="mb-2 text-sm font-semibold text-gray-800">아이디</div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="영문·숫자 4~20자"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                />
              </div>
              <Button
                variant="secondary"
                size="lg" fullWidth={false}
                disabled={username.length < 4 || checking}
                onClick={handleCheckUsername}
              >
                {checking ? "확인 중..." : "중복확인"}
              </Button>
            </div>
            <div className={`mt-1.5 text-xs ${idTaken ? "text-status-danger" : idChecked ? "text-status-success" : "text-gray-500"}`}>
              {idHint}
            </div>
          </div>
          <Input
            label="이메일"
            type="email"
            placeholder="알림·영수증 수신용 이메일"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            error={email && !emailValid ? "올바른 이메일 형식이 아니에요" : undefined}
          />
          <Input
            label="비밀번호"
            type="password"
            placeholder="영문·숫자·특수문자 8자 이상"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            helperText="영문·숫자·특수문자 조합 8자 이상"
            error={password && !pwValid ? "비밀번호 규칙을 확인하세요" : undefined}
          />
          <Input
            label="비밀번호 확인"
            type="password"
            placeholder="비밀번호를 다시 입력"
            value={passwordConfirm}
            onChange={(e) => onPasswordConfirmChange(e.target.value)}
            error={passwordConfirm && !pw2Valid ? "비밀번호가 일치하지 않아요" : undefined}
          />
        </div>
      </div>
      <div className="flex-none border-t border-gray-100 bg-white px-6 pt-3.5 pb-6">
        <Button disabled={!infoValid} onClick={onNext}>
          다음
        </Button>
      </div>
    </div>
  );
}
