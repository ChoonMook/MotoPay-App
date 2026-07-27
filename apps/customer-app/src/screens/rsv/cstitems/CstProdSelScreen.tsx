// CU-RSVC-04: 시공 제품 선택 - 항목별 제품(브랜드·모델) 선택 필드. 제품 많은 항목(썬팅)은 검색 화면으로 이동
import Button from "../../../components/ui/Button";
import RsvHeader from "../RsvHeader";
import { ChevronRightIcon, ChevronDownIcon } from "../rsvIcons";
import { ITEM_DEFS, PROD_OPTIONS, type ItemKey, type ProdItemKey } from "../rsvTypes";

const STEP_LABELS = ["항목 선택", "제품·부위", "조건 입력", "입찰 비교"];

interface CstProdSelScreenProps {
  items: Record<ItemKey, boolean>;
  prodTint: string;
  prod: Record<ProdItemKey, string>;
  prodDrop: ProdItemKey | null;
  onOpenSearch: () => void;
  onToggleDrop: (key: ProdItemKey) => void;
  onSelectProd: (key: ProdItemKey, value: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function CstProdSelScreen({
  items,
  prodTint,
  prod,
  prodDrop,
  onOpenSearch,
  onToggleDrop,
  onSelectProd,
  onBack,
  onNext,
}: CstProdSelScreenProps) {
  const selectedFields = ITEM_DEFS.filter((it) => items[it.key]);
  const hasTint = !!items.tint;

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <RsvHeader title="시공 제품 선택" onBack={onBack} steps={STEP_LABELS} current={1} />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-[18px] pb-6">
        <div className="mb-3.5 rounded-[10px] bg-gray-100 px-[13px] py-[11px] text-[13px] leading-[1.45] text-gray-600">
          항목별로 원하는 <b>제품(브랜드·모델)</b>을 선택하세요. 제품이 많은 항목은 눌러서 검색할 수 있어요.
        </div>
        <div className="flex flex-col gap-3.5">
          {selectedFields.map((it) => {
            if (it.key === "tint") {
              return (
                <div key={it.key}>
                  <div className="mx-0.5 mb-2 flex items-center gap-1.5 text-sm font-extrabold text-gray-900">{it.name}</div>
                  <div
                    onClick={onOpenSearch}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-400 bg-white px-[15px] py-3.5"
                  >
                    <span className="text-[13.5px] font-bold text-gray-900">{prodTint}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-brand">
                      검색·변경
                      <ChevronRightIcon color="var(--color-brand)" />
                    </span>
                  </div>
                </div>
              );
            }
            const key = it.key as ProdItemKey;
            const value = prod[key] || "선택하세요";
            const open = prodDrop === key;
            const opts = PROD_OPTIONS[key] || [];
            return (
              <div key={it.key}>
                <div className="mx-0.5 mb-2 flex items-center gap-1.5 text-sm font-extrabold text-gray-900">{it.name}</div>
                <div
                  onClick={() => onToggleDrop(key)}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-400 bg-white px-[15px] py-3.5"
                >
                  <span className="text-[13.5px] font-bold text-gray-900">{value}</span>
                  <ChevronDownIcon />
                </div>
                {open && (
                  <div className="mt-1.5 rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm">
                    {opts.map((label) => {
                      const sel = prod[key] === label;
                      return (
                        <div
                          key={label}
                          onClick={() => onSelectProd(key, label)}
                          className={`flex cursor-pointer items-center justify-between gap-2.5 rounded-lg px-3 py-[11px] ${sel ? "bg-brand-subtle" : ""}`}
                        >
                          <span className={`text-[13px] ${sel ? "font-bold text-brand" : "font-semibold text-gray-800"}`}>{label}</span>
                          <span className="w-4 text-center text-xs font-extrabold text-brand">{sel ? "✓" : ""}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-6">
        <Button size="xl" onClick={onNext}>
          {hasTint ? "부위·농도 선택하기" : "조건 입력으로"}
        </Button>
      </div>
    </div>
  );
}
