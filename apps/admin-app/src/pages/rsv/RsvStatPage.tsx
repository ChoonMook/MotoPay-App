// 예약시공현황(AD-RSVC-02) — 일반입찰(GENERAL)·전문가추천(EXPERT) 통합 모니터링. 기존에 "입찰 현황 모니터링"·
// "추천형 입찰 현황"으로 나뉘어 있던 메뉴를 하나로 합쳤다(2026-08-16 사용자 확정) — 목록은 공통 필터(요청유형·상태·
// 검색)로 구분하고, 행 클릭 시 요청유형에 맞는 상세(일반입찰은 응찰 비교, 전문가추천은 추천안 비교)를 모달로 보여준다.
import { useEffect, useMemo, useState } from "react";
import type { CellClickedEvent, ColDef } from "ag-grid-community";
import { Search } from "lucide-react";
import { listAdminBidRequests, type AdminBidRequestListItem } from "../../api/bidRequests";
import { getGroup, type CommonCodeDetailApi } from "../../api/commonCodes";
import DataGrid from "../../components/DataGrid";
import PageBreadcrumb from "../../components/PageBreadcrumb";
import RsvStatDetailModal from "./RsvStatDetailModal";

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

const REQ_TYPE_COLOR: Record<string, string> = {
  GENERAL: "text-blue-700",
  EXPERT: "text-purple-700",
};

const STATUS_COLOR: Record<string, string> = {
  OPEN: "text-amber-700",
  CLOSED: "text-gray-500",
  SELECTED: "text-green-700",
  CANCELLED: "text-red-600",
};

