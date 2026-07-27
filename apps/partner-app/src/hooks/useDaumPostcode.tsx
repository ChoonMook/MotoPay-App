// 카카오(다음) 우편번호 서비스 스크립트를 지연 로드하고 화면 안에 레이어로 임베드하는 훅
// — window.open() 기반 팝업(.open())은 react-native-webview 안에서 조용히 무시되므로,
//   WebView 호환을 위해 페이지 내 레이어에 직접 그리는 embed() 방식을 사용
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
    <div className="absolute inset-0 z-[80] bg-white">
      <div className="absolute inset-x-0 top-[46px] flex h-[52px] items-center justify-between border-b border-gray-100 px-4">
        <span className="text-[15px] font-bold text-gray-900">주소 검색</span>
        <button type="button" onClick={close} className="p-2 text-sm font-semibold text-gray-500">
          닫기
        </button>
      </div>
      <div ref={containerRef} className="absolute inset-x-0 top-[98px] bottom-0" />
    </div>
  ) : null;

  return { open, modal };
}
