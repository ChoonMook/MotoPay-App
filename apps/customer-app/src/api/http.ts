// apps/api 호출 공통 fetch 헬퍼 — 인증 불필요/필요 두 버전을 함께 제공
// authedRequest는 accessToken 만료(401) 시 refreshToken으로 자동 재발급 후 원 요청을 1회 재시도한다.
// refreshToken도 만료·무효면 토큰을 지우고 세션 만료를 알려(App.tsx가 로그인 화면으로 돌려보냄) 사용자에게는
// "다시 로그인해주세요" 메시지만 노출한다.
import { API_BASE_URL } from "./config";
import { getAccessToken, getRefreshToken, updateTokens, clearTokens, notifySessionExpired } from "./tokenStorage";

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
    throw new Error(message || "요청을 처리하지 못했습니다.");
  }
  return response.json();
}

async function rawFetch(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(`${API_BASE_URL}${path}`, init);
  } catch {
    throw new Error("서버에 연결할 수 없어요. 네트워크 상태를 확인해주세요.");
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await rawFetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  return handle<T>(response);
}

let refreshInFlight: Promise<boolean> | null = null;

/** refreshToken으로 accessToken 재발급 시도 — 동시에 여러 요청이 401을 받아도 재발급은 한 번만 수행 */
function refreshAccessToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return false;
      try {
        const response = await rawFetch("/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (!response.ok) return false;
        const result = (await response.json()) as { accessToken: string; refreshToken: string };
        updateTokens(result.accessToken, result.refreshToken);
        return true;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/** 로그인이 필요한 요청 — 저장된 accessToken을 Authorization 헤더로 자동 첨부.
 * 401을 받으면 refreshToken으로 재발급 후 원 요청을 1회 재시도하고, 그마저 실패하면 세션을 만료 처리한다. */
export async function authedRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const attempt = () => {
    const token = getAccessToken();
    return rawFetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  };

  let response = await attempt();
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await attempt();
    } else {
      clearTokens();
      notifySessionExpired();
      throw new Error("세션이 만료되었어요. 다시 로그인해주세요.");
    }
  }
  return handle<T>(response);
}
