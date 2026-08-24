// 신차패키지 구성 관리 (uploads/MotoPay_프로그램목록표_v1_48.xlsx "관리자웹_프로그램" 시트 AD-CTLG-10 스펙 이식)
// [구성요소] 딜러사 필터 + 좌측 신차패키지(PKG) 상품 목록 + 중앙 구성상품 편집(기본상품/업그레이드옵션/추가옵션) +
// 우측 고객앱 노출 순서 미리보기
// [딜러사 필터 범위 확정] 스펙 문구는 "딜러사별 신차패키지 구성"이라 적혀 있지만, ProductBundleItem 테이블에는
// dealerCode가 없고 공개 API(getPackageDetail)도 딜러사와 무관하게 설계돼 있어, 딜러사 선택은 좌측 상품 목록을
// "그 딜러사가 판매하는 패키지"로 좁히는 필터 용도로만 사용하기로 함(사용자 확정 사항). 실제 구성상품
// (BASIC/OPTION/ADD, 가격override, 수량, 순서)은 패키지 1개당 하나만 존재하며 모든 딜러사가 공유한다
// [순서 편집 UI 참고] 원 기획서는 "드래그로 순서 변경"이지만, 시공항목관리(AD-CTLG-03)와 동일한 이유로 위/아래
// 버튼으로 대체했다 — 결과(순서가 즉시 반영)는 동일하고 구현이 더 단순하다
// apps/api(/admin/products/*, /admin/common-codes/*)와 연동된 실 데이터 화면
// 목록 그리드는 관리자웹 표준 컴포넌트인 components/DataGrid.tsx(ag-grid-community 기반)를 사용한다
import { useEffect, useMemo, useState } from "react";
import type { ColDef } from "ag-grid-community";
import { ChevronDown, ChevronUp, Plus, Search, Trash2 } from "lucide-react";
import { listCompanies, type CompanyListItem } from "../../api/companies";
import {
  getProductBundleItems,
  listProducts,
  setProductBundleItems,
  type BundleItemInput,
  type ProductApi,
} from "../../api/products";
import DataGrid from "../../components/DataGrid";
import PageBreadcrumb from "../../components/PageBreadcrumb";

const inputClass =
  "w-full rounded-lg border border-[#ced4da] bg-white px-3 py-2 text-xs font-normal outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5";
const labelClass = "ml-0.5 text-[11px] font-bold tracking-widest text-secondary uppercase";

const ITEM_TYPES = [
  { key: "BASIC" as const, label: "기본상품(무상)" },
  { key: "OPTION" as const, label: "업그레이드옵션(유상)" },
  { key: "ADD" as const, label: "추가옵션(유상)" },
];

interface EditableBundleItem {
  componentCode: string;
  price: string;
  qty: string;
}

type BundleGroups = Record<"BASIC" | "OPTION" | "ADD", EditableBundleItem[]>;

const EMPTY_GROUPS: BundleGroups = { BASIC: [], OPTION: [], ADD: [] };

function formatWon(v: number): string {
  return `${v.toLocaleString("ko-KR")}원`;
}

