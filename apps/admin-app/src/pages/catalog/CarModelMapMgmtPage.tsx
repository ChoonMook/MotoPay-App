// 차종 매핑 관리 (uploads/MotoPay_프로그램목록표_v1_48.xlsx "관리자웹_프로그램" 시트 AD-CTLG-09 스펙 이식)
// [구성요소] 좌측 신차패키지(PKG) 상품 목록(검색 가능) + 우측 적용 가능 차종 트리(체크박스, 검색 가능)
// [트리 깊이 참고] 기획서는 "메이커>차종>모델 3단계"라 적혀 있지만 "모델"이 단독 예시·코드 없이 항상 "차종"과만
// 함께 등장하고 실제 CAR_MODEL 시드데이터(쏘렌토/스포티지/C-Class 등)가 이미 모델명 수준이라, AD-CTLG-02에서
// 확정한 메이커(CAR_BRAND)>차종(CAR_MODEL) 2단계 트리를 그대로 재사용하기로 함(사용자 확정 사항)
// [인터랙션] 좌측 상품 선택 시 우측 트리가 해당 상품의 현재 매핑 상태로 갱신 / 상위 계층(메이커) 체크 시 하위
// 차종이 일괄 체크되는 트리형 다중선택 / 저장 시 체크 상태 전체를 반영(AD-CTLG-08과 달리 가격 개념이 없어 전체 교체)
// apps/api(/admin/products/*, /admin/common-codes/*)와 연동된 실 데이터 화면
// 목록 그리드는 관리자웹 표준 컴포넌트인 components/DataGrid.tsx(ag-grid-community 기반)를 사용한다
import { useEffect, useMemo, useRef, useState } from "react";
import type { ColDef } from "ag-grid-community";
import { Search } from "lucide-react";
import { getGroup, type CommonCodeDetailApi } from "../../api/commonCodes";
import {
  getProductCarModelMappings,
  listProducts,
  setProductCarModelMappings,
  type ProductApi,
} from "../../api/products";
import DataGrid from "../../components/DataGrid";
import PageBreadcrumb from "../../components/PageBreadcrumb";

const inputClass =
  "w-full rounded-lg border border-[#ced4da] bg-white px-3 py-2 text-xs font-normal outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5";
const labelClass = "ml-0.5 text-[11px] font-bold tracking-widest text-secondary uppercase";

