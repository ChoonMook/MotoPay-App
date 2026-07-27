// 모바일에서는 전체 화면, 데스크톱 반응형 웹에서는 앱 카드 컬럼(최대 420px)으로 보여주는 공용 레이아웃
import type { ReactNode } from "react";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 sm:flex sm:items-center sm:justify-center sm:py-8">
      <div className="relative mx-auto min-h-screen w-full max-w-[420px] overflow-hidden bg-white sm:min-h-[812px] sm:rounded-[30px] sm:shadow-2xl sm:ring-1 sm:ring-black/5">
        {children}
      </div>
    </div>
  );
}
