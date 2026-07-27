// CU-SHOP-02: 상품 검색·카테고리 - 검색창(최근/인기 검색어) + 카테고리(1depth)·정렬 + 상품 목록을 한 화면에 통합
// 원본 dc.html은 "카테고리·목록"과 "검색"을 별도 화면 2개로 뒀지만, 프로그램목록표는 파일 1개(검색창+카테고리트리+상품리스트)로 정의해 사용자 확인 후 통합 구현함
import { SearchIcon, HeartIcon } from "./shopIcons";
import { PRODUCTS, ALL_PRODUCT_IDS, CATEGORY_META, SORT_META, POPULAR_KEYWORDS } from "./shopData";
import { nfmt } from "./shopFormat";
import type { Product } from "./shopTypes";

interface ProdSearchCatScreenProps {
  onBack: () => void;
  cat: string;
  onSelectCat: (cat: string) => void;
  sort: string;
  onSelectSort: (sort: string) => void;
  search: string;
  onChangeSearch: (v: string) => void;
  recent: string[];
  onRemoveRecent: (label: string) => void;
  wish: Record<string, boolean>;
  onToggleWish: (pid: string) => void;
  onOpenDetail: (pid: string) => void;
}

export default function ProdSearchCatScreen({
  onBack,
  cat,
  onSelectCat,
  sort,
  onSelectSort,
  search,
  onChangeSearch,
  recent,
  onRemoveRecent,
  wish,
  onToggleWish,
  onOpenDetail,
}: ProdSearchCatScreenProps) {
  const searching = search.trim().length > 0;

  let listItems: Product[] = ALL_PRODUCT_IDS.map((id) => PRODUCTS[id]);
  if (searching) {
    const q = search.trim().toLowerCase();
    listItems = listItems.filter((p) => (p.name + p.brand).toLowerCase().includes(q));
  } else {
    if (cat !== "all") listItems = listItems.filter((p) => p.cat === cat);
    if (sort === "low") listItems = [...listItems].sort((a, b) => a.price - b.price);
    else if (sort === "high") listItems = [...listItems].sort((a, b) => b.price - a.price);
    else if (sort === "new") listItems = [...listItems].reverse();
  }

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex-none border-b border-gray-100 bg-white pt-[50px] pr-3.5 pb-3 pl-3.5">
        <div className="flex items-center gap-2">
          <span onClick={onBack} className="flex h-8 w-8 flex-none cursor-pointer items-center justify-center text-gray-800">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </span>
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-300 bg-gray-50 px-3.5">
            <span className="text-gray-500">
              <SearchIcon size={17} />
            </span>
            <input
              value={search}
              onChange={(e) => onChangeSearch(e.target.value)}
              placeholder="상품명·브랜드 검색"
              className="flex-1 border-none bg-transparent py-[11px] text-[13.5px] text-gray-900 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-4 pb-6">
        {!searching && recent.length > 0 && (
          <>
            <div className="mx-0.5 mb-2.5 text-[13px] font-extrabold text-gray-900">최근 검색어</div>
            <div className="mb-[22px] flex flex-wrap gap-2">
              {recent.map((r) => (
                <span key={r} className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 py-2 pr-2 pl-3.5 text-[12.5px] font-semibold text-gray-600">
                  <span onClick={() => onChangeSearch(r)} className="cursor-pointer">
                    {r}
                  </span>
                  <span onClick={() => onRemoveRecent(r)} className="cursor-pointer text-gray-500">
                    ✕
                  </span>
                </span>
              ))}
            </div>
          </>
        )}

        {!searching && (
          <>
            <div className="mx-0.5 mb-2.5 text-[13px] font-extrabold text-gray-900">인기 검색어</div>
            <div className="mb-[22px] flex flex-col gap-0.5">
              {POPULAR_KEYWORDS.map((label, i) => (
                <div key={label} onClick={() => onChangeSearch(label)} className="flex cursor-pointer items-center gap-2.5 py-2.5">
                  <span className={`w-4 text-[13px] font-extrabold ${i < 3 ? "text-brand" : "text-gray-500"}`}>{i + 1}</span>
                  <span className="text-[13.5px] font-semibold text-gray-800">{label}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {!searching && (
          <div className="mp-scroll -mx-0.5 mb-2.5 flex gap-1.5 overflow-x-auto px-0.5 pb-0.5">
            {CATEGORY_META.map((c) => (
              <span
                key={c.key}
                onClick={() => onSelectCat(c.key)}
                className={`flex-none cursor-pointer rounded-full px-3.5 py-2 text-[12.5px] ${
                  cat === c.key ? "bg-brand font-extrabold text-white" : "bg-gray-50 font-semibold text-gray-600"
                }`}
              >
                {c.label}
              </span>
            ))}
          </div>
        )}
        {!searching && (
          <div className="mb-3.5 flex gap-1.5">
            {SORT_META.map((s) => (
              <span
                key={s.key}
                onClick={() => onSelectSort(s.key)}
                className={`flex-none cursor-pointer rounded-full px-3.5 py-2 text-[12.5px] ${
                  sort === s.key ? "bg-brand font-extrabold text-white" : "bg-gray-50 font-semibold text-gray-600"
                }`}
              >
                {s.label}
              </span>
            ))}
          </div>
        )}
        {searching && (
          <div className="mx-0.5 mb-3 text-[12.5px] text-gray-500">
            '{search}' 검색 결과 {listItems.length}건
          </div>
        )}

        {listItems.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 py-[60px] text-center">
            <span className="text-gray-300">
              <SearchIcon size={44} />
            </span>
            <div className="text-sm font-bold text-gray-600">검색 결과가 없어요</div>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {listItems.map((p) => {
              const hasDisc = !!p.orig;
              const discPct = hasDisc ? Math.round((1 - p.price / (p.orig as number)) * 100) : 0;
              const wished = !!wish[p.id];
              return (
                <div key={p.id} onClick={() => onOpenDetail(p.id)} className="flex cursor-pointer gap-3">
                  <span className="relative h-[78px] w-[78px] flex-none overflow-hidden rounded-xl bg-gray-100">
                    <img src={p.img} alt={p.name} className="h-full w-full object-cover" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="text-[11.5px] font-bold text-brand">{p.brand}</div>
                    <div className="mt-0.5 text-[13.5px] leading-[1.35] font-bold text-gray-900">{p.name}</div>
                    <div className="mt-[5px] flex items-baseline gap-1.5">
                      {hasDisc && <span className="text-[12.5px] font-extrabold text-accent-strong">{discPct}%</span>}
                      <span className="text-sm font-extrabold text-gray-900 tabular-nums">{nfmt(p.price)}원</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-gray-500">
                      ★ {p.rating} · 후기 {p.reviews}
                    </div>
                  </div>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWish(p.id);
                    }}
                    className="flex-none self-start"
                  >
                    <HeartIcon filled={wished} color={wished ? "var(--color-accent)" : "var(--gray-400)"} />
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
