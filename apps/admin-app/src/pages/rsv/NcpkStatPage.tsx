// 신차패키지 시공현황(AD-NCPK-07) — 전체 업체(shopCode 무관) 대상 신차패키지(reservationType=PKG) 예약 통합
// 모니터링. 예약시공현황(AD-RSVC-02)과 동일하게 목록+상세팝업 구조로 구성(2026-08-18 사용자 확정으로 예약시공
// 관리 메뉴 하위에 배치).
import { useEffect, useMemo, useState } from "react";
import type { CellClickedEvent, ColDef } from "ag-grid-community";
import { Search } from "lucide-react";
import {
  listAdminPackageReservations,
  type AdminPackageReservationListItem,
} from "../../api/ncpkReservations";
import { getGroup, type CommonCodeDetailApi } from "../../api/commonCodes";
import { listCompanies, type CompanyListItem } from "../../api/companies";
import DataGrid from "../../components/DataGrid";
import PageBreadcrumb from "../../components/PageBreadcrumb";
import NcpkStatDetailModal from "./NcpkStatDetailModal";

const inputClass =
  "w-full rounded-lg border border-[#ced4da] bg-white px-3 py-2 text-xs font-normal outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5";
const labelClass = "ml-0.5 text-[11px] font-bold tracking-widest text-secondary uppercase";

function buildLabelMap(details: CommonCodeDetailApi[]): (code: string) => string {
  const map = new Map(details.map((d) => [d.detailCode, d.detailName]));
  return (code: string) => map.get(code) ?? code;
}

function formatDateTime(value: string): string {
  return value.replace("T", " ").slice(0, 16);
}

const STATUS_COLOR: Record<string, string> = {
  CONFIRMED: "text-blue-700",
  CANCELLED: "text-red-600",
};

const PROGRESS_COLOR: Record<string, string> = {
  APPLIED: "text-amber-700",
  IN_PROGRESS: "text-blue-700",
  DONE: "text-green-700",
};

