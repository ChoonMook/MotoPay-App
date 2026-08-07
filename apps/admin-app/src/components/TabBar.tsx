// MDI 탭바 - 열린 탭 렌더링, 클릭 전환, X로 개별 닫기, Clear All, 드래그로 순서 변경 (원본 Site.Master #tabs-bar-container 이식)
// 고정된 메인 대시보드(DEFAULT_TAB)는 항상 첫 번째 자리에 고정 - 드래그 대상/드롭 대상 모두 제외
import { useRef, useState } from "react";
import { ListX, X } from "lucide-react";
import { DEFAULT_TAB, type AdminTab } from "../lib/tabStorage";

interface TabBarProps {
  tabs: AdminTab[];
  activeTab: string;
  onActivate: (path: string) => void;
  onClose: (path: string) => void;
  onClearAll: () => void;
  onReorder: (tabs: AdminTab[]) => void;
}

export default function TabBar({ tabs, activeTab, onActivate, onClose, onClearAll, onReorder }: TabBarProps) {
  const [draggedPath, setDraggedPath] = useState<string | null>(null);
  const [dragOverPath, setDragOverPath] = useState<string | null>(null);
  // dragstart 이벤트의 target은 draggable 속성을 가진 요소로 정규화되어 항상 탭 div 자신이라, 닫기(X) 버튼
  // 위에서 드래그가 시작됐는지는 그 이전에 발생하는 mousedown에서 실제 타겟을 보고 미리 기억해둔다
  const suppressDragRef = useRef(false);

  const reorder = (targetPath: string) => {
    if (!draggedPath || draggedPath === targetPath) return;
    const movable = tabs.filter((t) => t.path !== DEFAULT_TAB.path);
    const fromIdx = movable.findIndex((t) => t.path === draggedPath);
    const toIdx = movable.findIndex((t) => t.path === targetPath);
    if (fromIdx === -1 || toIdx === -1) return;
    const next = [...movable];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    onReorder([DEFAULT_TAB, ...next]);
  };

  return (
    <div className="flex shrink-0 items-center gap-1 overflow-hidden border-b border-outline-variant/50 bg-white px-6 pt-3">
      <div className="mp-scroll flex flex-1 items-center gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = tab.path === activeTab;
          const isDefault = tab.path === DEFAULT_TAB.path;
          const isDragging = draggedPath === tab.path;
          const isDragOver = !isDefault && dragOverPath === tab.path && draggedPath !== tab.path;
          return (
            <div
              key={tab.path}
              onClick={() => onActivate(tab.path)}
              draggable={!isDefault}
              onMouseDown={(e) => {
                suppressDragRef.current = !!(e.target as HTMLElement).closest("[data-tab-close]");
              }}
              onDragStart={(e) => {
                // 닫기(X) 버튼에서 시작된 드래그는 탭 순서 변경이 아니라 그냥 취소
                if (suppressDragRef.current) {
                  e.preventDefault();
                  return;
                }
                setDraggedPath(tab.path);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", tab.path);
              }}
              onDragEnd={() => {
                setDraggedPath(null);
                setDragOverPath(null);
              }}
              onDragOver={(e) => {
                if (isDefault || !draggedPath || draggedPath === tab.path) return;
                e.preventDefault();
                setDragOverPath(tab.path);
              }}
              onDragLeave={() => setDragOverPath((prev) => (prev === tab.path ? null : prev))}
              onDrop={(e) => {
                if (isDefault) return;
                e.preventDefault();
                reorder(tab.path);
                setDraggedPath(null);
                setDragOverPath(null);
              }}
              className={`flex shrink-0 items-center gap-2.5 overflow-hidden rounded-t-lg px-5 py-2.5 text-xs transition-all ${
                isDefault ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"
              } ${
                isActive ? "bg-[#f1f3f5] font-extrabold text-[#1a232e] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]" : "font-semibold text-outline hover:text-on-surface"
              } ${isDragging ? "opacity-40" : ""} ${isDragOver ? "ring-2 ring-primary/40" : ""}`}
            >
              <span className="font-semibold">{tab.label}</span>
              {!isDefault && (
                <span
                  data-tab-close
                  draggable={false}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose(tab.path);
                  }}
                  className={`flex cursor-default rounded-full p-0.5 transition-colors ${
                    isActive ? "hover:bg-white/10 hover:text-red-400" : "hover:bg-red-50 hover:text-red-500"
                  }`}
                >
                  <X className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onClearAll}
        title="전체 탭 닫기"
        className="mb-1 flex items-center rounded-lg border border-outline-variant/50 bg-white p-1.5 text-outline transition-all hover:border-red-300 hover:text-red-500"
      >
        <ListX className="h-4 w-4" />
      </button>
    </div>
  );
}
