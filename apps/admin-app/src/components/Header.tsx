// 상단 헤더 - 사이드바 토글, 타이틀, 알림, 사용자 드롭다운(로그아웃) (uploads/sample_admin/Site.Master 헤더 이식)
// "내 정보 수정" 모달은 백엔드 연동이 없는 이번 작업 범위상 제외
import { Bell, ChevronDown, LogOut, Menu } from "lucide-react";

interface HeaderProps {
  username: string;
  onToggleSidebar: () => void;
  onLogout: () => void;
}

export default function Header({ username, onToggleSidebar, onLogout }: HeaderProps) {
  return (
    <header className="z-40 flex h-16 shrink-0 items-center justify-between border-b border-outline-variant bg-white px-6 shadow-[0_1px_4px_rgba(0,0,0,.06)]">
      <div className="flex items-center gap-4">
        <button type="button" onClick={onToggleSidebar} className="rounded-lg p-2 text-on-surface transition-colors hover:bg-surface-container">
          <Menu className="h-[22px] w-[22px]" />
        </button>
        <span className="text-sm font-bold text-secondary">모토페이 관리시스템</span>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" className="relative rounded-full p-2 text-on-surface-variant hover:bg-surface-container">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
        </button>
        <div className="mx-1 h-5 w-px bg-outline-variant" />
        <div className="group relative">
          <button type="button" className="flex items-center gap-2 rounded-xl p-2 text-on-surface outline-none transition-colors hover:bg-surface-container">
            <span className="text-xs font-bold">{username} 님</span>
            <ChevronDown className="h-[15px] w-[15px]" />
          </button>
          <div className="absolute top-full right-0 z-[60] hidden w-44 pt-1 group-hover:block">
            <div className="overflow-hidden rounded-xl border border-outline-variant bg-white py-1 shadow-xl">
              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-xs font-bold text-red-500 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" /> 로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