function BrandTreeRow({
  brand,
  models,
  checked,
  onToggleBrand,
  onToggleModel,
}: {
  brand: CommonCodeDetailApi;
  models: CommonCodeDetailApi[];
  checked: Set<string>;
  onToggleBrand: (models: CommonCodeDetailApi[], nextChecked: boolean) => void;
  onToggleModel: (modelCode: string) => void;
}) {
  const checkedCount = models.filter((m) => checked.has(m.detailCode)).length;
  const allChecked = models.length > 0 && checkedCount === models.length;
  const someChecked = checkedCount > 0 && !allChecked;
  const brandCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (brandCheckboxRef.current) brandCheckboxRef.current.indeterminate = someChecked;
  }, [someChecked]);

  return (
    <div className="border-b border-outline-variant/60 last:border-b-0">
      <label className="flex items-center gap-2 px-3 py-2 hover:bg-surface-container-low">
        <input
          ref={brandCheckboxRef}
          type="checkbox"
          checked={allChecked}
          disabled={models.length === 0}
          onChange={() => onToggleBrand(models, !allChecked)}
          className="h-4 w-4 rounded border-outline-variant text-primary disabled:opacity-40"
        />
        <span className="text-xs font-extrabold text-on-surface">{brand.detailName}</span>
        <span className="text-[11px] text-on-surface-variant">
          ({checkedCount}/{models.length})
        </span>
      </label>
      {models.length > 0 && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 px-3 pb-2 pl-9">
          {models.map((model) => (
            <label key={model.detailCode} className="flex items-center gap-2 rounded px-1.5 py-1 hover:bg-surface-container-low">
              <input
                type="checkbox"
                checked={checked.has(model.detailCode)}
                onChange={() => onToggleModel(model.detailCode)}
                className="h-3.5 w-3.5 rounded border-outline-variant text-primary"
              />
              <span className="text-[12px] text-on-surface">{model.detailName}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CarModelMapMgmtPage() {
  const [products, setProducts] = useState<ProductApi[]>([]);
  const [brands, setBrands] = useState<CommonCodeDetailApi[]>([]);
  const [models, setModels] = useState<CommonCodeDetailApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [treeKeyword, setTreeKeyword] = useState("");

  const [selectedProduct, setSelectedProduct] = useState<ProductApi | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [mappingsLoading, setMappingsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState("");
  const [globalError, setGlobalError] = useState("");

  const load = () => {
    setLoading(true);
    setLoadError("");
    Promise.all([listProducts({ prodType: "PKG" }), getGroup("CAR_BRAND"), getGroup("CAR_MODEL")])
      .then(([productList, brandGroup, modelGroup]) => {
        setProducts(productList);
        setBrands([...brandGroup.details].filter((d) => d.useYn).sort((a, b) => a.sortOrder - b.sortOrder));
        setModels([...modelGroup.details].filter((d) => d.useYn).sort((a, b) => a.sortOrder - b.sortOrder));
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "상품 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!globalError) return;
    const t = setTimeout(() => setGlobalError(""), 3200);
    return () => clearTimeout(t);
  }, [globalError]);

  useEffect(() => {
    if (!selectedProduct) return;
    setMappingsLoading(true);
    getProductCarModelMappings(selectedProduct.id)
      .then((codes) => setChecked(new Set(codes)))
      .catch((err) => setGlobalError(err instanceof Error ? err.message : "매핑 현황을 불러오지 못했습니다."))
      .finally(() => setMappingsLoading(false));
  }, [selectedProduct]);

  const filtered = useMemo(() => {
    const kw = appliedKeyword.trim();
    return kw ? products.filter((p) => p.name.includes(kw)) : products;
  }, [products, appliedKeyword]);

  const handleSearch = () => setAppliedKeyword(keyword);

  const columnDefs = useMemo<ColDef<ProductApi>[]>(
    () => [
      { headerName: "상품코드", field: "productCode", flex: 1, minWidth: 120 },
      { headerName: "상품명", field: "name", flex: 1.4, minWidth: 160 },
    ],
    [],
  );

  const modelsByBrand = useMemo(() => {
    const map = new Map<string, CommonCodeDetailApi[]>();
    for (const model of models) {
      if (!model.ref1) continue;
      const list = map.get(model.ref1) ?? [];
      list.push(model);
      map.set(model.ref1, list);
    }
    return map;
  }, [models]);

  const visibleBrands = useMemo(() => {
    const kw = treeKeyword.trim();
    if (!kw) return brands;
    return brands.filter((b) => {
      if (b.detailName.includes(kw)) return true;
      return (modelsByBrand.get(b.detailCode) ?? []).some((m) => m.detailName.includes(kw));
    });
  }, [brands, modelsByBrand, treeKeyword]);

  const visibleModelsFor = (brandCode: string) => {
    const list = modelsByBrand.get(brandCode) ?? [];
    const kw = treeKeyword.trim();
    if (!kw) return list;
    // 브랜드명 자체가 검색어에 걸린 경우엔 그 브랜드의 전체 차종을 보여주고, 그렇지 않으면 일치하는 차종만 남긴다
    const brand = brands.find((b) => b.detailCode === brandCode);
    if (brand?.detailName.includes(kw)) return list;
    return list.filter((m) => m.detailName.includes(kw));
  };

  const toggleBrand = (brandModels: CommonCodeDetailApi[], nextChecked: boolean) => {
    setChecked((prev) => {
      const next = new Set(prev);
      for (const m of brandModels) {
        if (nextChecked) next.add(m.detailCode);
        else next.delete(m.detailCode);
      }
      return next;
    });
  };

  const toggleModel = (modelCode: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(modelCode)) next.delete(modelCode);
      else next.add(modelCode);
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedProduct) return;
    setSaving(true);
    try {
      const codes = await setProductCarModelMappings(selectedProduct.id, [...checked]);
      setChecked(new Set(codes));
      setToast("차종 매핑을 저장했습니다.");
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-8 py-6">
      <PageBreadcrumb path="/catalog/car-model-map-mgmt" />

      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
        <div className="space-y-1.5">
          <label className={labelClass}>상품명 검색</label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-outline" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="신차패키지 상품명"
              className={`${inputClass} w-64 pl-8`}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleSearch}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
        >
          <Search className="h-3.5 w-3.5" />
          검색
        </button>
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        <div className="flex min-h-0 w-[420px] shrink-0 flex-col">
          <DataGrid<ProductApi>
            columnDefs={columnDefs}
            rowData={filtered}
            getRowId={(p) => String(p.data.id)}
            onCellClicked={(e) => e.data && setSelectedProduct(e.data)}
            rowClass="cursor-pointer"
            getRowClass={(p) => (p.data && selectedProduct && p.data.id === selectedProduct.id ? "bg-primary/5" : undefined)}
            rowSelection={{ mode: "singleRow", checkboxes: false, enableClickSelection: true }}
            loading={loading}
            emptyMessage={loadError || "조건에 맞는 신차패키지 상품이 없습니다."}
          />
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
          {!selectedProduct ? (
            <p className="flex flex-1 items-center justify-center text-[12px] text-on-surface-variant">좌측에서 상품을 선택하세요.</p>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-on-surface">{selectedProduct.name}</h3>
                  <p className="text-[11px] text-on-surface-variant">
                    적용 가능 차종 {checked.size}종 선택됨
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-outline" />
                    <input
                      value={treeKeyword}
                      onChange={(e) => setTreeKeyword(e.target.value)}
                      placeholder="메이커·차종 검색"
                      className={`${inputClass} w-48 pl-8`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || mappingsLoading}
                    className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "저장 중..." : "저장"}
                  </button>
                </div>
              </div>

              {mappingsLoading ? (
                <p className="py-8 text-center text-[12px] text-on-surface-variant">불러오는 중...</p>
              ) : (
                <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-outline-variant/60">
                  {visibleBrands.length === 0 ? (
                    <p className="px-4 py-8 text-center text-[12px] text-on-surface-variant">검색 결과가 없습니다.</p>
                  ) : (
                    visibleBrands.map((brand) => (
                      <BrandTreeRow
                        key={brand.detailCode}
                        brand={brand}
                        models={visibleModelsFor(brand.detailCode)}
                        checked={checked}
                        onToggleBrand={toggleBrand}
                        onToggleModel={toggleModel}
                      />
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {globalError && (
        <div className="fixed right-6 bottom-6 z-[999] rounded-lg bg-red-600 px-4 py-3 text-xs font-bold text-white shadow-xl">{globalError}</div>
      )}
      {toast && !globalError && (
        <div className="fixed right-6 bottom-6 z-[999] rounded-lg bg-secondary px-4 py-3 text-xs font-bold text-white shadow-xl">{toast}</div>
      )}
    </div>
  );
}
