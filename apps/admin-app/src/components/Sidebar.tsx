// 좌측 사이드바 - 로고, 그룹별 하위메뉴(접기/펼치기), 접기 토글 (uploads/sample_admin/Site.Master 사이드바 UI +
// uploads/MotoPay_메뉴구조도_v1_22.xlsx 관리자웹_사이트맵 메뉴 데이터)
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { DEFAULT_MENU_ITEM, MENU_GROUPS, type MenuLeaf } from "../lib/menuConfig";

interface SidebarProps {
  collapsed: boolean;
  activePath: string;
  onNavigate: (item: MenuLeaf) => void;
}

export default function Sidebar({ collapsed, activePath, onNavigate }: SidebarProps) {
  const activeGroupKey = MENU_GROUPS.find((g) => g.items.some((i) => i.path === activePath))?.key;
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set(activeGroupKey ? [activeGroupKey] : []));

  const toggleGroup = (key: string) => {
    if (collapsed) return; // 원본과 동일 — 접힌 상태에서는 하위메뉴를 펼치지 않음
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <aside
      className={`z-50 flex h-full shrink-0 flex-col overflow-hidden bg-secondary shadow-[2px_0_8px_rgba(0,0,0,.2)] transition-[width] duration-300 ${
        collapsed ? "w-[72px]" : "w-64"
      }`}
    >
      <div
        className="flex h-16 shrink-0 cursor-pointer items-center justify-center gap-3 px-5 transition-colors hover:bg-black/10"
        onClick={() => onNavigate(DEFAULT_MENU_ITEM)}
      >
        <img src="/icon.png" alt="MotoPay" className="h-8 w-8 rounded-lg object-contain" />
        {!collapsed && <span className="text-lg font-bold whitespace-nowrap text-[#e9ecef]">MotoPay</span>}
      </div>

      <nav className="custom-scrollbar flex-1 overflow-y-auto py-2">
        {MENU_GROUPS.map((group) => {
          const isOpen = openGroups.has(group.key);
          const Icon = group.icon;
          return (
            <div key={group.key} className="mt-1 border-t border-white/10 pt-1 first:mt-0 first:border-t-0">
              <button
                type="button"
                onClick={() => toggleGroup(group.key)}
                className="flex w-full items-center gap-3 border-l-4 border-transparent px-6 py-3 text-[#adb5bd] outline-none transition-all hover:bg-[#2b394a] hover:text-[#e9ecef]"
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && (
                  <div className="flex flex-1 items-center justify-between">
                    <span className="text-xs font-medium">{group.label}</span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                  </div>
                )}
              </button>
              {!collapsed && isOpen && (
                <div className="mt-1 pl-0">
                  {group.items.map((item) => (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => onNavigate(item)}
                      className={`flex w-full items-center gap-3 px-10 py-3 text-left text-xs tracking-tight text-[#adb5bd] transition-all hover:text-[#e9ecef] ${
                        activePath === item.path ? "bg-[#1a232e] font-semibold text-white" : ""
                      }`}
                    >
                      <div
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${activePath === item.path ? "bg-primary" : "bg-[#adb5bd]/30"}`}
                      />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="px-5 py-4 text-center text-[11px] font-medium whitespace-nowrap text-white/40 opacity-60">
          Copyright ⓒ 2026 MetaOnce
        </div>
      )}
    </aside>
  );
}
