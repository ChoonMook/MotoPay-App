// 패키지·시공 정산 기준 관리(AD-STL-02) — 신차패키지(좌, 검색) → 구성상품(중, 기본/업그레이드/추가옵션) → 시공업체별
// 매입가(우) 3단 마스터-디테일-디테일 설정. 시공업체별 기본 수수료는 AD-CO-02 업체관리 매장정보 탭으로
// 이관됐고(2026-08-23), 이 화면은 구성상품×업체 예외만 다룬다. 예외가 없는 조합은 그 기본값이 적용된다.
// 목록 그리드는 관리자웹 표준 컴포넌트인 DataGrid.tsx를 사용한다
import { useEffect, useMemo, useState } from "react";
import type { ColDef } from "ag-grid-community";
import { Check, Search } from "lucide-react";
import { getProductBundleItems, listProducts, type ProductApi, type ProductBundleItemApi } from "../../api/products";
import {
  getProductCommissions,
  listShopCommissions,
  setProductCommissions,
  type ShopCommissionApi,
} from "../../api/settlements";
import DataGrid from "../../components/DataGrid";
import PageBreadcrumb from "../../components/PageBreadcrumb";

const inputClass =
  "w-full rounded-lg border border-[#ced4da] bg-white px-2.5 py-1.5 text-xs font-normal outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5";
const labelClass = "ml-0.5 text-[11px] font-bold tracking-widest text-secondary uppercase";
const ITEM_TYPE_LABEL: Record<string, string> = { BASIC: "기본상품", OPTION: "업그레이드옵션", ADD: "추가옵션" };
const ITEM_TYPE_ORDER = ["BASIC", "OPTION", "ADD"];

function isValidAmount(v: string): boolean {
  return v.trim() !== "" && Number.isInteger(Number(v)) && Number(v) >= 0;
}

function isValidRate(v: string): boolean {
  return v.trim() !== "" && !Number.isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100;
}

function isRowValid(type: string, amount: string, rate: string): boolean {
  return type === "FIXED" ? isValidAmount(amount) : isValidRate(rate);
}

interface ExceptionRowState {
  shopCode: string;
  name: string;
  enabled: boolean;
  commissionType: string;
  commissionAmount: string;
  commissionRate: string;
}

function formatWon(v: number): string {
  return `${v.toLocaleString("ko-KR")}원`;
}

