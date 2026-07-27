// CU-RSVC-05: 제품 검색·선택 - 제품 수가 많은 항목(썬팅) 전용 검색형 선택 화면
import shopThumb from "../../../../assets/images/shop.png";
import { BackIcon, SearchIcon, CircleXIcon } from "../../rsvIcons";
import { TINT_PRODUCTS, BRAND_DEFS } from "../../rsvTypes";

interface ProdSearchSelScreenProps {
  search: string;
  brand: string;
  selectedName: string;
  onSearchChange: (value: string) => void;
  onBrandChange: (brand: string) => void;
  onSelect: (name: string) => void;
  onBack: () => void;
}

export default function ProdSearchSelScreen({
  search,
  brand,
  selectedName,
  onSearchChange,
  onBrandChange,
  onSelect,
  onBack,
}: ProdSearchSelScreenProps) {
  const q = search.trim().toLowerCase();
  const results = TINT_PRODUCTS.filter(
    (p) => (brand === "all" || p.bkey === brand) && (!q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q))
  );

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex-none bg-white pt-[50px]">
        <div className="flex items-center gap-1.5 px-2.5">
          <span onClick={onBack} className="flex h-9 w-9 cursor-pointer items-center justify-center text-gray-800">
            <BackIcon />
          </span>
          <span className="text-base font-bold text-gray-900">제품 검색·선택 · 썬팅</span>
        </div>
      </div>
      <div className="flex-none border-b border-gray-100 bg-white px-5 pt-3 pb-2.5">
        <div className="flex items-center gap-2.5 rounded-xl border border-gray-400 bg-white px-3.5">
          <SearchIcon />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="제품명·브랜드 검색"
            className="flex-1 border-none bg-transparent py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400"
          />
        </div>
        <div className="mp-scroll mt-2.5 flex gap-[7px] overflow-x-auto pb-0.5">
          {BRAND_DEFS.map(([k, label]) => {
            const on = brand === k;
            return (
              <span
                key={k}
                onClick={() => onBrandChange(k)}
                className={`flex-none cursor-pointer rounded-full px-3.5 py-[7px] text-[12.5px] font-semibold ${
                  on ? "bg-brand font-extrabold text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {label}
              </span>
            );
          })}
        </div>
      </div>
      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-3.5 pb-6">
        {results.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {results.map((p) => {
              const sel = selectedName === p.name;
              return (
                <div
                  key={p.name}
                  onClick={() => onSelect(p.name)}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 ${
                    sel ? "border-brand bg-brand-subtle" : "border-gray-200 bg-white"
                  }`}
                >
                  <span className="h-[52px] w-[52px] flex-none overflow-hidden rounded-[11px] bg-gray-100">
                    <img src={shopThumb} alt={p.name} className="h-full w-full object-cover" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11.5px] font-bold text-brand">{p.brand}</div>
                    <div className="mt-px text-sm font-bold text-gray-900">{p.name}</div>
                    <div className="mt-0.5 text-[11.5px] text-gray-500">{p.spec}</div>
                  </div>
                  <span
                    className={`flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full text-xs text-white ${
                      sel ? "bg-brand" : "border-2 border-gray-300"
                    }`}
                  >
                    {sel ? "✓" : ""}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2.5 px-5 py-[60px] text-center">
            <span className="text-gray-300">
              <CircleXIcon />
            </span>
            <div className="text-sm font-bold text-gray-600">검색 결과가 없어요</div>
            <div className="text-[12.5px] text-gray-500">다른 검색어나 브랜드로 찾아보세요</div>
          </div>
        )}
      </div>
    </div>
  );
}
