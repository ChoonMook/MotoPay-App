// 카카오(다음) 우편번호 서비스 스크립트를 지연 로드하고 팝업으로 주소를 검색하는 훅 — 서버 API가 아닌 브라우저 전용 위젯이라 백엔드 경유 없이 프론트에서 직접 연동
import { useCallback, useRef } from "react";

const POSTCODE_SCRIPT_SRC = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

export interface DaumPostcodeResult {
  zonecode: string;
  address: string;
}

interface DaumPostcodeCompleteData {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
  userSelectedType: "R" | "J";
}

interface DaumPostcodeInstance {
  open: () => void;
}

interface DaumPostcodeOptions {
  oncomplete: (data: DaumPostcodeCompleteData) => void;
}

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: DaumPostcodeOptions) => DaumPostcodeInstance;
    };
  }
}

let scriptLoadPromise: Promise<void> | null = null;

function loadPostcodeScript(): Promise<void> {
  if (window.daum?.Postcode) {
    return Promise.resolve();
  }
  if (!scriptLoadPromise) {
    scriptLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = POSTCODE_SCRIPT_SRC;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptLoadPromise = null;
        reject(new Error("우편번호 서비스를 불러오지 못했습니다"));
      };
      document.head.appendChild(script);
    });
  }
  return scriptLoadPromise;
}

export function useDaumPostcode() {
  const openingRef = useRef(false);

  const open = useCallback(
    (onComplete: (result: DaumPostcodeResult) => void, onError?: (message: string) => void) => {
      if (openingRef.current) return;
      openingRef.current = true;

      loadPostcodeScript()
        .then(() => {
          new window.daum!.Postcode({
            oncomplete: (data) => {
              const address = data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;
              onComplete({ zonecode: data.zonecode, address });
            },
          }).open();
        })
        .catch((err) => {
          onError?.(err instanceof Error ? err.message : "우편번호 서비스를 불러오지 못했습니다");
        })
        .finally(() => {
          openingRef.current = false;
        });
    },
    [],
  );

  return { open };
}
