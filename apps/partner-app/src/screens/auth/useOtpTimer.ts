// 인증번호 재전송 카운트다운(180초) 공용 훅 — 원본 dc.html의 startTimer/fmt 로직과 동일한 규칙
import { useEffect, useRef, useState } from "react";

export function useOtpTimer() {
  const [countdown, setCountdown] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const start = () => {
    clearInterval(intervalRef.current);
    setCountdown(180);
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stop = () => {
    clearInterval(intervalRef.current);
    setCountdown(0);
  };

  const label = `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, "0")}`;

  return { countdown, showTimer: countdown > 0, timerLabel: label, start, stop };
}
