// 웹뷰 하이브리드 셸(apps/customer-mobile)과 통신하는 브릿지 - 카메라 촬영·앨범 선택·푸시 토큰 발급 등 디바이스 기능 요청
// 메시지 타입은 apps/customer-mobile/src/bridge/protocol.ts와 반드시 동일하게 유지해야 함(별도 프로젝트라 공유 불가, 수동 동기화)
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
    // 네이티브 셸(customer-mobile)이 푸시 알림 탭 시 injectJavaScript로 호출 — App.tsx가 마운트 시 할당
    // 실제 페이로드는 { type, ...나머지 data 필드 } 하나로 평평한 객체(push-notification.service.ts의 Expo data와 동일)
    __motoHandlePushTap?: (payload: Record<string, string> & { type: string }) => void;
  }
}

/** 모토페이 앱(웹뷰) 안에서 실행 중인지 여부. false면 일반 브라우저이므로 카메라/앨범 브릿지를 쓸 수 없음. */
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
