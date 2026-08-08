// 접근권한이 없는 메뉴에 URL로 직접 접근했을 때 노출되는 차단 화면(AD-SYS-05 메뉴권한관리 연동) — 잠시 안내 후
// 기본 메뉴로 자동 이동. 기본 메뉴 자체가 차단된 경우(redirectToHome=false)는 무한 리다이렉트를 막기 위해
// 추가 이동 없이 안내만 표시한다.
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { DEFAULT_MENU_ITEM } from "../lib/menuConfig";

interface AccessDeniedPageProps {
  message?: string;
  redirectToHome?: boolean;
}

export default function AccessDeniedPage({
  message = "이 메뉴에 접근할 권한이 없습니다.",
  redirectToHome = true,
}: AccessDeniedPageProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!redirectToHome) return;
    const timer = setTimeout(() => {
      navigate(`${DEFAULT_MENU_ITEM.path}?frame=Y`, { replace: true });
    }, 1800);
    return () => clearTimeout(timer);
  }, [redirectToHome, navigate]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-8 py-6 text-outline">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-on-surface">{message}</p>
        <p className="mt-1 text-xs text-outline">
          {redirectToHome ? "잠시 후 기본 화면으로 이동합니다." : "관리자에게 권한 부여를 요청해주세요."}
        </p>
      </div>
    </div>
  );
}
