// CU-AUTH-01: 고객앱 최초 진입 스플래시 화면(시공업체앱과 공용)
import { useEffect } from "react";

interface StartLoginSignupScreenProps {
  onContinue: () => void;
}

export default function StartLoginSignupScreen({ onContinue }: StartLoginSignupScreenProps) {
  useEffect(() => {
    const timer = setTimeout(onContinue, 3000);
    return () => clearTimeout(timer);
  }, [onContinue]);

  return (
    <div
      onClick={onContinue}
      className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center bg-brand"
      style={{ animation: "mp-fade .4s ease" }}
    >
      <div className="text-[46px] font-extrabold tracking-tight text-white">
        Moto<span className="text-[#FFCE3A]">Pay</span>
      </div>
      <div className="mt-3.5 text-[15px] font-medium text-white/85">신차 케어의 시작</div>
      <div className="mt-3.5 text-[15px] font-medium text-white/85">
        내 차를 위한 모든 서비스를 한 곳에서
      </div>
      <div className="absolute bottom-[88px] h-7 w-7 animate-spin rounded-full border-[3px] border-white/35 border-t-white" />
      <div className="absolute bottom-[44px] text-xs text-white/60">
        잠시만 기다려 주세요 · 탭하여 계속
      </div>
    </div>
  );
}
