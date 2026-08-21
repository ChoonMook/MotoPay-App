// apps/api의 앱버전관리 관리자 엔드포인트(/admin/app-version-policies/*) 호출 — AD-SYS-06 앱버전관리 화면 전용
import { authedRequest } from "./http";

export interface AppVersionPolicy {
  platform: string;
  minVersionCode: number;
  minVersionName: string;
  latestVersionCode: number | null;
  latestVersionName: string | null;
  downloadUrl: string;
  message: string;
  useYn: boolean;
  updatedBy: string | null;
  updatedAt: string;
}

export function listAppVersionPolicies(): Promise<AppVersionPolicy[]> {
  return authedRequest<AppVersionPolicy[]>("/admin/app-version-policies");
}

export interface UpdateAppVersionPolicyInput {
  minVersionCode?: number;
  minVersionName?: string;
  latestVersionCode?: number | null;
  latestVersionName?: string | null;
  downloadUrl?: string;
  message?: string;
  useYn?: boolean;
}

export function updateAppVersionPolicy(
  platform: string,
  input: UpdateAppVersionPolicyInput,
): Promise<AppVersionPolicy> {
  return authedRequest<AppVersionPolicy>(`/admin/app-version-policies/${platform}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
