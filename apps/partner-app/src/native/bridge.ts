// 웹뷰 하이브리드 셸(apps/customer-mobile)과 통신하는 브릿지 - 카메라 촬영·앨범 선택·푸시 토큰 발급 등 디바이스 기능 요청
// apps/customer-app/src/native/bridge.ts와 동일 프로토콜(같은 웹뷰 셸에 로드되므로 네이티브 쪽은 공용) — 수동 동기화 필요.
// 파트너센터도 이 웹뷰 셸을 그대로 쓰지만, 여태 이 브릿지를 연결한 적이 없어 사진 촬영/앨범 선택이 브라우저 기본
// <input type="file"> 방식에만 의존했고, 그 방식이 이 웹뷰에서 파일선택창 자체를 못 띄우는 문제가 있어 새로 연결함
type BridgeRequest =
  | { type: "camera:capture"; requestId: string }
  | { type: "camera:pickFromLibrary"; requestId: string }
  | { type: "push:getToken"; requestId: string };

type BridgeResponse =
  | { type: "camera:result"; requestId: string; ok: true; base64: string; mimeType: string }
  | { type: "camera:result"; requestId: string; ok: false; error: string }
  | { type: "push:result"; requestId: string; ok: true; expoPushToken: string; platform: "ios" | "android" }
  | { type: "push:result"; requestId: string; ok: false; error: string };

export interface CapturedImage {
  base64: string;
  mimeType: string;
}

declare global {
  interface Window {
    MotoBridge?: { postMessage: (message: BridgeRequest) => void };
  }
}

/** 모토페이 파트너앱(웹뷰) 안에서 실행 중인지 여부. false면 일반 브라우저이므로 카메라/앨범 브릿지를 쓸 수 없음. */
export function isNativeBridgeAvailable(): boolean {
  return typeof window !== "undefined" && !!window.MotoBridge;
}

function requestImage(type: BridgeRequest["type"]): Promise<CapturedImage> {
  if (!isNativeBridgeAvailable()) {
    return Promise.reject(new Error("모토페이 앱에서만 사용할 수 있는 기능이에요."));
  }

  const requestId = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return new Promise<CapturedImage>((resolve, reject) => {
    const onEvent = (event: Event) => {
      const detail = (event as CustomEvent<BridgeResponse>).detail;
      if (!detail || detail.type !== "camera:result" || detail.requestId !== requestId) return;
      window.removeEventListener("motobridge", onEvent);
      if (detail.ok) {
        resolve({ base64: detail.base64, mimeType: detail.mimeType });
      } else {
        reject(new Error(detail.error));
      }
    };
    window.addEventListener("motobridge", onEvent);
    window.MotoBridge!.postMessage({ type, requestId } as BridgeRequest);
  });
}

/** 네이티브 카메라를 열어 사진을 촬영하고 base64 이미지를 반환 */
export function captureFromCamera(): Promise<CapturedImage> {
  return requestImage("camera:capture");
}

/** 네이티브 앨범에서 사진을 선택하고 base64 이미지를 반환 */
export function pickFromLibrary(): Promise<CapturedImage> {
  return requestImage("camera:pickFromLibrary");
}

export interface PushTokenResult {
  expoPushToken: string;
  platform: "ios" | "android";
}

/** 네이티브에서 알림 권한을 요청하고 Expo 푸시 토큰을 발급받음 */
export function requestPushToken(): Promise<PushTokenResult> {
  if (!isNativeBridgeAvailable()) {
    return Promise.reject(new Error("모토페이 앱에서만 사용할 수 있는 기능이에요."));
  }

  const requestId = `push:getToken-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return new Promise<PushTokenResult>((resolve, reject) => {
    const onEvent = (event: Event) => {
      const detail = (event as CustomEvent<BridgeResponse>).detail;
      if (!detail || detail.type !== "push:result" || detail.requestId !== requestId) return;
      window.removeEventListener("motobridge", onEvent);
      if (detail.ok) {
        resolve({ expoPushToken: detail.expoPushToken, platform: detail.platform });
      } else {
        reject(new Error(detail.error));
      }
    };
    window.addEventListener("motobridge", onEvent);
    window.MotoBridge!.postMessage({ type: "push:getToken", requestId });
  });
}
