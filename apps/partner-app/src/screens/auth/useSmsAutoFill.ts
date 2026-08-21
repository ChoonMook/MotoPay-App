// SMS Retriever API로 받은 인증번호를 자동으로 입력해주는 훅(안드로이드 앱 전용) — 실패해도 수동 입력 가능하므로
// 에러는 조용히 무시함. active가 true가 되는 시점(SMS 발송 성공 직후)에 수신 대기를 시작한다
import { useEffect } from "react";
import { listenForSmsCode, startSmsAutoFill } from "../../native/bridge";

export function useSmsAutoFill(active: boolean, setCode: (code: string) => void) {
  useEffect(() => {
    if (!active) return;
    startSmsAutoFill().catch(() => {});
    return listenForSmsCode(setCode);
  }, [active, setCode]);
}