export default function PkgCompMgmtPage() {
  const [products, setProducts] = useState<ProductApi[]>([]);
  const [componentProducts, setComponentProducts] = useState<ProductApi[]>([]);
  const [dealers, setDealers] = useState<CompanyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [dealerFilter, setDealerFilter] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");

  const [selectedProduct, setSelectedProduct] = useState<ProductApi | null>(null);
  const [groups, setGroups] = useState<BundleGroups>(EMPTY_GROUPS);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addSelections, setAddSelections] = useState<Record<string, string>>({ BASIC: "", OPTION: "", ADD: "" });

  const [toast, setToast] = useState("");
  const [globalError, setGlobalError] = useState("");

  const loadProducts = (kw: string) => {
    setLoading(true);
    setLoadError("");
    listProducts({
      prodType: "PKG",
      mappedDealerCompanyId: dealerFilter === "all" ? undefined : Number(dealerFilter),
      keyword: kw || undefined,
    })
      .then(setProducts)
      .catch((err) => setLoadError(err instanceof Error ? err.message : "상품 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(() => loadProducts(appliedKeyword), [dealerFilter]);

  const loadComponentData = () => {
    Promise.all([listProducts(), listCompanies()])
      .then(([all, companies]) => {
        setComponentProducts(all.filter((p) => p.prodType !== "PKG"));
        setDealers(companies.filter((c) => c.coType === "DEALER" && c.useYn));
      })
      .catch((err) => setGlobalError(err instanceof Error ? err.message : "기초 데이터를 불러오지 못했습니다."));
  };

  useEffect(loadComponentData, []);

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
    setItemsLoading(true);
    getProductBundleItems(selectedProduct.id)
      .then((items) => {
        const next: BundleGroups = { BASIC: [], OPTION: [], ADD: [] };
        for (const item of items) {
          const key = item.itemType as keyof BundleGroups;
          if (!next[key]) continue;
          next[key].push({ componentCode: item.componentCode, price: item.price !== null ? String(item.price) : "", qty: String(item.qty) });
        }
        setGroups(next);
      })
      .catch((err) => setGlobalError(err instanceof Error ? err.message : "구성상품을 불러오지 못했습니다."))
      .finally(() => setItemsLoading(false));
  }, [selectedProduct]);

  const componentLabelMap = useMemo(() => {
    const map = new Map(componentProducts.map((p) => [p.productCode, p]));
    return (code: string) => map.get(code) ?? null;
  }, [componentProducts]);

  const usedComponentCodes = useMemo(() => {
    return new Set([...groups.BASIC, ...groups.OPTION, ...groups.ADD].map((i) => i.componentCode));
  }, [groups]);

  const handleSearch = () => {
    setAppliedKeyword(keyword);
    loadProducts(keyword);
    loadComponentData();
  };

  const columnDefs = useMemo<ColDef<ProductApi>[]>(
    () => [
      { headerName: "상품코드", field: "productCode", flex: 1, minWidth: 120 },
      { headerName: "상품명", field: "name", flex: 1.4, minWidth: 160 },
    ],
    [],
  );

  const addItem = (type: keyof BundleGroups) => {
    const componentCode = addSelections[type];
    if (!componentCode) return;
    setGroups((prev) => ({ ...prev, [type]: [...prev[type], { componentCode, price: "", qty: "1" }] }));
    setAddSelections((prev) => ({ ...prev, [type]: "" }));
  };

  const removeItem = (type: keyof BundleGroups, index: number) => {
    setGroups((prev) => ({ ...prev, [type]: prev[type].filter((_, i) => i !== index) }));
  };

  const updateItem = (type: keyof BundleGroups, index: number, patch: Partial<EditableBundleItem>) => {
    setGroups((prev) => ({
      ...prev,
      [type]: prev[type].map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  };

  const moveItem = (type: keyof BundleGroups, index: number, direction: -1 | 1) => {
    setGroups((prev) => {
      const list = [...prev[type]];
      const target = index + direction;
      if (target < 0 || target >= list.length) return prev;
      [list[index], list[target]] = [list[target], list[index]];
      return { ...prev, [type]: list };
    });
  };

  const handleSave = async () => {
    if (!selectedProduct) return;
    // 가격override에 0원을 입력하면 그 구성상품의 실제 가치가 데이터에서 사라져(딜러사 청구·시공업체 정산
    // 산정 기준으로 쓸 수 없게 됨) — 기본상품(무상)이라도 "고객에게 무상"과 "이 항목의 실제 가치"는 별개이므로,
    // override는 항상 0보다 커야 한다. 상품 자체 판매가를 그대로 쓰려면 override 칸을 비워두면 된다(2026-08-22 확정)
    const hasZeroPrice = ITEM_TYPES.some(({ key }) => groups[key].some((item) => item.price.trim() === "0"));
    if (hasZeroPrice) {
      setGlobalError("가격override에 0원을 입력할 수 없습니다. 상품 자체 판매가를 적용하려면 비워두세요.");
      return;
    }
    setSaving(true);
    try {
      const items: BundleItemInput[] = ITEM_TYPES.flatMap(({ key }) =>
        groups[key].map((item, index) => ({
          componentCode: item.componentCode,
          itemType: key,
          price: item.price.trim() ? Number(item.price) : undefined,
          qty: Number(item.qty) || 1,
          sortOrder: index,
        })),
      );
      await setProductBundleItems(selectedProduct.id, items);
      setToast("패키지 구성을 저장했습니다.");
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-8 py-6">
      <PageBreadcrumb path="/catalog/pkg-comp-mgmt" />

      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label className={labelClass}>딜러사</label>
            <select value={dealerFilter} onChange={(e) => setDealerFilter(e.target.value)} className={`${inputClass} w-40`}>
              <option value="all">전체</option>
              {dealers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>상품명 검색</label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-outline" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="신차패키지 상품명"
                className={`${inputClass} w-56 pl-8`}
              />
            </div>
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
        <div className="flex min-h-0 w-[360px] shrink-0 flex-col">
          <DataGrid<ProductApi>
            columnDefs={columnDefs}
            rowData={products}
            getRowId={(p) => String(p.data.id)}
            onCellClicked={(e) => e.data && setSelectedProduct(e.data)}
            rowClass="cursor-pointer"
            getRowClass={(p) => (p.data && selectedProduct && p.data.id === selectedProduct.id ? "bg-primary/5" : undefined)}
            rowSelection={{ mode: "singleRow", checkboxes: false, enableClickSelection: true }}
            loading={loading}
            emptyMessage={loadError || "조건에 맞는 신차패키지 상품이 없습니다."}
          />
        </div>

        {!selectedProduct ? (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
            <p className="text-[12px] text-on-surface-variant">좌측에서 상품을 선택하세요.</p>
          </div>
        ) : (
          <>
            <div className="flex min-h-0 flex-[2] flex-col overflow-y-auto rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-on-surface">{selectedProduct.name}</h3>
                  <p className="text-[11px] text-on-surface-variant">{selectedProduct.productCode}</p>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || itemsLoading}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "저장 중..." : "저장"}
                </button>
              </div>

              {itemsLoading ? (
                <p className="py-8 text-center text-[12px] text-on-surface-variant">불러오는 중...</p>
              ) : (
                <div className="flex flex-col gap-5">
                  {ITEM_TYPES.map(({ key, label }) => {
                    // 신규 구성상품 추가 드롭다운에는 사용중인 상품만 노출(2026-08-23 확정) — 이미 등록된
                    // 구성상품은 나중에 사용중지되더라도 componentLabelMap(필터 안 함)으로 계속 이름이 보임
                    const options = componentProducts.filter((p) => p.useYn);
                    return (
                      <div key={key} className="space-y-2">
                        <h4 className="text-xs font-extrabold text-on-surface">{label}</h4>
                        <div className="space-y-1.5">
                          {groups[key].map((item, index) => {
                            const component = componentLabelMap(item.componentCode);
                            return (
                              <div key={item.componentCode} className="flex items-center gap-2 rounded-lg border border-outline-variant/60 px-2.5 py-2">
                                <div className="flex shrink-0 flex-col gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => moveItem(key, index, -1)}
                                    disabled={index === 0}
                                    className="text-outline transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                                  >
                                    <ChevronUp className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveItem(key, index, 1)}
                                    disabled={index === groups[key].length - 1}
                                    className="text-outline transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                                  >
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-semibold text-on-surface">{component?.name ?? item.componentCode}</p>
                                  <p className="truncate text-[10px] text-on-surface-variant">
                                    {item.componentCode} · 자체가 {component ? formatWon(component.price) : "-"}
                                  </p>
                                </div>
                                {/* inputClass에 포함된 w-full이 뒤에 붙는 폭 클래스보다 우선 적용돼(캐스케이드 순서상)
                                    input 자체에 w-28/w-16을 직접 주면 무시된다 — 고정폭 wrapper로 감싸 input은
                                    그 wrapper의 100%만 채우게 해서 우회 */}
                                <div className="w-24 shrink-0">
                                  <input
                                    type="number"
                                    min={0}
                                    value={item.price}
                                    onChange={(e) => updateItem(key, index, { price: e.target.value })}
                                    placeholder="가격override"
                                    className={inputClass}
                                  />
                                </div>
                                <div className="w-14 shrink-0">
                                  <input
                                    type="number"
                                    min={1}
                                    value={item.qty}
                                    onChange={(e) => updateItem(key, index, { qty: e.target.value })}
                                    className={inputClass}
                                  />
                                </div>
                                <button type="button" onClick={() => removeItem(key, index)} className="shrink-0 text-outline hover:text-red-500">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={addSelections[key]}
                            onChange={(e) => setAddSelections((prev) => ({ ...prev, [key]: e.target.value }))}
                            className={`${inputClass} flex-1`}
                          >
                            <option value="">구성상품 선택</option>
                            {options.map((p) => (
                              <option key={p.productCode} value={p.productCode} disabled={usedComponentCodes.has(p.productCode)}>
                                {p.name} ({p.productCode}){usedComponentCodes.has(p.productCode) ? " - 이미 추가됨" : ""}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => addItem(key)}
                            disabled={!addSelections[key]}
                            className="flex items-center gap-1 rounded-lg bg-surface-container-high px-3 py-2 text-[11px] font-bold text-on-surface transition-all hover:bg-surface-dim disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            추가
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
              <h4 className="mb-3 text-xs font-extrabold text-on-surface">고객앱 노출 순서 미리보기</h4>
              <div className="flex flex-col gap-4">
                {ITEM_TYPES.map(({ key, label }) => (
                  <div key={key}>
                    <p className="mb-1.5 text-[11px] font-bold text-on-surface-variant">{label}</p>
                    {groups[key].length === 0 ? (
                      <p className="text-[11px] text-on-surface-variant">-</p>
                    ) : (
                      <ol className="space-y-1">
                        {groups[key].map((item, index) => {
                          const component = componentLabelMap(item.componentCode);
                          const effectivePrice = item.price.trim() ? Number(item.price) : (component?.price ?? null);
                          return (
                            <li key={item.componentCode} className="flex items-center justify-between text-[12px] text-on-surface">
                              <span className="truncate">
                                {index + 1}. {component?.name ?? item.componentCode}
                                {Number(item.qty) > 1 ? ` x${item.qty}` : ""}
                              </span>
                              <span className="shrink-0 text-on-surface-variant">{effectivePrice !== null ? formatWon(effectivePrice) : "-"}</span>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
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
