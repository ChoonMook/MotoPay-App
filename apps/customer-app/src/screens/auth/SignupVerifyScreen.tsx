// CU-AUTH-05: 회원가입 - 휴대폰 본인인증(실명인증)
// "이름" 입력란은 임시 조치 — 추후 실명인증(PASS/NICE 등) 서비스 연동 시 CI값 기반으로 서버가 이름을 내려주는 방식으로 교체 예정(그때는 다시 읽기전용으로 전환)
import { useState } from "react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import ProgressSteps from "../../components/ui/ProgressSteps";
import { useOtpTimer } from "./useOtpTimer";

interface SignupVerifyScreenProps {
  onBack: () => void;
  onNext: (name: string, phone: string) => void;
}

const STEPS = ["실명인증", "정보입력", "약관동의"];

export default function SignupVerifyScreen({ onBack, onNext }: SignupVerifyScreenProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const timer = useOtpTimer();

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex-none bg-white px-6 pt-[50px] pb-4">
        <div className="mb-[22px] flex items-center gap-3">
          <span onClick={onBack} className="cursor-pointer text-[22px] leading-none text-gray-800">
            ‹
          </span>
          <span className="text-lg font-bold text-gray-900">회원가입</span>
        </div>
        <ProgressSteps steps={STEPS} current={0} />
      </div>
      <div className="mp-scroll flex-1 overflow-y-auto px-6 pt-2 pb-5">
        <div className="mt-2 mb-[6px] text-[22px] font-extrabold tracking-tight text-gray-900">
          본인인증을 진행해 주세요
        </div>
        <div className="mb-6 text-sm text-gray-600">안전한 가입을 위해 이름과 휴대폰 본인인증이 필요해요.</div>

        <div className="mb-3.5">
          <Input label="이름" placeholder="실명을 입력하세요" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="mb-2 text-sm font-semibold text-gray-800">휴대폰 번호</div>
        <div className="mb-3.5 flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="01012345678"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <Button
            variant="secondary"
            size="lg" fullWidth={false}
            onClick={() => {
              setSent(true);
              timer.start();
            }}
            disabled={!name || phone.length < 10}
          >
            인증요청
          </Button>
        </div>

        {sent && (
          <div style={{ animation: "mp-screen .3s ease" }}>
            <div className="mb-2 text-sm font-semibold text-gray-800">인증번호</div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="인증번호 6자리"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                {timer.showTimer && (
                  <span className="absolute top-4 right-3.5 text-sm font-bold text-status-danger tabular-nums">
                    {timer.timerLabel}
                  </span>
                )}
              </div>
              <Button
                size="lg" fullWidth={false}
                onClick={() => {
                  timer.stop();
                  setVerified(true);
                }}
                disabled={otp.length < 4}
              >
                확인
              </Button>
            </div>
          </div>
        )}

        {verified && (
          <div className="mt-[18px] rounded-xl bg-gray-100 p-4" style={{ animation: "mp-screen .3s ease" }}>
            <div className="flex items-center gap-1.5 text-[13px] font-bold text-status-success">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-status-success text-[11px] text-white">
                ✓
              </span>
              인증 완료
            </div>
          </div>
        )}
      </div>
      <div className="flex-none border-t border-gray-100 bg-white px-6 pt-3.5 pb-6">
        <Button disabled={!verified} onClick={() => onNext(name, phone)}>
          다음
        </Button>
      </div>
    </div>
  );
}
