// PT-RSVC-07-1: 제품 검색·선택 - 제품이 많은 항목(틴팅 등)의 브랜드·검색어 기반 제품 선택 (고객앱 CU-RSVC-05 대응)
import { won } from "./rsvcData";
import type { RsvcProduct } from "./rsvcTypes";
import { SearchIcon } from "./rsvcIcons";

interface RsvcPlanSearchScreenProps {
  itemName: string;
  allProducts: RsvcProduct[];
  selectedProductId: string;
  search: string;
  onChangeSearch: (v: string) => void;
  brand: string;
  onChangeBrand: (v: string) => void;
  onSelect: (product: RsvcProduct) => void;
  onBack: () => void;
}

export default function RsvcPlanSearchScreen({
  itemName,
  allProducts,
  selectedProductId,
  search,
  onChangeSearch,
  brand,
  onChangeBrand,
  onSelect,
  onBack,
}: RsvcPlanSearchScreenProps) {
  const brandDefs: [string, string][] = [["all", "전체"]];
  for (const p of allProducts) {
    const key = p.bkey ?? p.brand;
    if (!brandDefs.some(([k]) => k === key)) brandDefs.push([key, p.brand]);
  }

  const q = search.trim().toLowerCase();
  const results = allProducts.filter(
    (p) =>
      (brand === "all" || (p.bkey ?? p.brand) === brand) &&
      (!q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)),
  );

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex-none bg-white pt-[50px] px-3">
        <div className="flex h-[50px] items-center gap-1.5">
          <span onClick={onBack} className="flex h-9 w-9 cursor-pointer items-center justify-center text-[22px] text-gray-800">
            ‹
          </span>
          <span className="text-base font-bold text-gray-900">제품 검색·선택 · {itemName}</span>
        </div>
      </div>

      <div className="flex-none border-b border-gray-100 bg-white px-5 pt-1.5 pb-2.5">
        <div className="flex items-center gap-2.5 rounded-xl border border-gray-400 bg-gray-50 px-3.5">
          <SearchIcon />
          <input
            value={search}
            onChange={(e) => onChangeSearch(e.target.value)}
            placeholder="제품명·브랜드 검색"
            className="flex-1 border-none bg-transparent py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400"
          />
        </div>
        <div className="mp-scroll mt-2.5 flex gap-[7px] overflow-x-auto pb-0.5">
          {brandDefs.map(([key, label]) => (
            <span
              key={key}
              onClick={() => onChangeBrand(key)}
              className={`flex-none cursor-pointer rounded-full px-3.5 py-[7px] text-[12.5px] font-bold ${
                brand === key ? "bg-brand text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="mp-scroll flex-1 overflow-y-auto px-5 py-3.5">
        {results.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 px-5 py-[60px] text-center">
            <div className="text-sm font-bold text-gray-600">검색 결과가 없어요</div>
            <div className="text-[12.5px] text-gray-500">다른 검색어나 브랜드로 찾아보세요</div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {results.map((p) => {
              const on = p.id === selectedProductId;
              return (
                <div
                  key={p.id}
                  onClick={() => onSelect(p)}
                  className={`flex cursor-pointer items-center gap-3 rounded-[14px] border p-3 ${
                    on ? "border-brand bg-brand-subtle" : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[11.5px] font-bold text-brand">{p.brand}</div>
                    <div className="mt-px text-sm font-bold text-gray-800">{p.name}</div>
                    <div className="mt-0.5 text-[11.5px] text-gray-500">소비자가 {won(p.price)}</div>
                  </div>
                  <span
                    className={`flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full text-xs text-white ${
                      on ? "bg-brand" : "border-2 border-gray-300"
                    }`}
                  >
                    {on ? "✓" : ""}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
