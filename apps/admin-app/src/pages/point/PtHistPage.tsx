// 포인트 내역 조회(AD-PNT-06) — 전체 회원 포인트 입출 내역, 회원·구분·기간 필터. 포인트 강제 부여(AD-PNT-04)/
// 강제 차감(AD-PNT-05)은 URL경로가 "-"인 팝업 액션이라 독립 메뉴가 아니라 이 화면 상단 버튼으로 노출한다.
import { useEffect, useMemo, useState } from "react";
import type { ColDef } from "ag-grid-community";
import { Car, MinusCircle, PlusCircle, Search } from "lucide-react";
import { listAdminPointHistories, type AdminPointHistoryListItem } from "../../api/points";
import { getGroup, type CommonCodeDetailApi } from "../../api/commonCodes";
import DataGrid from "../../components/DataGrid";
import PageBreadcrumb from "../../components/PageBreadcrumb";
import ForcePointAdjustModal from "./ForcePointAdjustModal";
import GrantPurchasePointsModal from "./GrantPurchasePointsModal";

const inputClass =
  "w-full rounded-lg border border-[#ced4da] bg-white px-3 py-2 text-xs font-normal outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5";
const labelClass = "ml-0.5 text-[11px] font-bold tracking-widest text-secondary uppercase";

function buildLabelMap(details: CommonCodeDetailApi[]): (code: string) => string {
  const map = new Map(details.map((d) => [d.detailCode, d.detailName]));
  return (code: string) => map.get(code) ?? code;
}

function nfmt(n: number): string {
  return n.toLocaleString("en-US");
}

function formatDateTime(value: string): string {
  return value.replace("T", " ").slice(0, 16);
}

const KIND_COLOR: Record<string, string> = {
  CHARGE: "text-blue-700",
  USE: "text-gray-500",
  GRANT: "text-orange-600",
  DEDUCT: "text-orange-600",
  PURCHASE_GRANT: "text-teal-600",
};

