// apps/api의 앱 강제 업데이트 정책 조회(공개 API, 인증 불필요) — motopay-mobile 안에서 앱 진입 시 호출
import { API_BASE_URL } from "./config";

export interface AppVersionPolicy {
  platform: string;
  minVersionCode: number;
  minVersionName: string;
  latestVersionCode: number | null;
  latestVersionName: string | null;
  downloadUrl: string;
  message: string;
  useYn: boolean;
}

export async function getAppVersionPolicy(platform: string): Promise<AppVersionPolicy> {
  const response = await fetch(`${API_BASE_URL}/app-version/policy?platform=${platform}`);
  if (!response.ok) {
    throw new Error("버전 정책을 불러오지 못했습니다.");
  }
  return response.json();
}
