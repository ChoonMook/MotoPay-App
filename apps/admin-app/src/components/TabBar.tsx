// MDI 탭바 - 열린 탭 렌더링, 클릭 전환, X로 개별 닫기, Clear All (원본 Site.Master #tabs-bar-container 이식)
// 드래그 정렬(jQuery UI sortable)은 iframe MDI 핵심 동작에는 불필요해 이번 스코프에서 제외
import { ListX, X } from "lucide-react";
import { DEFAULT_TAB, type AdminTab } from "../lib/tabStorage";

interface TabBarProps {
  tabs: AdminTab[];
  activeTab: string;
  onActivate: (path: string) => void;
  onClose: (path: string) => void;
  onClearAll: () => void;
}

export default function TabBar({ tabs, activeTab, onActivate, onClose, onClearAll }: TabBarProps) {
  return (
    <div className="flex shrink-0 items-center gap-1 overflow-hidden border-b border-outline-variant/50 bg-white px-6 pt-3">
      <div className="mp-scroll flex flex-1 items-center gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = tab.path === activeTab;
          return (
            <div
              key={tab.path}
              onClick={() => onActivate(tab.path)}
              className={`flex shrink-0 cursor-pointer items-center gap-2.5 overflow-hidden rounded-t-lg px-5 py-2.5 text-xs transition-all ${
                isActive ? "bg-[#f1f3f5] font-extrabold text-[#1a232e] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]" : "font-semibold text-outline hover:text-on-surface"
              }`}
            >
              <span className="font-semibold">{tab.label}</span>
              {tab.path !== DEFAULT_TAB.path && (
                <X
                  className={`h-3.5 w-3.5 rounded-full p-0.5 transition-colors ${
                    isActive ? "hover:bg-white/10 hover:text-red-400" : "hover:bg-red-50 hover:text-red-500"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose(tab.path);
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onClearAll}
        className="mb-1 flex items-center gap-1 rounded-lg border border-outline-variant/50 bg-white px-3 py-1.5 text-outline transition-all hover:border-red-300 hover:text-red-500"
      >
        <ListX className="h-4 w-4" />
        <span className="text-[11px] font-bold tracking-tighter uppercase">Clear All</span>
      </button>
    </div>
  );
}