export default function SettleRuleMgmtPage() {
  const [shops, setShops] = useState<ShopCommissionApi[]>([]);

  const [packages, setPackages] = useState<ProductApi[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<ProductApi | null>(null);

  const [bundleItems, setBundleItems] = useState<ProductBundleItemApi[]>([]);
  const [bundleItemsLoading, setBundleItemsLoading] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<ProductBundleItemApi | null>(null);

  const [exceptionRows, setExceptionRows] = useState<ExceptionRowState[]>([]);
  const [exceptionsLoading, setExceptionsLoading] = useState(false);
  const [exceptionsSaving, setExceptionsSaving] = useState(false);

  const [bulkType, setBulkType] = useState("FIXED");
  const [bulkAmount, setBulkAmount] = useState("");
  const [bulkRate, setBulkRate] = useState("");

  const [toast, setToast] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const loadShops = () => {
    listShopCommissions()
      .then(setShops)
      .catch((err) => setErrorMsg(err instanceof Error ? err.message : "시공업체 목록을 불러오지 못했습니다."));
  };

  const loadPackages = (kw: string) => {
    setPackagesLoading(true);
    listProducts({ prodType: "PKG", keyword: kw || undefined })
      .then(setPackages)
      .catch((err) => setErrorMsg(err instanceof Error ? err.message : "패키지 목록을 불러오지 못했습니다."))
      .finally(() => setPackagesLoading(false));
  };

  useEffect(loadShops, []);
  useEffect(() => loadPackages(""), []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!errorMsg) return;
    const t = setTimeout(() => setErrorMsg(""), 3200);
    return () => clearTimeout(t);
  }, [errorMsg]);

  useEffect(() => {
    setSelectedComponent(null);
    if (!selectedPackage) {
      setBundleItems([]);
      return;
    }
    setBundleItemsLoading(true);
    getProductBundleItems(selectedPackage.id)
      .then(setBundleItems)
      .catch((err) => setErrorMsg(err instanceof Error ? err.message : "구성상품을 불러오지 못했습니다."))
      .finally(() => setBundleItemsLoading(false));
  }, [selectedPackage]);

  useEffect(() => {
    if (!selectedComponent || shops.length === 0) return;
    setExceptionsLoading(true);
    getProductCommissions(selectedComponent.componentCode)
      .then((exceptions) => {
        setExceptionRows(
          shops.map((shop) => {
            const ex = exceptions.find((e) => e.shopCode === shop.shopCode);
            // 업체 기본값(shop.commissionRate)은 정률만 존재(2026-08-23 확정) — 예외가 없을 때 입력폼의
            // 시작값은 그냥 FIXED로 두고, 아래 비활성 상태 힌트 문구에서만 업체 기본 정률을 보여준다
            return {
              shopCode: shop.shopCode,
              name: shop.name,
              enabled: !!ex,
              commissionType: ex?.commissionType ?? "FIXED",
              commissionAmount: String(ex?.commissionAmount ?? ""),
              commissionRate: String(ex?.commissionRate ?? shop.commissionRate ?? ""),
            };
          }),
        );
      })
      .catch((err) => setErrorMsg(err instanceof Error ? err.message : "예외 목록을 불러오지 못했습니다."))
      .finally(() => setExceptionsLoading(false));
  }, [selectedComponent, shops]);

  const handleSearch = () => loadPackages(keyword);

  const groupedBundleItems = useMemo(() => {
    const groups: Record<string, ProductBundleItemApi[]> = { BASIC: [], OPTION: [], ADD: [] };
    for (const item of bundleItems) {
      (groups[item.itemType] ?? (groups[item.itemType] = [])).push(item);
    }
    return groups;
  }, [bundleItems]);

  const updateExceptionRow = (shopCode: string, patch: Partial<ExceptionRowState>) => {
    setExceptionRows((prev) => prev.map((r) => (r.shopCode === shopCode ? { ...r, ...patch } : r)));
  };

  // 등록 시 모든 시공업체에 동일한 금액/율을 한 번에 적용(2026-08-23 요청) — 전체 행을 활성화하고 같은 값으로 채운다.
  // 이후에도 개별 행을 따로 조정할 수 있고, 실제 반영은 "저장"을 눌러야 확정된다
  const applyBulk = () => {
    if (!isRowValid(bulkType, bulkAmount, bulkRate)) {
      setErrorMsg("일괄 적용값을 정액은 0 이상의 정수, 정률은 0~100 사이로 입력해 주세요.");
      return;
    }
    setExceptionRows((prev) =>
      prev.map((r) => ({ ...r, enabled: true, commissionType: bulkType, commissionAmount: bulkAmount, commissionRate: bulkRate })),
    );
  };

  const invalidExceptionShopCodes = useMemo(() => {
    const set = new Set<string>();
    for (const row of exceptionRows) {
      if (row.enabled && !isRowValid(row.commissionType, row.commissionAmount, row.commissionRate)) {
        set.add(row.shopCode);
      }
    }
    return set;
  }, [exceptionRows]);

  const handleSaveExceptions = async () => {
    if (!selectedComponent) return;
    if (invalidExceptionShopCodes.size > 0) {
      setErrorMsg("정액은 0 이상의 정수, 정률은 0~100 사이의 값을 입력해 주세요.");
      return;
    }
    setExceptionsSaving(true);
    try {
      const items = exceptionRows
        .filter((r) => r.enabled)
        .map((r) => ({
          shopCode: r.shopCode,
          commissionType: r.commissionType,
          commissionAmount: r.commissionType === "FIXED" ? Number(r.commissionAmount) : undefined,
          commissionRate: r.commissionType === "RATE" ? Number(r.commissionRate) : undefined,
        }));
      await setProductCommissions(selectedComponent.componentCode, items);
      setToast("구성상품별 매입가를 저장했습니다.");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setExceptionsSaving(false);
    }
  };

  const columnDefs = useMemo<ColDef<ProductApi>[]>(
    () => [
      { headerName: "상품코드", field: "productCode", flex: 1, minWidth: 120 },
      { headerName: "상품명", field: "name", flex: 1.4, minWidth: 160 },
    ],
    [],
  );

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-8 py-6">
      <PageBreadcrumb path="/settle/settle-rule-mgmt" />

      <section className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
          <div className="space-y-1.5">
            <label className={labelClass}>신차패키지 검색</label>
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

        <div className="flex min-h-[480px] flex-1 gap-4">
          <div className="flex min-h-0 w-[340px] shrink-0 flex-col">
            <DataGrid<ProductApi>
              columnDefs={columnDefs}
              rowData={packages}
              getRowId={(p) => p.data.productCode}
              onCellClicked={(e) => e.data && setSelectedPackage(e.data)}
              rowClass="cursor-pointer"
              getRowClass={(p) =>
                p.data && selectedPackage && p.data.productCode === selectedPackage.productCode ? "bg-primary/5" : undefined
              }
              rowSelection={{ mode: "singleRow", checkboxes: false, enableClickSelection: true }}
              loading={packagesLoading}
              emptyMessage="조건에 맞는 신차패키지 상품이 없습니다."
            />
          </div>

          <div className="flex min-h-0 w-[280px] shrink-0 flex-col overflow-y-auto rounded-xl border border-outline-variant/30 bg-white p-4 shadow-sm">
            {!selectedPackage ? (
              <p className="flex flex-1 items-center justify-center text-center text-[12px] text-on-surface-variant">
                좌측에서 신차패키지를 선택하세요.
              </p>
            ) : bundleItemsLoading ? (
              <p className="py-8 text-center text-[12px] text-on-surface-variant">불러오는 중...</p>
            ) : bundleItems.length === 0 ? (
              <p className="py-8 text-center text-[12px] text-on-surface-variant">구성상품이 없습니다.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {ITEM_TYPE_ORDER.map((type) => (
                  <div key={type}>
                    <p className="mb-1.5 text-[11px] font-bold text-on-surface-variant">{ITEM_TYPE_LABEL[type]}</p>
                    {groupedBundleItems[type].length === 0 ? (
                      <p className="text-[11px] text-on-surface-variant">-</p>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {groupedBundleItems[type].map((item) => {
                          const active = selectedComponent?.componentCode === item.componentCode;
                          return (
                            <button
                              key={item.componentCode}
                              type="button"
                              onClick={() => setSelectedComponent(item)}
                              className={`rounded-lg border px-2.5 py-2 text-left transition-all ${
                                active ? "border-primary bg-primary/5" : "border-outline-variant/60 hover:border-primary/40"
                              }`}
                            >
                              <p className="truncate text-xs font-semibold text-on-surface">
                                {item.product?.name ?? item.componentCode}
                              </p>
                              <p className="truncate text-[10px] text-on-surface-variant">
                                {item.componentCode} · 자체가 {item.effectivePrice != null ? formatWon(item.effectivePrice) : "-"}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
            {!selectedComponent ? (
              <p className="flex flex-1 items-center justify-center text-[12px] text-on-surface-variant">
                가운데에서 구성상품을 선택하세요.
              </p>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-on-surface">
                      {selectedComponent.product?.name ?? selectedComponent.componentCode}
                    </h3>
                    <p className="text-[11px] text-on-surface-variant">
                      {selectedComponent.componentCode} · 이 구성상품에만 적용할 시공업체별 매입가
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveExceptions}
                    disabled={exceptionsSaving || exceptionsLoading}
                    className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {exceptionsSaving ? "저장 중..." : "저장"}
                  </button>
                </div>

                {/* inputClass에 포함된 w-full이 뒤에 붙는 폭 클래스보다 우선 적용돼(캐스케이드 순서상) select/input
                    자체에 w-24/w-28을 직접 주면 무시된다 — 고정폭 wrapper로 감싸 그 안에서만 100%를 채우게 우회
                    (PkgCompMgmtPage.tsx와 동일 패턴) */}
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-surface-container-low p-3">
                  <span className="shrink-0 text-[11px] font-bold tracking-widest text-secondary uppercase">일괄 적용</span>
                  <div className="w-24 shrink-0">
                    <select value={bulkType} onChange={(e) => setBulkType(e.target.value)} className={inputClass}>
                      <option value="FIXED">정액</option>
                      <option value="RATE">정률</option>
                    </select>
                  </div>
                  <div className={bulkType === "FIXED" ? "w-28 shrink-0" : "w-24 shrink-0"}>
                    {bulkType === "FIXED" ? (
                      <input
                        type="number"
                        min={0}
                        value={bulkAmount}
                        onChange={(e) => setBulkAmount(e.target.value)}
                        placeholder="금액(원)"
                        className={inputClass}
                      />
                    ) : (
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        value={bulkRate}
                        onChange={(e) => setBulkRate(e.target.value)}
                        placeholder="비율(%)"
                        className={inputClass}
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={applyBulk}
                    className="shrink-0 rounded-lg bg-surface-container-high px-3 py-2 text-[11px] font-bold text-on-surface transition-all hover:bg-surface-dim"
                  >
                    전체 시공업체에 적용
                  </button>
                </div>

                {exceptionsLoading ? (
                  <p className="py-8 text-center text-[12px] text-on-surface-variant">불러오는 중...</p>
                ) : (
                  <div className="flex flex-col gap-2 overflow-y-auto">
                    {exceptionRows.map((row) => (
                      <div
                        key={row.shopCode}
                        className="flex flex-wrap items-center gap-3 rounded-lg border border-outline-variant/60 px-3 py-2.5"
                      >
                        <label className="flex min-w-[160px] items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={row.enabled}
                            onChange={(e) => updateExceptionRow(row.shopCode, { enabled: e.target.checked })}
                            className="h-4 w-4 rounded border-outline-variant text-primary"
                          />
                          <span className="text-xs font-semibold text-on-surface">{row.name}</span>
                        </label>

                        {row.enabled ? (
                          <div className="flex items-center gap-2">
                            <div className="w-24 shrink-0">
                              <select
                                value={row.commissionType}
                                onChange={(e) => updateExceptionRow(row.shopCode, { commissionType: e.target.value })}
                                className={inputClass}
                              >
                                <option value="FIXED">정액</option>
                                <option value="RATE">정률</option>
                              </select>
                            </div>
                            {row.commissionType === "FIXED" ? (
                              <div className="flex items-center gap-1.5">
                                <div className="w-28 shrink-0">
                                  <input
                                    type="number"
                                    min={0}
                                    value={row.commissionAmount}
                                    onChange={(e) => updateExceptionRow(row.shopCode, { commissionAmount: e.target.value })}
                                    className={inputClass}
                                  />
                                </div>
                                <span className="text-[11px] text-on-surface-variant">원</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <div className="w-24 shrink-0">
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    step={0.1}
                                    value={row.commissionRate}
                                    onChange={(e) => updateExceptionRow(row.shopCode, { commissionRate: e.target.value })}
                                    className={inputClass}
                                  />
                                </div>
                                <span className="text-[11px] text-on-surface-variant">%</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-on-surface-variant">
                            시공업체 기본값 적용
                            {row.commissionRate.trim() !== "" ? ` (정률 ${row.commissionRate}%)` : " (업체 기본값 미설정)"}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {errorMsg && (
        <div className="fixed right-6 bottom-6 z-[999] rounded-lg bg-red-600 px-4 py-3 text-xs font-bold text-white shadow-xl">
          {errorMsg}
        </div>
      )}
      {toast && !errorMsg && (
        <div className="fixed right-6 bottom-6 z-[999] flex items-center gap-1.5 rounded-lg bg-secondary px-4 py-3 text-xs font-bold text-white shadow-xl">
          <Check className="h-3.5 w-3.5" />
          {toast}
        </div>
      )}
    </div>
  );
}
