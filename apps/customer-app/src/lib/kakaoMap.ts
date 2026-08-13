// 카카오맵 JavaScript SDK를 지연 로드하는 싱글턴 로더 — 여러 화면(업체 프로필 등)에서 반복 호출해도
// <script> 태그와 SDK 초기화(kakao.maps.load)는 한 번만 실행되도록 Promise를 캐싱한다
import { KAKAO_JS_KEY } from "../api/config";

// 카카오맵 SDK는 공식 타입 패키지를 쓰지 않고, 이 파일에서 실제로 사용하는 최소 API만 선언
declare global {
  interface Window {
    kakao?: KakaoNamespace;
  }
}

export interface KakaoNamespace {
  maps: {
    load: (callback: () => void) => void;
    LatLng: new (lat: number, lng: number) => unknown;
    Map: new (container: HTMLElement, options: { center: unknown; level: number }) => unknown;
    Marker: new (options: { position: unknown; map: unknown }) => unknown;
  };
}

let loadPromise: Promise<Window["kakao"]> | null = null;

export function loadKakaoMaps(): Promise<Window["kakao"]> {
  if (window.kakao?.maps.Map) return Promise.resolve(window.kakao);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<Window["kakao"]>((resolve, reject) => {
    if (!KAKAO_JS_KEY) {
      reject(new Error("카카오맵 키가 설정되지 않았어요."));
      return;
    }
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.kakao!.maps.load(() => resolve(window.kakao));
    };
    script.onerror = () => reject(new Error("카카오맵을 불러오지 못했어요."));
    document.head.appendChild(script);
  }).catch((err) => {
    loadPromise = null; // 실패 시 캐시를 비워 다음 호출에서 재시도 가능하게
    throw err;
  });

  return loadPromise;
}
