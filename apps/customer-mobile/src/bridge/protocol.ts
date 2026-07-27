// 웹(apps/customer-app) ↔ 네이티브(customer-mobile) 브릿지 메시지 규격
// 이 파일의 타입은 apps/customer-app/src/native/bridge.ts와 반드시 동일하게 유지해야 함(별도 프로젝트라 공유 불가, 수동 동기화)
export type BridgeRequest =
  | { type: "camera:capture"; requestId: string }
  | { type: "camera:pickFromLibrary"; requestId: string }
  | { type: "nav:exit" };

export type BridgeResponse =
  | { type: "camera:result"; requestId: string; ok: true; base64: string; mimeType: string }
  | { type: "camera:result"; requestId: string; ok: false; error: string };
