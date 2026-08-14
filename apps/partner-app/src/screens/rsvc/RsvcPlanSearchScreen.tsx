// PT-RSVC-07-1: 제품 검색·선택 - 제품이 많은 항목(틴팅 등)의 브랜드·검색어 기반 제품 선택
// (고객앱 CU-RSVC-05 ProdSearchSelScreen.tsx와 동일한 디자인·기능으로 구성 — 대표이미지·상세보기 팝업 포함)
import { useState } from "react";
import Button from "../../components/ui/Button";
import BottomSheet from "../../components/ui/BottomSheet";
import { API_BASE_URL } from "../../api/config";
import { won } from "./rsvcData";
import type { RsvcProduct } from "./rsvcTypes";
import { SearchIcon, CloseIcon, InfoIcon } from "./rsvcIcons";

// 상품설명(description)은 admin-app RichTextEditor로 작성되며, 본문에 삽입된 이미지는 다른 imagePath 필드와
// 동일하게 "content-images/<uuid>.<ext>" 상대경로로만 저장돼 있다 — 렌더 직전에 API_BASE_URL을 붙여
// 절대경로로 바꿔준다(apps/customer-app ProdSearchSelScreen.tsx와 동일한 방식)
const CONTENT_IMAGE_REL_PREFIX = "content-images/";
function hydrateContentImageSrcs(html: string): string {
  return html.replaceAll(`src="${CONTENT_IMAGE_REL_PREFIX}`, `src="${API_BASE_URL}/uploads/${CONTENT_IMAGE_REL_PREFIX}`);
}

interface RsvcPlanSearchScreenProps {
  itemName: string;
  allProducts: RsvcProduct[];
  selectedProductCode: string | null;
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
  selectedProductCode,
  search,
  onChangeSearch,
  brand,
  onChangeBrand,
  onSelect,
  onBack,
}: RsvcPlanSearchScreenProps) {
  const [detailProduct, setDetailProduct] = useState<RsvcProduct | null>(null);

  const brandDefs: [string, string][] = [["all", "전체"]];
  for (const p of allProducts) {
    const key = p.brand ?? "ETC";
    if (!brandDefs.some(([k]) => k === key)) brandDefs.push([key, p.brand ?? "기타"]);
  }

  const q = search.trim().toLowerCase();
  const results = allProducts.filter(
    (p) => (brand === "all" || (p.brand ?? "ETC") === brand) && (!q || p.name.toLowerCase().includes(q)),
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
              const on = p.productCode === selectedProductCode;
              return (
                <div
                  key={p.productCode}
                  onClick={() => onSelect(p)}
                  className={`flex cursor-pointer items-center gap-3 rounded-[14px] border p-3 ${
                    on ? "border-brand bg-brand-subtle" : "border-gray-200 bg-white"
                  }`}
                >
                  <span className="h-[52px] w-[52px] flex-none overflow-hidden rounded-[11px] bg-gray-100">
                    {p.imagePath && (
                      <img src={`${API_BASE_URL}/uploads/${p.imagePath}`} alt={p.name} className="h-full w-full object-cover" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11.5px] font-bold text-brand">{p.brand}</div>
                    <div className="mt-px text-sm font-bold text-gray-800">{p.name}</div>
                    <div className="mt-0.5 text-[11.5px] text-gray-500">판매가 {won(p.price)}</div>
                  </div>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailProduct(p);
                    }}
                    className="flex-none text-gray-400"
                  >
                    <InfoIcon />
                  </span>
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

      {detailProduct && (
        <BottomSheet onClose={() => setDetailProduct(null)} maxHeight="88%">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-lg font-extrabold text-gray-900">상품 상세</span>
            <span onClick={() => setDetailProduct(null)} className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center text-gray-500">
              <CloseIcon />
            </span>
          </div>
          <span className="block aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gray-100">
            {detailProduct.imagePath && (
              <img
                src={`${API_BASE_URL}/uploads/${detailProduct.imagePath}`}
                alt={detailProduct.name}
                className="h-full w-full object-cover"
              />
            )}
          </span>
          <div className="mt-3.5 text-xs font-extrabold text-brand">{detailProduct.brand ?? ""}</div>
          <div className="mt-[3px] text-[19px] font-extrabold text-gray-900">{detailProduct.name}</div>
          <div className="mt-2 flex items-baseline gap-2">
            {detailProduct.originPrice != null && detailProduct.originPrice > detailProduct.price && (
              <span className="text-[13px] text-gray-400 line-through">{won(detailProduct.originPrice)}</span>
            )}
            <span className="text-lg font-extrabold text-gray-900">{won(detailProduct.price)}</span>
          </div>
          {detailProduct.description && (
            <div
              className="mt-4 border-t border-gray-100 pt-4 text-[13px] leading-relaxed text-gray-700 [&_img]:max-w-full [&_img]:rounded-lg"
              dangerouslySetInnerHTML={{ __html: hydrateContentImageSrcs(detailProduct.description) }}
            />
          )}
          <div className="mt-6">
            <Button
              size="xl"
              onClick={() => {
                onSelect(detailProduct);
                setDetailProduct(null);
              }}
            >
              이 제품으로 선택
            </Button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
