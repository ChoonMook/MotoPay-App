// PT-AUTH-03: 비밀번호 찾기 - 아이디 + 등록된 휴대폰 인증 후 비밀번호 재설정으로 이동
import { useState } from "react";
import BottomSheet from "../../components/ui/BottomSheet";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useOtpTimer } from "./useOtpTimer";

interface PwdFindScreenProps {
  onClose: () => void;
  onVerified: (username: string, phone: string) => void;
  loading?: boolean;
}

export default function PwdFindScreen({ onClose, onVerified, loading }: PwdFindScreenProps) {
  const [id, setId] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const timer = useOtpTimer();

  return (
    <BottomSheet onClose={onClose} maxHeight="78%">
      <div className="mb-1 text-xl font-extrabold text-gray-900">비밀번호 찾기</div>
      <div className="mb-5 text-[13.5px] text-gray-600">
        아이디와 등록된 휴대폰 인증 후 새 비밀번호로 재설정할 수 있어요.
      </div>
      <div className="mb-2 text-sm font-semibold">아이디</div>
      <div className="mb-3.5">
        <Input placeholder="아이디를 입력하세요" value={id} onChange={(e) => setId(e.target.value)} />
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
          size="lg"
          fullWidth={false}
          disabled={id.length < 2 || phone.length < 10}
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
              size="lg"
              fullWidth={false}
              disabled={otp.length < 4 || loading}
              onClick={() => {
                timer.stop();
                onVerified(id, phone);
              }}
            >
              확인
            </Button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
