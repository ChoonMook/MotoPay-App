// 아직 실구현하지 않은 메뉴가 여는 준비중 안내 화면 - 사이드바 전체 메뉴·MDI 탭 동작은 여기서도 그대로 확인 가능
import { Construction } from "lucide-react";
import { findBreadcrumb } from "../lib/menuConfig";
import PageBreadcrumb from "../components/PageBreadcrumb";

export default function PlaceholderPage({ path }: { path: string }) {
  const { itemLabel } = findBreadcrumb(path);
  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-8 py-6">
      <PageBreadcrumb path={path} />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-outline">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container text-outline">
          <Construction className="h-8 w-8" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-on-surface">{itemLabel} 화면은 준비 중입니다</p>
          <p className="mt-1 text-xs text-outline">빠른 시일 내에 제공될 예정이에요.</p>
        </div>
      </div>
    </div>
  );
}
