// CU-RSVC-05: 제품 검색·선택 - 모든 시공항목이 공용으로 쓰는 검색형 선택 화면(이전엔 썬팅 전용이었으나
// CstProdSelScreen의 나머지 항목 인라인 드롭다운을 없애고 이 화면으로 통일함)
// 실제 카탈로그(GET /products?prodCat=<항목>&bidApplicable=true) 조회 결과에서 검색 — RsvFlow.tsx가 조회해 내려줌
// 카드의 "상세" 버튼을 누르면 그 제품의 상세 정보(대표이미지·가격·설명)를 바텀시트로 보여준다(선택과는 별개 동작)
import { useState } from "react";
import Button from "../../../../components/ui/Button";
import BottomSheet from "../../../../components/ui/BottomSheet";
import { API_BASE_URL } from "../../../../api/config";
import type { ProductApi } from "../../../../api/products";
import shopThumb from "../../../../assets/images/shop.png";
import { BackIcon, SearchIcon, CircleXIcon, CloseIcon, InfoIcon } from "../../rsvIcons";
import { nfmt } from "../../rsvFormat";

// 상품설명(description)은 admin-app RichTextEditor로 작성되며, 본문에 삽입된 이미지는 다른 imagePath 필드와
// 동일하게 "content-images/<uuid>.<ext>" 상대경로로만 저장돼 있다(호스트가 바뀌어도 깨지지 않도록) — 그대로
// dangerouslySetInnerHTML에 넣으면 현재 페이지 origin 기준으로 잘못 풀려 이미지가 안 뜨므로, 렌더 직전에
// API_BASE_URL을 붙여 절대경로로 바꿔준다(admin-app RichTextEditor.tsx의 hydrate와 동일한 방식)
const CONTENT_IMAGE_REL_PREFIX = "content-images/";
function hydrateContentImageSrcs(html: string): string {
  return html.replaceAll(`src="${CONTENT_IMAGE_REL_PREFIX}`, `src="${API_BASE_URL}/uploads/${CONTENT_IMAGE_REL_PREFIX}`);
}

interface ProdSearchSelScreenProps {
  title: string;
  search: string;
  brand: string;
  selectedName: string;
  products: ProductApi[];
  brandDefs: Array<[string, string]>;
  loading: boolean;
  onSearchChange: (value: string) => void;
  onBrandChange: (brand: string) => void;
  onSelect: (name: string) => void;
  onBack: () => void;
}

export default function ProdSearchSelScreen({
  title,
  search,
  brand,
  selectedName,
  products,
  brandDefs,
  loading,
  onSearchChange,
  onBrandChange,
  onSelect,
  onBack,
}: ProdSearchSelScreenProps) {
  const [detailProduct, setDetailProduct] = useState<ProductApi | null>(null);
  const q = search.trim().toLowerCase();
  const results = products.filter(
    (p) => (brand === "all" || p.brand === brand) && (!q || p.name.toLowerCase().includes(q)),
  );
  const brandLabel = (code: string) => brandDefs.find(([c]) => c === code)?.[1] ?? code;

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex-none bg-white pt-[50px]">
        <div className="flex items-center gap-1.5 px-2.5">
          <span onClick={onBack} className="flex h-9 w-9 cursor-pointer items-center justify-center text-gray-800">
            <BackIcon />
          </span>
          <span className="text-base font-bold text-gray-900">제품 검색·선택 · {title}</span>
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
          {brandDefs.map(([k, label]) => {
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
        {loading ? (
          <div className="py-10 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : results.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {results.map((p) => {
              const sel = selectedName === p.name;
              return (
                <div
                  key={p.productCode}
                  onClick={() => onSelect(p.name)}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 ${
                    sel ? "border-brand bg-brand-subtle" : "border-gray-200 bg-white"
                  }`}
                >
                  <span className="h-[52px] w-[52px] flex-none overflow-hidden rounded-[11px] bg-gray-100">
                    <img
                      src={p.imagePath ? `${API_BASE_URL}/uploads/${p.imagePath}` : shopThumb}
                      alt={p.name}
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11.5px] font-bold text-brand">{p.brand ? brandLabel(p.brand) : ""}</div>
                    <div className="mt-px text-sm font-bold text-gray-900">{p.name}</div>
                    <div className="mt-0.5 text-[11.5px] text-gray-500">{nfmt(p.price)}원</div>
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

      {detailProduct && (
        <BottomSheet onClose={() => setDetailProduct(null)} maxHeight="88%">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-lg font-extrabold text-gray-900">상품 상세</span>
            <span onClick={() => setDetailProduct(null)} className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center text-gray-500">
              <CloseIcon />
            </span>
          </div>
          <span className="block aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gray-100">
            <img
              src={detailProduct.imagePath ? `${API_BASE_URL}/uploads/${detailProduct.imagePath}` : shopThumb}
              alt={detailProduct.name}
              className="h-full w-full object-cover"
            />
          </span>
          <div className="mt-3.5 text-xs font-extrabold text-brand">{detailProduct.brand ? brandLabel(detailProduct.brand) : ""}</div>
          <div className="mt-[3px] text-[19px] font-extrabold text-gray-900">{detailProduct.name}</div>
          <div className="mt-2 flex items-baseline gap-2">
            {detailProduct.originPrice != null && detailProduct.originPrice > detailProduct.price && (
              <span className="text-[13px] text-gray-400 line-through">{nfmt(detailProduct.originPrice)}원</span>
            )}
            <span className="text-lg font-extrabold text-gray-900">{nfmt(detailProduct.price)}원</span>
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
                onSelect(detailProduct.name);
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
