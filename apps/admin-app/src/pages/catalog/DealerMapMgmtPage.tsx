// 딜러사 매핑 관리 (uploads/MotoPay_프로그램목록표_v1_48.xlsx "관리자웹_프로그램" 시트 AD-CTLG-08 스펙 이식)
// [구성요소] 좌측 신차패키지(PKG) 상품 목록(검색 가능) + 우측 매핑 가능 딜러사 체크리스트 — AD-NCPK-04와
// 동일한 마스터-디테일 패턴
// [인터랙션] 좌측 상품 선택 시 우측 체크리스트가 해당 상품의 현재 매핑 상태로 갱신 / 저장 시 체크리스트
// 전체 상태를 그대로 반영(새로 체크한 딜러사만 Product.price 스냅샷으로 매핑 생성, 이미 매핑된 딜러사는 그때
// 저장된 판매가를 유지 — Product.dealerCompanyId 단일필드와는 별개의 다대다 매핑)
// apps/api(/admin/products/*, /admin/common-codes/*)와 연동된 실 데이터 화면
// 목록 그리드는 관리자웹 표준 컴포넌트인 components/DataGrid.tsx(ag-grid-community 기반)를 사용한다
import { useEffect, useMemo, useState } from "react";
import type { ColDef } from "ag-grid-community";
import { Search } from "lucide-react";
import { listCompanies, type CompanyListItem } from "../../api/companies";
import {
  getProductDealerMappings,
  listProducts,
  setProductDealerMappings,
  type ProductApi,
  type ProductDealerMappingApi,
} from "../../api/products";
import DataGrid from "../../components/DataGrid";
import PageBreadcrumb from "../../components/PageBreadcrumb";

const inputClass =
  "w-full rounded-lg border border-[#ced4da] bg-white px-3 py-2 text-xs font-normal outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5";
const labelClass = "ml-0.5 text-[11px] font-bold tracking-widest text-secondary uppercase";

function formatWon(v: number): string {
  return `${v.toLocaleString("ko-KR")}원`;
}

export default function DealerMapMgmtPage() {
  const [products, setProducts] = useState<ProductApi[]>([]);
  const [dealers, setDealers] = useState<CompanyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");

  const [selectedProduct, setSelectedProduct] = useState<ProductApi | null>(null);
  const [mappings, setMappings] = useState<ProductDealerMappingApi[]>([]);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [mappingsLoading, setMappingsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState("");
  const [globalError, setGlobalError] = useState("");

  const load = () => {
    setLoading(true);
    setLoadError("");
    Promise.all([listProducts({ prodType: "PKG" }), listCompanies()])
      .then(([productList, companies]) => {
        setProducts(productList);
        setDealers(companies.filter((c) => c.coType === "DEALER" && c.useYn));
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
    getProductDealerMappings(selectedProduct.id)
      .then((rows) => {
        setMappings(rows);
        setChecked(new Set(rows.map((r) => r.dealerCompanyId)));
      })
      .catch((err) => setGlobalError(err instanceof Error ? err.message : "매핑 현황을 불러오지 못했습니다."))
      .finally(() => setMappingsLoading(false));
  }, [selectedProduct]);

  const filtered = useMemo(() => {
    const kw = appliedKeyword.trim();
    return kw ? products.filter((p) => p.name.includes(kw)) : products;
  }, [products, appliedKeyword]);

  const handleSearch = () => {
    setAppliedKeyword(keyword);
    load();
  };

  const columnDefs = useMemo<ColDef<ProductApi>[]>(
    () => [
      { headerName: "상품코드", field: "productCode", flex: 1, minWidth: 120 },
      { headerName: "상품명", field: "name", flex: 1.4, minWidth: 160 },
    ],
    [],
  );

  const toggleDealer = (dealerCompanyId: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(dealerCompanyId)) next.delete(dealerCompanyId);
      else next.add(dealerCompanyId);
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedProduct) return;
    setSaving(true);
    try {
      const rows = await setProductDealerMappings(selectedProduct.id, [...checked]);
      setMappings(rows);
      setToast("딜러사 매핑을 저장했습니다.");
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-8 py-6">
      <PageBreadcrumb path="/catalog/dealer-map-mgmt" />

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
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-on-surface">{selectedProduct.name}</h3>
                  <p className="text-[11px] text-on-surface-variant">
                    {selectedProduct.productCode} · 판매가 {formatWon(selectedProduct.price)}
                  </p>
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

              {mappingsLoading ? (
                <p className="py-8 text-center text-[12px] text-on-surface-variant">불러오는 중...</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {dealers.map((dealer) => {
                    const mapping = mappings.find((m) => m.dealerCompanyId === dealer.id);
                    return (
                      <label
                        key={dealer.id}
                        className="flex items-center justify-between rounded-lg border border-outline-variant/60 px-3 py-2.5 transition-all hover:bg-surface-container-low"
                      >
                        <span className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={checked.has(dealer.id)}
                            onChange={() => toggleDealer(dealer.id)}
                            className="h-4 w-4 rounded border-outline-variant text-primary"
                          />
                          <span className="text-xs font-semibold text-on-surface">{dealer.name}</span>
                        </span>
                        {checked.has(dealer.id) && (
                          <span className="text-[11px] font-medium text-on-surface-variant">
                            {mapping ? `디폴트 판매가 ${formatWon(mapping.price)}` : "저장 시 현재 판매가로 부여"}
                          </span>
                        )}
                      </label>
                    );
                  })}
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