export default function PtHistPage() {
  const [rows, setRows] = useState<AdminPointHistoryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [kinds, setKinds] = useState<CommonCodeDetailApi[]>([]);

  const [keyword, setKeyword] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [modalMode, setModalMode] = useState<"grant" | "deduct" | null>(null);
  const [purchaseGrantOpen, setPurchaseGrantOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<AdminPointHistoryListItem | null>(null);
  const [toast, setToast] = useState("");
  const [globalError, setGlobalError] = useState("");

  const loadRows = () => {
    setLoading(true);
    listAdminPointHistories({
      keyword: keyword.trim() || undefined,
      kind: kindFilter === "all" ? undefined : kindFilter,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    })
      .then(setRows)
      .catch((err) => setGlobalError(err instanceof Error ? err.message : "포인트 내역을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(loadRows, []);

  useEffect(() => {
    getGroup("POINT_HIST_KIND")
      .then((g) => setKinds(g.details.filter((d) => d.useYn)))
      .catch((err) => setGlobalError(err instanceof Error ? err.message : "코드 목록을 불러오지 못했습니다."));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!globalError) return;
    const t = setTimeout(() => setGlobalError(""), 3200);
    return () => clearTimeout(t);
  }, [globalError]);

  const kindLabel = useMemo(() => buildLabelMap(kinds), [kinds]);
  const handleSearch = () => loadRows();

  const columnDefs = useMemo<ColDef<AdminPointHistoryListItem>[]>(
    () => [
      { headerName: "회원명", field: "memberName", flex: 0.9, minWidth: 110 },
      {
        headerName: "구분",
        field: "kind",
        flex: 0.8,
        minWidth: 100,
        cellRenderer: (p: { value: string }) => (
          <span className={`text-xs font-bold ${KIND_COLOR[p.value] ?? "text-gray-600"}`}>{kindLabel(p.value)}</span>
        ),
      },
      {
        headerName: "금액",
        field: "amount",
        flex: 0.9,
        minWidth: 110,
        cellRenderer: (p: { value: number }) => (
          <span className={`text-xs font-bold tabular-nums ${p.value >= 0 ? "text-blue-700" : "text-red-600"}`}>
            {p.value >= 0 ? "+" : ""}
            {nfmt(p.value)}원
          </span>
        ),
      },
      { headerName: "처리 후 잔액", field: "balanceAfter", flex: 0.9, minWidth: 110, valueFormatter: (p) => `${nfmt(p.value)}원` },
      { headerName: "처리자", field: "createdBy", flex: 0.8, minWidth: 100, valueFormatter: (p) => p.value ?? "-" },
      { headerName: "처리일시", field: "createdAt", flex: 1, minWidth: 150, valueFormatter: (p) => formatDateTime(p.value) },
    ],
    [kindLabel],
  );

  const onRowClicked = (data: AdminPointHistoryListItem | undefined) => {
    if (!data) return;
    setDetailRow(data);
  };

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-8 py-6">
      <PageBreadcrumb path="/point/pt-hist" />

      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label className={labelClass}>검색</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="회원명"
              className={`${inputClass} w-40`}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>구분</label>
            <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value)} className={`${inputClass} w-32`}>
              <option value="all">전체</option>
              {kinds.map((k) => (
                <option key={k.detailCode} value={k.detailCode}>
                  {k.detailName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>기간(시작)</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={`${inputClass} w-40`} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>기간(종료)</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={`${inputClass} w-40`} />
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPurchaseGrantOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-outline-variant bg-white px-4 py-2.5 text-xs font-bold text-secondary transition-all hover:bg-surface-container-low"
          >
            <Car className="h-3.5 w-3.5" />
            신차구매 포인트 지급
          </button>
          <button
            type="button"
            onClick={() => setModalMode("grant")}
            className="flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/5 px-4 py-2.5 text-xs font-bold text-primary transition-all hover:bg-primary/10"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            포인트 강제 부여
          </button>
          <button
            type="button"
            onClick={() => setModalMode("deduct")}
            className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-600 transition-all hover:bg-red-100"
          >
            <MinusCircle className="h-3.5 w-3.5" />
            포인트 강제 차감
          </button>
        </div>
      </div>

      <DataGrid<AdminPointHistoryListItem>
        columnDefs={columnDefs}
        rowData={rows}
        getRowId={(p) => String(p.data.id)}
        onCellClicked={(e) => onRowClicked(e.data)}
        rowClass="cursor-pointer"
        loading={loading}
        emptyMessage="조건에 맞는 내역이 없습니다."
      />

      {modalMode && (
        <ForcePointAdjustModal
          mode={modalMode}
          onClose={() => setModalMode(null)}
          onDone={() => {
            setModalMode(null);
            setToast(modalMode === "grant" ? "포인트를 부여했습니다." : "포인트를 차감했습니다.");
            loadRows();
          }}
        />
      )}

      {purchaseGrantOpen && (
        <GrantPurchasePointsModal
          onClose={() => setPurchaseGrantOpen(false)}
          onDone={(successCount) => {
            setPurchaseGrantOpen(false);
            setToast(`${successCount}건 지급했습니다.`);
            loadRows();
          }}
        />
      )}

      {detailRow && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm" onClick={() => setDetailRow(null)}>
          <div
            className="w-full max-w-[400px] rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-sm font-bold text-secondary">
              {detailRow.memberName} · {kindLabel(detailRow.kind)}
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">금액</span>
                <span className="font-bold text-secondary">
                  {detailRow.amount >= 0 ? "+" : ""}
                  {nfmt(detailRow.amount)}원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">처리자</span>
                <span className="font-bold text-secondary">{detailRow.createdBy ?? "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">처리일시</span>
                <span className="font-bold text-secondary">{formatDateTime(detailRow.createdAt)}</span>
              </div>
              <div className="border-t border-outline-variant/30 pt-2.5">
                <span className="text-on-surface-variant">사유</span>
                <p className="mt-1 leading-relaxed text-secondary">{detailRow.reason ?? "-"}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDetailRow(null)}
              className="mt-5 w-full rounded-lg border border-outline-variant px-4 py-2.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container-low"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed right-6 bottom-6 z-[999] rounded-lg bg-secondary px-4 py-3 text-xs font-bold text-white shadow-xl">
          {toast}
        </div>
      )}
      {globalError && (
        <div className="fixed right-6 bottom-6 z-[999] rounded-lg bg-red-600 px-4 py-3 text-xs font-bold text-white shadow-xl">
          {globalError}
        </div>
      )}
    </div>
  );
}
