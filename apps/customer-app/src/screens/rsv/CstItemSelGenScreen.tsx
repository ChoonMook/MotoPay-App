// CU-RSVC-03: 시공항목 선택(일반) - 시공 상품 다중 선택, 하단 고정 바에 선택 수 실시간 표시
import Button from "../../components/ui/Button";
import RsvHeader from "./RsvHeader";
import { ITEM_DEFS, type ItemKey } from "./rsvTypes";

const STEP_LABELS = ["항목 선택", "제품·부위", "조건 입력", "입찰 비교"];

const ITEM_ICONS: Record<ItemKey, React.ReactNode> = {
  tint: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
    </svg>
  ),
  ppf: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 4v6c0 4-3 6-7 8-4-2-7-4-7-8V7z" />
    </svg>
  ),
  blackbox: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="14" height="12" rx="2" />
      <path d="M17 10l4-2v8l-4-2" />
    </svg>
  ),
  glass: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 4v6c0 4-3 6-7 8-4-2-7-4-7-8V7z" />
    </svg>
  ),
  under: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17h14M6 17l1-5h10l1 5M8 12V9h8v3" />
    </svg>
  ),
  detail: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20l6-2 9-9-4-4-9 9-2 6z" />
      <path d="M14 6l4 4" />
    </svg>
  ),
};

interface CstItemSelGenScreenProps {
  items: Record<ItemKey, boolean>;
  onToggleItem: (key: ItemKey) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function CstItemSelGenScreen({ items, onToggleItem, onBack, onNext }: CstItemSelGenScreenProps) {
  const selCount = ITEM_DEFS.filter((it) => items[it.key]).length;

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <RsvHeader title="시공항목 선택" onBack={onBack} steps={STEP_LABELS} current={0} />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-[18px] pb-6">
        <div className="mb-3.5 rounded-[10px] bg-gray-100 px-[13px] py-[11px] text-[13px] leading-[1.45] text-gray-600">
          받고 싶은 <b>시공 항목</b>을 모두 선택하세요. 다음 단계에서 항목별 제품을 고를 수 있어요.
        </div>
        <div className="flex flex-col gap-2.5">
          {ITEM_DEFS.map((it) => {
            const on = !!items[it.key];
            return (
              <div
                key={it.key}
                onClick={() => onToggleItem(it.key)}
                className={`flex cursor-pointer items-center gap-2.5 rounded-2xl border px-[15px] py-[13px] ${
                  on ? "border-brand bg-brand-subtle" : "border-gray-200 bg-white"
                }`}
              >
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-brand-subtle text-brand">
                  {ITEM_ICONS[it.key]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-gray-900">{it.name}</div>
                  <div className="mt-px text-[11.5px] text-gray-500">{it.desc}</div>
                </div>
                {it.searchable && (
                  <span className="mr-0.5 flex-none rounded bg-accent-subtle px-1.5 py-0.5 text-[9.5px] font-extrabold text-accent-strong">
                    제품 다양
                  </span>
                )}
                <span
                  className={`flex h-6 w-6 flex-none items-center justify-center rounded-[7px] text-[13px] ${
                    on ? "bg-brand text-white" : "border-[1.5px] border-gray-300 text-transparent"
                  }`}
                >
                  ✓
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-none border-t border-gray-100 bg-white">
        <div className="flex items-center justify-between px-5 pt-3">
          <span className="text-[12.5px] text-gray-600">선택한 항목</span>
          <span className="text-[13px] font-extrabold text-brand">{selCount}건</span>
        </div>
        <div className="px-5 pt-2 pb-6">
          <Button size="xl" disabled={selCount === 0} onClick={onNext}>
            {selCount ? `제품 선택으로 (${selCount}건)` : "항목을 선택하세요"}
          </Button>
        </div>
      </div>
    </div>
  );
}
