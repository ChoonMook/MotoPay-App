// 콘텐츠 페이지 상단 breadcrumb(HOME > 그룹 > 항목) - 원본에서 각 *.aspx 콘텐츠가 자체적으로 그리던 영역
import { ChevronRight } from "lucide-react";
import { findBreadcrumb } from "../lib/menuConfig";

export default function PageBreadcrumb({ path }: { path: string }) {
  const { groupLabel, itemLabel } = findBreadcrumb(path);
  return (
    <div className="flex items-center gap-2 text-[12px] font-bold tracking-widest text-on-surface-variant uppercase">
      <span>HOME</span>
      <ChevronRight className="h-3.5 w-3.5 text-outline" />
      {groupLabel && (
        <>
          <span>{groupLabel}</span>
          <ChevronRight className="h-3.5 w-3.5 text-outline" />
        </>
      )}
      <span>{itemLabel}</span>
    </div>
  );
}
