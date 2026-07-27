// apps/api 호출 공통 fetch 헬퍼 — 인증 불필요/필요 두 버전을 함께 제공
import { API_BASE_URL } from "./config";
import { getAccessToken } from "./tokenStorage";

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
    throw new Error(message || "요청을 처리하지 못했습니다.");
  }
  return response.json();
}

async function send<T>(path: string, init: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, init);
  } catch {
    throw new Error("서버에 연결할 수 없어요. 네트워크 상태를 확인해주세요.");
  }
  return handle<T>(response);
}

export function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  return send<T>(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

/** 로그인이 필요한 요청 — localStorage의 accessToken을 Authorization 헤더로 자동 첨부 */
export function authedRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  return send<T>(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
}
