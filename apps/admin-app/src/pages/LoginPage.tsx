// 관리자웹 로그인 화면 (uploads/sample_admin/Login.aspx, sample_login.png 이식)
// AD-SYS-03(공통 코드 관리) API 연계를 위해 apps/api의 /admin-auth/login에 연결한 실 로그인
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { login as loginApi } from "../api/adminAuth";
import { setTokens } from "../api/tokenStorage";
import { getRememberedId, setRememberedId } from "../lib/rememberedId";
import { DEFAULT_MENU_ITEM } from "../lib/menuConfig";

export default function LoginPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(() => getRememberedId());
  const [password, setPassword] = useState("");
  const [rememberId, setRememberIdChecked] = useState(() => !!getRememberedId());
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !password.trim()) {
      setError("아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const result = await loginApi(userId.trim(), password);
      setTokens(result.accessToken, result.refreshToken);
      setRememberedId(rememberId ? userId.trim() : null);
      navigate(DEFAULT_MENU_ITEM.path, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img src="/icon.png" alt="MotoPay Logo" className="mx-auto mb-4 h-12 w-12 rounded-2xl object-contain" />
          <h1 className="mb-1 text-2xl font-bold text-secondary">모토페이 관리시스템</h1>
          <p className="text-xs font-medium text-on-surface-variant">프리미엄 자동차 라이프의 시작</p>
        </div>

        <form onSubmit={onSubmit} className="rounded-2xl border border-outline-variant/50 bg-white p-10 shadow-sm">
          <div className="flex flex-col gap-5">
            <div className="space-y-2">
              <label className="ml-1 text-[12px] font-bold tracking-widest text-secondary uppercase">사용자 ID</label>
              <div className="group relative">
                <span className="absolute top-1/2 left-4 -translate-y-1/2 text-outline transition-colors group-focus-within:text-primary">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="아이디를 입력하세요"
                  className="w-full rounded-lg border border-[#ced4da] bg-white py-2.5 pr-4 pl-11 text-xs font-normal outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-[12px] font-bold tracking-widest text-secondary uppercase">비밀번호</label>
              <div className="group relative">
                <span className="absolute top-1/2 left-4 -translate-y-1/2 text-outline transition-colors group-focus-within:text-primary">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full rounded-lg border border-[#ced4da] bg-white py-2.5 pr-12 pl-11 text-xs font-normal outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-4 -translate-y-1/2 text-outline outline-none transition-colors hover:text-secondary"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="mt-1 flex items-center justify-between px-1">
              <label className="group flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberId}
                  onChange={(e) => setRememberIdChecked(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-[#ced4da] text-primary"
                />
                <span className="text-[12px] font-medium text-on-surface-variant transition-colors group-hover:text-primary">
                  내 아이디 기억하기
                </span>
              </label>
              <a href="#" className="text-[11px] font-bold text-primary hover:underline">
                비밀번호 찾기
              </a>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full cursor-pointer rounded-lg bg-primary py-3 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "로그인 중..." : "로그인"}
            </button>

            {error && (
              <div className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 py-2.5">
                <span className="text-[12px] font-semibold text-red-600">{error}</span>
              </div>
            )}
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[11px] font-bold tracking-tighter text-outline uppercase">
            Copyright ⓒ 2026 MetaOnce. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
