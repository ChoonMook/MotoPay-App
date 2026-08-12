// 상품 옵션 관리 (uploads/MotoPay_프로그램목록표_v1_48.xlsx "관리자웹_프로그램" 시트 AD-CTLG-07 스펙 이식)
// [구성요소] 상품명 검색 + 부위옵션 사용여부 필터 + 상품 목록(부위옵션 사용여부 뱃지·부위목록·농도옵션) + 부위·농도 설정 팝업
// [인터랙션] 행 클릭 시 부위·농도 설정 팝업으로 이동 — 별도 등록/삭제 없이 기존 상품(AD-CTLG-05)에 옵션만 설정
// 부위(BID_TINT_POSITION)·농도(VLT)는 예약시공 요청/추천안(BidRequestPosition·BidPlanPosition)과 동일 공통코드
// 그룹을 그대로 재사용 — "이 상품은 이 부위에서 이 농도들을 선택할 수 있다"는 (부위, 농도) 조합을 통째로 교체 저장한다
// apps/api(/admin/products/*, /admin/common-codes/*)와 연동된 실 데이터 화면
// 목록 그리드는 관리자웹 표준 컴포넌트인 components/DataGrid.tsx(ag-grid-community 기반)를 사용한다
import { useEffect, useMemo, useState } from "react";
import type { CellClickedEvent, ColDef, ICellRendererParams } from "ag-grid-community";
import { Search, X } from "lucide-react";
import { getGroup, type CommonCodeDetailApi } from "../../api/commonCodes";
import {
  listProducts,
  setProductPositionOptions,
  type ProductApi,
  type SetProductPositionOptionsInput,
} from "../../api/products";
import DataGrid from "../../components/DataGrid";
import PageBreadcrumb from "../../components/PageBreadcrumb";

const POSITION_GROUP = "BID_TINT_POSITION";
const LEVEL_GROUP = "VLT";

const inputClass =
  "w-full rounded-lg border border-[#ced4da] bg-white px-3 py-2 text-xs font-normal outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5";
const labelClass = "ml-0.5 text-[11px] font-bold tracking-widest text-secondary uppercase";

function UsageBadgeCellRenderer({ data }: ICellRendererParams<ProductApi>) {
  if (!data) return null;
  return data.positionOptionYn ? (
    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">사용</span>
  ) : (
    <span className="text-on-surface-variant">미사용</span>
  );
}

