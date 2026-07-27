// CU-AUTH-12: 아이디 찾기 - 휴대폰 인증 후 마스킹된 아이디 안내
import { useState } from "react";
import BottomSheet from "../../components/ui/BottomSheet";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useOtpTimer } from "./useOtpTimer";

interface AcctFindScreenProps {
  onClose: () => void;
  onGoLogin: () => void;
  onVerify: (phone: string) => void;
  foundUsername: string | null;
  loading?: boolean;
}

export default function AcctFindScreen({ onClose, onGoLogin, onVerify, foundUsername, loading }: AcctFindScreenProps) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const timer = useOtpTimer();

  return (
    <BottomSheet onClose={onClose} maxHeight="78%">
      <div className="mb-1 text-xl font-extrabold text-gray-900">아이디 찾기</div>
      <div className="mb-5 text-[13.5px] text-gray-600">
        가입 시 인증한 휴대폰 번호로 아이디를 찾아드려요.
      </div>
      <div className="mb-2 text-sm font-semibold">휴대폰 번호</div>
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
          disabled={phone.length < 10}
          onClick={() => {
            setSent(true);
            timer.start();
          }}
        >
          인증요청
        </Button>
      </div>

      {sent && (
        <div style={{ animation: "mp-screen .3s ease" }}>
          <div className="mb-2 text-sm font-semibold">인증번호</div>
          <div className="mb-2 flex gap-2">
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
              disabled={otp.length < 4 || loading}
              onClick={() => {
                timer.stop();
                onVerify(phone);
              }}
            >
              확인
            </Button>
          </div>
        </div>
      )}

      {foundUsername && (
        <>
          <div
            className="mt-2 mb-[18px] rounded-xl bg-brand-subtle p-5 text-center"
            style={{ animation: "mp-screen .3s ease" }}
          >
            <div className="mb-1.5 text-[13px] text-gray-600">회원님의 아이디는</div>
            <div className="text-[22px] font-extrabold tracking-tight text-brand">{foundUsername}</div>
          </div>
          <Button onClick={onGoLogin}>로그인하기</Button>
        </>
      )}
    </BottomSheet>
  );
}
