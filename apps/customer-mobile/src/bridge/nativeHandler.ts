// 브릿지 요청을 실제 네이티브 동작(카메라 촬영·앨범 선택·푸시 토큰 발급)으로 실행하고 결과를 BridgeResponse로 반환
import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
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

async function getPushToken(requestId: string): Promise<BridgeResponse> {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) {
    return { type: "push:result", requestId, ok: false, error: "푸시 알림이 아직 설정되지 않았어요." };
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  const status = existing === "granted" ? existing : (await Notifications.requestPermissionsAsync()).status;
  if (status !== "granted") {
    return { type: "push:result", requestId, ok: false, error: "알림 권한이 필요해요." };
  }

  try {
    const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync({ projectId });
    return { type: "push:result", requestId, ok: true, expoPushToken, platform: Platform.OS === "ios" ? "ios" : "android" };
  } catch {
    return { type: "push:result", requestId, ok: false, error: "푸시 토큰을 발급받지 못했어요." };
  }
}

export async function handleBridgeRequest(request: Exclude<BridgeRequest, { type: "nav:exit" }>): Promise<BridgeResponse> {
  if (request.type === "push:getToken") {
    return getPushToken(request.requestId);
  }

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