function ProductOptionDetailModal({
  product,
  positions,
  levels,
  onCancel,
  onSave,
}: {
  product: ProductApi;
  positions: CommonCodeDetailApi[];
  levels: CommonCodeDetailApi[];
  onCancel: () => void;
  onSave: (input: SetProductPositionOptionsInput) => Promise<void>;
}) {
  const [positionOptionYn, setPositionOptionYn] = useState(product.positionOptionYn);
  const [matrix, setMatrix] = useState<Record<string, Set<string>>>(() => {
    const m: Record<string, Set<string>> = {};
    for (const opt of product.positionOptions) {
      m[opt.position] = m[opt.position] ?? new Set();
      m[opt.position].add(opt.level);
    }
    return m;
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toggleCell = (position: string, level: string) => {
    setMatrix((prev) => {
      const next = { ...prev };
      const set = new Set(next[position] ?? []);
      if (set.has(level)) set.delete(level);
      else set.add(level);
      next[position] = set;
      return next;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const options = Object.entries(matrix)
        .filter(([, set]) => set.size > 0)
        .map(([position, set]) => ({ position, levels: [...set] }));
      await onSave({ positionOptionYn, options });
      onCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-bold text-secondary">상품 옵션 설정</h3>
          <button type="button" onClick={onCancel} className="text-outline hover:text-on-surface">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <label className={labelClass}>상품명</label>
            <input value={product.name} disabled className={`${inputClass} cursor-not-allowed bg-surface-container-low text-on-surface-variant`} />
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-on-surface">
            <input
              type="checkbox"
              checked={positionOptionYn}
              onChange={(e) => setPositionOptionYn(e.target.checked)}
              className="h-4 w-4 rounded border-outline-variant text-primary"
            />
            부위옵션 사용
          </label>
          {positionOptionYn && (
            <div className="space-y-1.5">
              <label className={labelClass}>부위별 선택 가능 농도</label>
              <div className="overflow-hidden rounded-lg border border-outline-variant/60">
                <table className="w-full text-[12px]">
                  <thead className="bg-surface-container-low">
                    <tr>
                      <th className="px-3 py-2 text-left font-bold text-on-surface-variant">부위</th>
                      {levels.map((l) => (
                        <th key={l.detailCode} className="px-3 py-2 text-center font-bold text-on-surface-variant">
                          {l.detailName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((p) => (
                      <tr key={p.detailCode} className="border-t border-outline-variant/60">
                        <td className="px-3 py-2 font-semibold text-on-surface">{p.detailName}</td>
                        {levels.map((l) => (
                          <td key={l.detailCode} className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={matrix[p.detailCode]?.has(l.detailCode) ?? false}
                              onChange={() => toggleCell(p.detailCode, l.detailCode)}
                              className="h-4 w-4 rounded border-outline-variant text-primary"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {error && <p className="text-[12px] font-semibold text-red-600">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg bg-surface-container-high px-4 py-2 text-xs font-bold text-on-surface transition-all hover:bg-surface-dim">
            취소
          </button>
          <button type="submit" disabled={submitting} className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-60">
            {submitting ? "저장 중..." : "저장"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ProdOptMgmtPage() {
  const [products, setProducts] = useState<ProductApi[]>([]);
  const [positions, setPositions] = useState<CommonCodeDetailApi[]>([]);
  const [levels, setLevels] = useState<CommonCodeDetailApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [keyword, setKeyword] = useState("");
  const [usageFilter, setUsageFilter] = useState("all");
  const [appliedFilters, setAppliedFilters] = useState({ keyword: "", usageFilter: "all" });
  const [editingProduct, setEditingProduct] = useState<ProductApi | null>(null);

  const [toast, setToast] = useState("");
  const [globalError, setGlobalError] = useState("");

  const load = () => {
    setLoading(true);
    setLoadError("");
    Promise.all([listProducts(), getGroup(POSITION_GROUP), getGroup(LEVEL_GROUP)])
      .then(([productList, positionGroup, levelGroup]) => {
        setProducts(productList);
        setPositions([...positionGroup.details].filter((d) => d.useYn).sort((a, b) => a.sortOrder - b.sortOrder));
        setLevels([...levelGroup.details].filter((d) => d.useYn).sort((a, b) => a.sortOrder - b.sortOrder));
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

  const positionLabelMap = useMemo(() => {
    const map = new Map(positions.map((p) => [p.detailCode, p.detailName]));
    return (code: string) => map.get(code) ?? code;
  }, [positions]);
  const levelLabelMap = useMemo(() => {
    const map = new Map(levels.map((l) => [l.detailCode, l.detailName]));
    return (code: string) => map.get(code) ?? code;
  }, [levels]);

  const filtered = useMemo(() => {
    const kw = appliedFilters.keyword.trim();
    return products.filter((p) => {
      const matchesKeyword = !kw || p.name.includes(kw);
      const matchesUsage =
        appliedFilters.usageFilter === "all" || (appliedFilters.usageFilter === "used" ? p.positionOptionYn : !p.positionOptionYn);
      return matchesKeyword && matchesUsage;
    });
  }, [products, appliedFilters]);

  const handleSearch = () => {
    setAppliedFilters({ keyword, usageFilter });
  };

  const handleSave = async (input: SetProductPositionOptionsInput) => {
    if (!editingProduct) return;
    const updated = await setProductPositionOptions(editingProduct.id, input);
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setToast("상품 옵션을 저장했습니다.");
  };

  const columnDefs = useMemo<ColDef<ProductApi>[]>(
    () => [
      { headerName: "상품명", field: "name", flex: 1.4, minWidth: 180 },
      {
        headerName: "부위옵션 사용여부",
        colId: "positionOptionYn",
        flex: 1,
        minWidth: 140,
        cellRenderer: UsageBadgeCellRenderer,
      },
      {
        headerName: "부위목록",
        colId: "positions",
        flex: 1.4,
        minWidth: 180,
        valueGetter: (p) => {
          if (!p.data) return "";
          const codes = [...new Set(p.data.positionOptions.map((o) => o.position))];
          return codes.length ? codes.map(positionLabelMap).join(", ") : "-";
        },
      },
      {
        headerName: "농도옵션",
        colId: "levels",
        flex: 1.2,
        minWidth: 160,
        valueGetter: (p) => {
          if (!p.data) return "";
          const codes = [...new Set(p.data.positionOptions.map((o) => o.level))];
          return codes.length ? codes.map(levelLabelMap).join(", ") : "-";
        },
      },
    ],
    [positionLabelMap, levelLabelMap],
  );

  const onCellClicked = (e: CellClickedEvent<ProductApi>) => {
    if (!e.data) return;
    setEditingProduct(e.data);
  };

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-8 py-6">
      <PageBreadcrumb path="/catalog/prod-opt-mgmt" />

      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label className={labelClass}>상품명 검색</label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-outline" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="상품명"
                className={`${inputClass} w-56 pl-8`}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>부위옵션 사용여부</label>
            <select value={usageFilter} onChange={(e) => setUsageFilter(e.target.value)} className={`${inputClass} w-32`}>
              <option value="all">전체</option>
              <option value="used">사용</option>
              <option value="unused">미사용</option>
            </select>
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

      <DataGrid<ProductApi>
        columnDefs={columnDefs}
        rowData={filtered}
        getRowId={(p) => String(p.data.id)}
        onCellClicked={onCellClicked}
        rowClass="cursor-pointer"
        loading={loading}
        emptyMessage={loadError || "조건에 맞는 상품이 없습니다."}
      />

      {editingProduct && (
        <ProductOptionDetailModal
          product={editingProduct}
          positions={positions}
          levels={levels}
          onCancel={() => setEditingProduct(null)}
          onSave={handleSave}
        />
      )}

      {globalError && (
        <div className="fixed right-6 bottom-6 z-[999] rounded-lg bg-red-600 px-4 py-3 text-xs font-bold text-white shadow-xl">{globalError}</div>
      )}
      {toast && !globalError && (
        <div className="fixed right-6 bottom-6 z-[999] rounded-lg bg-secondary px-4 py-3 text-xs font-bold text-white shadow-xl">{toast}</div>
      )}
    </div>
  );
}
