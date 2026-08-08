// 카카오(다음) 우편번호 서비스 스크립트를 지연 로드하고 화면 안에 레이어로 임베드하는 훅
// (apps/partner-app의 동일 훅을 그대로 포팅 — admin-app은 일반 브라우저 SPA라 webview 제약은 없지만
// embed() 레이어 방식이 별도 팝업 차단 이슈 없이 동일하게 잘 동작해 그대로 재사용)
import { useCallback, useEffect, useRef, useState } from "react";

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
  embed: (container: HTMLElement) => void;
}

interface DaumPostcodeOptions {
  oncomplete: (data: DaumPostcodeCompleteData) => void;
  width?: string | number;
  height?: string | number;
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
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onCompleteRef = useRef<((result: DaumPostcodeResult) => void) | undefined>(undefined);
  const onErrorRef = useRef<((message: string) => void) | undefined>(undefined);

  const close = useCallback(() => setIsOpen(false), []);

  const open = useCallback(
    (onComplete: (result: DaumPostcodeResult) => void, onError?: (message: string) => void) => {
      onCompleteRef.current = onComplete;
      onErrorRef.current = onError;
      setIsOpen(true);
    },
    [],
  );

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    loadPostcodeScript()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = "";
        new window.daum!.Postcode({
          width: "100%",
          height: "100%",
          oncomplete: (data) => {
            const address = data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;
            onCompleteRef.current?.({ zonecode: data.zonecode, address });
            setIsOpen(false);
          },
        }).embed(containerRef.current);
      })
      .catch((err) => {
        if (cancelled) return;
        setIsOpen(false);
        onErrorRef.current?.(err instanceof Error ? err.message : "우편번호 서비스를 불러오지 못했습니다");
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const modal = isOpen ? (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm" onClick={close}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-[600px] w-full max-w-[480px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-outline-variant px-4">
          <span className="text-sm font-bold text-secondary">주소 검색</span>
          <button type="button" onClick={close} className="text-xs font-semibold text-on-surface-variant hover:text-on-surface">
            닫기
          </button>
        </div>
        <div ref={containerRef} className="flex-1" />
      </div>
    </div>
  ) : null;

  return { open, modal };
}
