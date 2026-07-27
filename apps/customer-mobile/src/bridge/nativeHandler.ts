// 브릿지 요청을 실제 네이티브 동작(카메라 촬영·앨범 선택)으로 실행하고 결과를 BridgeResponse로 반환
import * as ImagePicker from "expo-image-picker";
import type { BridgeRequest, BridgeResponse } from "./protocol";

type PickResult = { ok: true; base64: string; mimeType: string } | { ok: false; error: string };

async function pickImage(launch: () => Promise<ImagePicker.ImagePickerResult>): Promise<PickResult> {
  const result = await launch();
  const base64 = result.canceled ? null : result.assets?.[0]?.base64;
  if (!base64) {
    return { ok: false, error: "사용자가 취소했거나 이미지를 가져오지 못했어요." };
  }
  const mimeType = result.canceled ? undefined : result.assets?.[0]?.mimeType;
  return { ok: true, base64, mimeType: mimeType ?? "image/jpeg" };
}

export async function handleBridgeRequest(request: Exclude<BridgeRequest, { type: "nav:exit" }>): Promise<BridgeResponse> {
  if (request.type === "camera:capture") {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      return { type: "camera:result", requestId: request.requestId, ok: false, error: "카메라 권한이 필요해요." };
    }
    const outcome = await pickImage(() => ImagePicker.launchCameraAsync({ base64: true, quality: 0.7 }));
    return { type: "camera:result", requestId: request.requestId, ...outcome };
  }

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    return { type: "camera:result", requestId: request.requestId, ok: false, error: "앨범 접근 권한이 필요해요." };
  }
  const outcome = await pickImage(() => ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.7, mediaTypes: ["images"] }));
  return { type: "camera:result", requestId: request.requestId, ...outcome };
}