export default function NcpkStatPage() {
  const [rows, setRows] = useState<AdminPackageReservationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState<CommonCodeDetailApi[]>([]);
  const [progressStatuses, setProgressStatuses] = useState<CommonCodeDetailApi[]>([]);
  const [prodCats, setProdCats] = useState<CommonCodeDetailApi[]>([]);
  const [dealers, setDealers] = useState<CompanyListItem[]>([]);

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [progressFilter, setProgressFilter] = useState("all");
  const [dealerFilter, setDealerFilter] = useState("all");

  const [detailTarget, setDetailTarget] = useState<string | null>(null); // reservationNo
  const [globalError, setGlobalError] = useState("");

  const loadRows = () => {
    setLoading(true);
    listAdminPackageReservations({
      keyword: keyword.trim() || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      progressStatus: progressFilter === "all" ? undefined : progressFilter,
      dealerCompanyId: dealerFilter === "all" ? undefined : Number(dealerFilter),
    })
      .then(setRows)
      .catch((err) => setGlobalError(err instanceof Error ? err.message : "신차패키지 시공현황을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(loadRows, []);

  useEffect(() => {
    Promise.all([
      getGroup("RESERVATION_STATUS"),
      getGroup("RESERVATION_PROGRESS"),
      getGroup("PROD_CAT"),
      listCompanies(),
    ])
      .then(([status, progress, prodCat, companies]) => {
        setStatuses(status.details.filter((d) => d.useYn));
        setProgressStatuses(progress.details.filter((d) => d.useYn));
        setProdCats(prodCat.details);
        setDealers(companies.filter((c) => c.coType === "DEALER" && c.useYn));
      })
      .catch((err) => setGlobalError(err instanceof Error ? err.message : "코드 목록을 불러오지 못했습니다."));
  }, []);

  useEffect(() => {
    if (!globalError) return;
    const t = setTimeout(() => setGlobalError(""), 3200);
    return () => clearTimeout(t);
  }, [globalError]);

  const statusLabel = useMemo(() => buildLabelMap(statuses), [statuses]);
  const progressLabel = useMemo(() => buildLabelMap(progressStatuses), [progressStatuses]);
  const prodCatLabel = useMemo(() => buildLabelMap(prodCats), [prodCats]);

  const handleSearch = () => loadRows();

  const columnDefs = useMemo<ColDef<AdminPackageReservationListItem>[]>(
    () => [
      { headerName: "예약번호", field: "reservationNo", flex: 1, minWidth: 110 },
      { headerName: "고객명", field: "customerName", flex: 0.8, minWidth: 100 },
      { headerName: "차량", field: "car", flex: 1.1, minWidth: 150, valueFormatter: (p) => p.value ?? "-" },
      { headerName: "VIN", field: "vin", flex: 1, minWidth: 140, valueFormatter: (p) => p.value ?? "-" },
      { headerName: "패키지", field: "packageName", flex: 1.1, minWidth: 140, valueFormatter: (p) => p.value ?? "-" },
      { headerName: "딜러사", field: "dealerName", flex: 1, minWidth: 130, valueFormatter: (p) => p.value ?? "-" },
      { headerName: "시공업체", field: "shopName", flex: 1, minWidth: 130 },
      {
        headerName: "예약일시",
        flex: 1,
        minWidth: 140,
        valueGetter: (p) => (p.data ? `${p.data.date} ${p.data.time}` : ""),
      },
      {
        headerName: "예약상태",
        field: "status",
        flex: 0.8,
        minWidth: 100,
        cellRenderer: (p: { value: string }) => (
          <span className={`text-xs font-bold ${STATUS_COLOR[p.value] ?? "text-gray-600"}`}>{statusLabel(p.value)}</span>
        ),
      },
      {
        headerName: "진행상태",
        field: "progressStatus",
        flex: 0.8,
        minWidth: 100,
        cellRenderer: (p: { value: string; data?: AdminPackageReservationListItem }) =>
          p.data?.status === "CANCELLED" ? (
            <span className="text-xs text-gray-400">-</span>
          ) : (
            <span className={`text-xs font-bold ${PROGRESS_COLOR[p.value] ?? "text-gray-600"}`}>{progressLabel(p.value)}</span>
          ),
      },
      {
        headerName: "등록일시",
        field: "createdAt",
        flex: 1,
        minWidth: 140,
        valueFormatter: (p) => formatDateTime(p.value),
      },
    ],
    [statusLabel, progressLabel],
  );

  const onCellClicked = (e: CellClickedEvent<AdminPackageReservationListItem>) => {
    if (!e.data) return;
    setDetailTarget(e.data.reservationNo);
  };

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-8 py-6">
      <PageBreadcrumb path="/rsv/ncpk-stat" />

      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label className={labelClass}>검색</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="고객명 또는 예약번호"
              className={`${inputClass} w-56`}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>예약상태</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputClass} w-32`}>
              <option value="all">전체</option>
              {statuses.map((s) => (
                <option key={s.detailCode} value={s.detailCode}>
                  {s.detailName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>진행상태</label>
            <select value={progressFilter} onChange={(e) => setProgressFilter(e.target.value)} className={`${inputClass} w-32`}>
              <option value="all">전체</option>
              {progressStatuses.map((s) => (
                <option key={s.detailCode} value={s.detailCode}>
                  {s.detailName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>딜러사</label>
            <select value={dealerFilter} onChange={(e) => setDealerFilter(e.target.value)} className={`${inputClass} w-36`}>
              <option value="all">전체</option>
              {dealers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
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

      <DataGrid<AdminPackageReservationListItem>
        columnDefs={columnDefs}
        rowData={rows}
        getRowId={(p) => p.data.reservationNo}
        onCellClicked={onCellClicked}
        rowClass="cursor-pointer"
        loading={loading}
        emptyMessage="조건에 맞는 예약이 없습니다."
      />

      {detailTarget && (
        <NcpkStatDetailModal
          reservationNo={detailTarget}
          statusLabel={statusLabel}
          progressLabel={progressLabel}
          prodCatLabel={prodCatLabel}
          onClose={() => setDetailTarget(null)}
          onError={setGlobalError}
        />
      )}

      {globalError && (
        <div className="fixed right-6 bottom-6 z-[999] rounded-lg bg-red-600 px-4 py-3 text-xs font-bold text-white shadow-xl">
          {globalError}
        </div>
      )}
    </div>
  );
}