export default function RsvStatPage() {
  const [rows, setRows] = useState<AdminBidRequestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [carBrands, setCarBrands] = useState<CommonCodeDetailApi[]>([]);
  const [carModels, setCarModels] = useState<CommonCodeDetailApi[]>([]);
  const [carInsts, setCarInsts] = useState<CommonCodeDetailApi[]>([]);
  const [reqTypes, setReqTypes] = useState<CommonCodeDetailApi[]>([]);
  const [reqStatuses, setReqStatuses] = useState<CommonCodeDetailApi[]>([]);

  const [keyword, setKeyword] = useState("");
  const [reqTypeFilter, setReqTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [detailTarget, setDetailTarget] = useState<string | null>(null); // requestNo
  const [globalError, setGlobalError] = useState("");

  const loadRows = () => {
    setLoading(true);
    listAdminBidRequests({
      keyword: keyword.trim() || undefined,
      reqType: reqTypeFilter === "all" ? undefined : reqTypeFilter,
      status: statusFilter === "all" ? undefined : statusFilter,
    })
      .then(setRows)
      .catch((err) => setGlobalError(err instanceof Error ? err.message : "예약시공현황을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(loadRows, []);

  useEffect(() => {
    Promise.all([
      getGroup("CAR_BRAND"),
      getGroup("CAR_MODEL"),
      getGroup("CAR_INST"),
      getGroup("BID_REQ_TYPE"),
      getGroup("BID_REQ_STATUS"),
    ])
      .then(([brand, model, inst, reqType, status]) => {
        setCarBrands(brand.details);
        setCarModels(model.details);
        setCarInsts(inst.details);
        setReqTypes(reqType.details.filter((d) => d.useYn));
        setReqStatuses(status.details.filter((d) => d.useYn));
      })
      .catch((err) => setGlobalError(err instanceof Error ? err.message : "코드 목록을 불러오지 못했습니다."));
  }, []);

  useEffect(() => {
    if (!globalError) return;
    const t = setTimeout(() => setGlobalError(""), 3200);
    return () => clearTimeout(t);
  }, [globalError]);

  const carBrandLabel = useMemo(() => buildLabelMap(carBrands), [carBrands]);
  const carModelLabel = useMemo(() => buildLabelMap(carModels), [carModels]);
  const carInstLabel = useMemo(() => buildLabelMap(carInsts), [carInsts]);
  const reqTypeLabel = useMemo(() => buildLabelMap(reqTypes), [reqTypes]);
  const reqStatusLabel = useMemo(() => buildLabelMap(reqStatuses), [reqStatuses]);

  const carLabel = (car: AdminBidRequestListItem["car"]): string => {
    if (!car) return "-";
    const label = `${carBrandLabel(car.carBrandCode)} ${carModelLabel(car.carModelCode)}`;
    return car.trimName ? `${label} ${car.trimName}` : label;
  };

  const handleSearch = () => loadRows();

  const columnDefs = useMemo<ColDef<AdminBidRequestListItem>[]>(
    () => [
      { headerName: "요청번호", field: "requestNo", flex: 1, minWidth: 110 },
      {
        headerName: "유형",
        field: "reqType",
        flex: 0.8,
        minWidth: 100,
        cellRenderer: (p: { value: string }) => (
          <span className={`text-xs font-bold ${REQ_TYPE_COLOR[p.value] ?? "text-gray-600"}`}>{reqTypeLabel(p.value)}</span>
        ),
      },
      { headerName: "고객명", field: "customerName", flex: 0.8, minWidth: 100 },
      { headerName: "차종", flex: 1.1, minWidth: 150, valueGetter: (p) => (p.data ? carLabel(p.data.car) : "") },
      {
        headerName: "시공항목",
        flex: 1.1,
        minWidth: 140,
        valueGetter: (p) => (p.data ? p.data.itemInstCodes.map((c) => carInstLabel(c)).join(", ") : ""),
      },
      { headerName: "희망일", field: "desiredDate", flex: 0.8, minWidth: 110 },
      {
        headerName: "마감일시",
        field: "bidDeadline",
        flex: 1,
        minWidth: 140,
        valueFormatter: (p) => formatDateTime(p.value),
      },
      {
        headerName: "응찰/추천",
        field: "responseCount",
        flex: 0.7,
        minWidth: 90,
        valueFormatter: (p) => `${p.value}건`,
      },
      { headerName: "낙찰업체", field: "selectedShopName", flex: 1, minWidth: 130, valueFormatter: (p) => p.value ?? "-" },
      {
        headerName: "상태",
        field: "status",
        flex: 0.8,
        minWidth: 100,
        cellRenderer: (p: { value: string }) => (
          <span className={`text-xs font-bold ${STATUS_COLOR[p.value] ?? "text-gray-600"}`}>{reqStatusLabel(p.value)}</span>
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
    [carBrandLabel, carModelLabel, carInstLabel, reqTypeLabel, reqStatusLabel],
  );

  const onCellClicked = (e: CellClickedEvent<AdminBidRequestListItem>) => {
    if (!e.data) return;
    setDetailTarget(e.data.requestNo);
  };

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-8 py-6">
      <PageBreadcrumb path="/rsv/rsv-stat" />

      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label className={labelClass}>검색</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="고객명 또는 요청번호"
              className={`${inputClass} w-56`}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>요청유형</label>
            <select value={reqTypeFilter} onChange={(e) => setReqTypeFilter(e.target.value)} className={`${inputClass} w-32`}>
              <option value="all">전체</option>
              {reqTypes.map((t) => (
                <option key={t.detailCode} value={t.detailCode}>
                  {t.detailName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>상태</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputClass} w-32`}>
              <option value="all">전체</option>
              {reqStatuses.map((s) => (
                <option key={s.detailCode} value={s.detailCode}>
                  {s.detailName}
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

      <DataGrid<AdminBidRequestListItem>
        columnDefs={columnDefs}
        rowData={rows}
        getRowId={(p) => p.data.requestNo}
        onCellClicked={onCellClicked}
        rowClass="cursor-pointer"
        loading={loading}
        emptyMessage="조건에 맞는 요청이 없습니다."
      />

      {detailTarget && (
        <RsvStatDetailModal
          requestNo={detailTarget}
          carBrandLabel={carBrandLabel}
          carModelLabel={carModelLabel}
          carInstLabel={carInstLabel}
          reqTypeLabel={reqTypeLabel}
          reqStatusLabel={reqStatusLabel}
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
