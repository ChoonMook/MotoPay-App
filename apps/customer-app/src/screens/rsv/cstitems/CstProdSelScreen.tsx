// CU-RSVC-04: 시공 제품 선택 - 항목별 제품(브랜드·모델) 선택. 모든 항목이 동일하게 검색 팝업(ProdSearchSelScreen,
// CU-RSVC-05)으로 이동해 실제 카탈로그(Product 테이블)에서 검색·선택한다(이전엔 썬팅만 검색 팝업, 나머지는
// 인라인 드롭다운이었으나 통일함). 항목명(itemDefs)도 실제 데이터 — RsvFlow.tsx가 CAR_INST를 조회해 내려줌
import Button from "../../../components/ui/Button";
import RsvHeader from "../RsvHeader";
import { ChevronRightIcon } from "../rsvIcons";
import { type ItemDef, type ItemKey, type ProdItemKey } from "../rsvTypes";

const STEP_LABELS = ["항목 선택", "제품·부위", "조건 입력", "입찰 비교"];

interface CstProdSelScreenProps {
  items: Record<ItemKey, boolean>;
  itemDefs: ItemDef[];
  prodTint: string;
  prod: Record<ProdItemKey, string>;
  onOpenSearch: (key: ItemKey) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function CstProdSelScreen({ items, itemDefs, prodTint, prod, onOpenSearch, onBack, onNext }: CstProdSelScreenProps) {
  const selectedFields = itemDefs.filter((it) => items[it.key]);
  const hasTint = !!items.tint;

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <RsvHeader title="시공 제품 선택" onBack={onBack} steps={STEP_LABELS} current={1} />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-[18px] pb-6">
        <div className="mb-3.5 rounded-[10px] bg-gray-100 px-[13px] py-[11px] text-[13px] leading-[1.45] text-gray-600">
          항목별로 원하는 <b>제품(브랜드·모델)</b>을 선택하세요. 눌러서 검색할 수 있어요.
        </div>
        <div className="flex flex-col gap-3.5">
          {selectedFields.map((it) => {
            const value = it.key === "tint" ? prodTint : prod[it.key as ProdItemKey];
            return (
              <div key={it.key}>
                <div className="mx-0.5 mb-2 flex items-center gap-1.5 text-sm font-extrabold text-gray-900">{it.name}</div>
                <div
                  onClick={() => onOpenSearch(it.key)}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-400 bg-white px-[15px] py-3.5"
                >
                  <span className="text-[13.5px] font-bold text-gray-900">{value || "선택하세요"}</span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-brand">
                    검색·변경
                    <ChevronRightIcon color="var(--color-brand)" />
                  </span>
                </div>
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
