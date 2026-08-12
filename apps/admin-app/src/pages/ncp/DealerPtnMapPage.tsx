// 딜러사-시공업체 매핑 (uploads/MotoPay_프로그램목록표_v1_47.xlsx "관리자웹_프로그램" 시트 AD-NCPK-04 스펙 이식)
// [구성요소] 좌측 딜러사 목록(검색 가능) + 우측 매핑 가능 시공업체 체크리스트 — AD-NCPK-03과 동일한 마스터-디테일
// 패턴
// [딜러사 실체 확정] 스펙 문구("딜러사명(text)")만으로는 CommonCodeDetail(DEALER) 3개 고정값인지 Company(coType=
// DEALER) 실제 등록 업체인지 구분이 안 돼 사용자에게 확인 — 딜러사웹 로그인 계정(AdminAccount.companyId)이
// 실제로 연결되는 진짜 사업자 엔티티라는 이유로 Company(coType=DEALER)로 확정(사용자 확정 사항). "시공업체"는
// 스키마 주석상 시공업체 마스터인 Shop을 그대로 사용
// [인터랙션] 좌측 딜러사 선택 시 우측 체크리스트가 해당 딜러사의 현재 매핑 상태로 갱신
// apps/api(/admin/companies/*, /shops)와 연동된 실 데이터 화면
// 목록 그리드는 관리자웹 표준 컴포넌트인 components/DataGrid.tsx(ag-grid-community 기반)를 사용한다
import { useEffect, useMemo, useState } from "react";
import type { ColDef } from "ag-grid-community";
import { Search } from "lucide-react";
import {
  getDealerShopMappings,
  listCompanies,
  setDealerShopMappings,
  type CompanyListItem,
} from "../../api/companies";
import { listShops, type ShopListItem } from "../../api/shops";
import DataGrid from "../../components/DataGrid";
import PageBreadcrumb from "../../components/PageBreadcrumb";

const inputClass =
  "w-full rounded-lg border border-[#ced4da] bg-white px-3 py-2 text-xs font-normal outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5";
const labelClass = "ml-0.5 text-[11px] font-bold tracking-widest text-secondary uppercase";

export default function DealerPtnMapPage() {
  const [dealers, setDealers] = useState<CompanyListItem[]>([]);
  const [shops, setShops] = useState<ShopListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [shopKeyword, setShopKeyword] = useState("");

  const [selectedDealer, setSelectedDealer] = useState<CompanyListItem | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [mappingsLoading, setMappingsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState("");
  const [globalError, setGlobalError] = useState("");

  const load = () => {
    setLoading(true);
    setLoadError("");
    Promise.all([listCompanies(), listShops()])
      .then(([companies, shopList]) => {
        setDealers(companies.filter((c) => c.coType === "DEALER"));
        setShops(shopList);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "목록을 불러오지 못했습니다."))
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
    if (!selectedDealer) return;
    setMappingsLoading(true);
    getDealerShopMappings(selectedDealer.id)
      .then((shopCodes) => setChecked(new Set(shopCodes)))
      .catch((err) => setGlobalError(err instanceof Error ? err.message : "매핑 현황을 불러오지 못했습니다."))
      .finally(() => setMappingsLoading(false));
  }, [selectedDealer]);

  const filteredDealers = useMemo(() => {
    const kw = appliedKeyword.trim();
    return kw ? dealers.filter((d) => d.name.includes(kw)) : dealers;
  }, [dealers, appliedKeyword]);

  const filteredShops = useMemo(() => {
    const kw = shopKeyword.trim();
    return kw ? shops.filter((s) => s.name.includes(kw)) : shops;
  }, [shops, shopKeyword]);

  const handleSearch = () => setAppliedKeyword(keyword);

  const columnDefs = useMemo<ColDef<CompanyListItem>[]>(
    () => [{ headerName: "딜러사명", field: "name", flex: 1, minWidth: 160 }],
    [],
  );

  const toggleShop = (shopCode: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(shopCode)) next.delete(shopCode);
      else next.add(shopCode);
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedDealer) return;
    setSaving(true);
    try {
      const shopCodes = await setDealerShopMappings(selectedDealer.id, [...checked]);
      setChecked(new Set(shopCodes));
      setToast("딜러사-시공업체 매핑을 저장했습니다.");
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-8 py-6">
      <PageBreadcrumb path="/ncp/dealer-ptn-map" />

      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
        <div className="space-y-1.5">
          <label className={labelClass}>딜러사명 검색</label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-outline" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="딜러사명"
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
        <div className="flex min-h-0 w-[360px] shrink-0 flex-col">
          <DataGrid<CompanyListItem>
            columnDefs={columnDefs}
            rowData={filteredDealers}
            getRowId={(p) => String(p.data.id)}
            onCellClicked={(e) => e.data && setSelectedDealer(e.data)}
            rowClass="cursor-pointer"
            getRowClass={(p) => (p.data && selectedDealer && p.data.id === selectedDealer.id ? "bg-primary/5" : undefined)}
            rowSelection={{ mode: "singleRow", checkboxes: false, enableClickSelection: true }}
            loading={loading}
            emptyMessage={loadError || "등록된 딜러사가 없습니다."}
          />
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
          {!selectedDealer ? (
            <p className="flex flex-1 items-center justify-center text-[12px] text-on-surface-variant">좌측에서 딜러사를 선택하세요.</p>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-on-surface">{selectedDealer.name}</h3>
                  <p className="text-[11px] text-on-surface-variant">매핑된 시공업체 {checked.size}곳</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-outline" />
                    <input
                      value={shopKeyword}
                      onChange={(e) => setShopKeyword(e.target.value)}
                      placeholder="시공업체명 검색"
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
              ) : filteredShops.length === 0 ? (
                <p className="py-8 text-center text-[12px] text-on-surface-variant">{shopKeyword ? "검색 결과가 없습니다." : "등록된 시공업체가 없습니다."}</p>
              ) : (
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2">
                    {filteredShops.map((shop) => (
                      <label
                        key={shop.shopCode}
                        className="flex items-center gap-2.5 rounded-lg border border-outline-variant/60 px-3 py-2.5 transition-all hover:bg-surface-container-low"
                      >
                        <input
                          type="checkbox"
                          checked={checked.has(shop.shopCode)}
                          onChange={() => toggleShop(shop.shopCode)}
                          className="h-4 w-4 rounded border-outline-variant text-primary"
                        />
                        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-on-surface">{shop.name}</span>
                      </label>
                    ))}
                  </div>
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
