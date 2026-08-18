// 후기 관리(AD-NOTI-02) — 부적절 후기 블라인드 처리. 블라인드 처리 시 즉시 고객·업체 화면에서 숨김된다.
import { useEffect, useMemo, useState } from "react";
import type { ColDef } from "ag-grid-community";
import { EyeOff, Eye, Search, Star } from "lucide-react";
import { listAdminReviews, setReviewBlinded, type AdminReviewListItem } from "../../api/reviews";
import DataGrid from "../../components/DataGrid";
import PageBreadcrumb from "../../components/PageBreadcrumb";

const inputClass =
  "w-full rounded-lg border border-[#ced4da] bg-white px-3 py-2 text-xs font-normal outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5";
const labelClass = "ml-0.5 text-[11px] font-bold tracking-widest text-secondary uppercase";

function formatDateTime(value: string): string {
  return value.replace("T", " ").slice(0, 16);
}

export default function ReviewMgmtPage() {
  const [rows, setRows] = useState<AdminReviewListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // all/visible/blinded
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [globalError, setGlobalError] = useState("");
  const [toast, setToast] = useState("");

  const loadRows = () => {
    setLoading(true);
    listAdminReviews({
      keyword: keyword.trim() || undefined,
      rating: ratingFilter === "all" ? undefined : Number(ratingFilter),
      isBlinded: statusFilter === "all" ? undefined : statusFilter === "blinded",
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    })
      .then(setRows)
      .catch((err) => setGlobalError(err instanceof Error ? err.message : "후기 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(loadRows, []);

  useEffect(() => {
    if (!globalError) return;
    const t = setTimeout(() => setGlobalError(""), 3200);
    return () => clearTimeout(t);
  }, [globalError]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const handleSearch = () => loadRows();

  const toggleBlind = async (row: AdminReviewListItem) => {
    try {
      const updated = await setReviewBlinded(row.id, !row.isBlinded);
      setRows((prev) => prev.map((r) => (r.id === row.id ? updated : r)));
      setToast(updated.isBlinded ? "블라인드 처리했습니다." : "블라인드를 해제했습니다.");
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "처리에 실패했습니다.");
    }
  };

  const columnDefs = useMemo<ColDef<AdminReviewListItem>[]>(
    () => [
      { headerName: "작성자", field: "memberNameMasked", flex: 0.7, minWidth: 90 },
      { headerName: "업체명", field: "shopName", flex: 1, minWidth: 140 },
      {
        headerName: "평점",
        field: "rating",
        flex: 0.6,
        minWidth: 80,
        cellClass: "flex items-center justify-center",
        cellRenderer: (p: { value: number }) => (
          <div className="flex h-full w-full items-center justify-center gap-1 text-xs font-bold text-amber-600">
            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
            {p.value}
          </div>
        ),
      },
      { headerName: "내용", field: "content", flex: 2, minWidth: 220 },
      { headerName: "작성일", field: "createdAt", flex: 1, minWidth: 140, valueFormatter: (p) => formatDateTime(p.value) },
      {
        headerName: "노출상태",
        field: "isBlinded",
        flex: 0.8,
        minWidth: 100,
        cellRenderer: (p: { value: boolean }) => (
          <div className={`flex h-full w-full items-center text-xs font-bold ${p.value ? "text-gray-400 line-through" : "text-blue-700"}`}>
            {p.value ? "블라인드" : "노출"}
          </div>
        ),
      },
      {
        headerName: "처리",
        colId: "action",
        width: 128,
        sortable: false,
        resizable: false,
        cellClass: "flex items-center justify-center",
        cellRenderer: (p: { data?: AdminReviewListItem }) =>
          p.data ? (
            <div className="flex h-full w-full items-center justify-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleBlind(p.data as AdminReviewListItem);
                }}
                className={`flex h-7 items-center justify-center gap-1 rounded-lg px-2.5 text-[11px] leading-none font-bold whitespace-nowrap transition-all ${
                  p.data.isBlinded
                    ? "border border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
                    : "border border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
                }`}
              >
                {p.data.isBlinded ? <Eye className="h-3 w-3 shrink-0" /> : <EyeOff className="h-3 w-3 shrink-0" />}
                {p.data.isBlinded ? "블라인드 해제" : "블라인드 처리"}
              </button>
            </div>
          ) : null,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-8 py-6">
      <PageBreadcrumb path="/review/review-mgmt" />

      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label className={labelClass}>업체명 검색</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="업체명"
              className={`${inputClass} w-40`}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>평점</label>
            <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} className={`${inputClass} w-24`}>
              <option value="all">전체</option>
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r}점
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>노출상태</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputClass} w-28`}>
              <option value="all">전체</option>
              <option value="visible">노출</option>
              <option value="blinded">블라인드</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>작성일(시작)</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={`${inputClass} w-40`} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>작성일(종료)</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={`${inputClass} w-40`} />
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

      <DataGrid<AdminReviewListItem>
        columnDefs={columnDefs}
        rowData={rows}
        getRowId={(p) => String(p.data.id)}
        getRowClass={(p) => (p.data?.isBlinded ? "opacity-50" : undefined)}
        loading={loading}
        emptyMessage="조건에 맞는 후기가 없습니다."
      />

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
