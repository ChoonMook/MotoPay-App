// 쿠폰 발행 내역(AD-CPN-03) — 발행주체·상태·발행일 기간 필터, 행 클릭 시 개별 발급·사용 내역 상세 팝업.
// 쿠폰 발행(AD-CPN-02)은 URL경로가 "-"인 팝업 액션으로 전환돼 이 화면 상단 "쿠폰 발행" 버튼으로 노출한다
// (포인트 강제 부여/차감과 동일한 컨벤션, 2026-08-18 사용자 확정).
import { useEffect, useMemo, useState } from "react";
import type { ColDef } from "ag-grid-community";
import { Plus, Search, X } from "lucide-react";
import { listAdminCoupons, getAdminCouponDetail, type AdminCouponListItem, type AdminCouponDetail } from "../../api/coupons";
import { getGroup, type CommonCodeDetailApi } from "../../api/commonCodes";
import DataGrid from "../../components/DataGrid";
import PageBreadcrumb from "../../components/PageBreadcrumb";
import CpnIssueModal from "./CpnIssueModal";

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
  ACTIVE: "text-blue-700",
  CLOSED: "text-gray-500",
};
const ISSUANCE_STATUS_COLOR: Record<string, string> = {
  ISSUED: "text-blue-700",
  USED: "text-green-700",
  EXPIRED: "text-gray-500",
};

function DetailModal({
  couponNo,
  issuerTypeLabel,
  targetTypeLabel,
  couponTypeLabel,
  issuanceStatusLabel,
  onClose,
  onError,
}: {
  couponNo: string;
  issuerTypeLabel: (c: string) => string;
  targetTypeLabel: (c: string) => string;
  couponTypeLabel: (c: string) => string;
  issuanceStatusLabel: (c: string) => string;
  onClose: () => void;
  onError: (msg: string) => void;
}) {
  const [detail, setDetail] = useState<AdminCouponDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAdminCouponDetail(couponNo)
      .then(setDetail)
      .catch((err) => {
        onError(err instanceof Error ? err.message : "쿠폰 상세를 불러오지 못했습니다.");
        onClose();
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couponNo]);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
      <div className="flex h-full max-h-[85vh] w-full max-w-[600px] flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-outline-variant/60 px-6 py-4">
          <h3 className="text-base font-bold text-secondary">쿠폰번호 {couponNo}</h3>
          <button type="button" onClick={onClose} className="text-outline hover:text-on-surface">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loading || !detail ? (
            <div className="py-16 text-center text-xs text-on-surface-variant">불러오는 중...</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl border border-outline-variant/30 bg-surface-container-low p-4 text-xs">
                <div>
                  <span className="text-on-surface-variant">쿠폰명</span>
                  <div className="mt-0.5 font-bold text-secondary">{detail.name}</div>
                </div>
                <div>
                  <span className="text-on-surface-variant">쿠폰유형</span>
                  <div className="mt-0.5 font-bold text-secondary">{couponTypeLabel(detail.couponType)}</div>
                </div>
                <div>
                  <span className="text-on-surface-variant">발행주체</span>
                  <div className="mt-0.5 font-bold text-secondary">
                    {issuerTypeLabel(detail.issuerType)}
                    {detail.issuerCompanyName ? ` (${detail.issuerCompanyName})` : ""}
                  </div>
                </div>
                <div>
                  <span className="text-on-surface-variant">발행대상</span>
                  <div className="mt-0.5 font-bold text-secondary">{targetTypeLabel(detail.targetType)}</div>
                </div>
                <div>
                  <span className="text-on-surface-variant">유효기간</span>
                  <div className="mt-0.5 font-bold text-secondary">
                    {detail.validFrom} ~ {detail.validTo}
                  </div>
                </div>
                <div>
                  <span className="text-on-surface-variant">사용률</span>
                  <div className="mt-0.5 font-bold text-secondary">
                    {detail.usedCount}/{detail.issuedCount}건
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-outline-variant/30">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${detail.issuedCount > 0 ? Math.round((detail.usedCount / detail.issuedCount) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 mb-2 text-xs font-bold text-secondary">개별 발급 내역 ({detail.issuances.length}건)</div>
              <div className="overflow-hidden rounded-xl border border-outline-variant/30">
                <table className="w-full text-xs">
                  <thead className="bg-surface-container-low text-on-surface-variant">
                    <tr>
                      <th className="px-3 py-2 text-left">회원명</th>
                      <th className="px-3 py-2 text-left">상태</th>
                      <th className="px-3 py-2 text-left">발급일시</th>
                      <th className="px-3 py-2 text-left">사용일시</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.issuances.map((i) => (
                      <tr key={i.memberId} className="border-t border-outline-variant/30">
                        <td className="px-3 py-2 font-semibold text-secondary">{i.memberName}</td>
                        <td className="px-3 py-2">
                          <span className={`font-bold ${ISSUANCE_STATUS_COLOR[i.status] ?? "text-gray-600"}`}>
                            {issuanceStatusLabel(i.status)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-on-surface-variant">{formatDateTime(i.createdAt)}</td>
                        <td className="px-3 py-2 text-on-surface-variant">{i.usedAt ? formatDateTime(i.usedAt) : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CpnHistPage() {
  const [rows, setRows] = useState<AdminCouponListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [issuerTypes, setIssuerTypes] = useState<CommonCodeDetailApi[]>([]);
  const [couponTypes, setCouponTypes] = useState<CommonCodeDetailApi[]>([]);
  const [targetTypes, setTargetTypes] = useState<CommonCodeDetailApi[]>([]);
  const [issuanceStatuses, setIssuanceStatuses] = useState<CommonCodeDetailApi[]>([]);

  const [issuerTypeFilter, setIssuerTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [detailCouponNo, setDetailCouponNo] = useState<string | null>(null);
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [globalError, setGlobalError] = useState("");

  const loadRows = () => {
    setLoading(true);
    listAdminCoupons({
      issuerType: issuerTypeFilter === "all" ? undefined : issuerTypeFilter,
      status: statusFilter === "all" ? undefined : (statusFilter as "ACTIVE" | "CLOSED"),
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    })
      .then(setRows)
      .catch((err) => setGlobalError(err instanceof Error ? err.message : "쿠폰 내역을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(loadRows, []);

  useEffect(() => {
    Promise.all([
      getGroup("COUPON_ISSUER_TYPE"),
      getGroup("COUPON_TYPE"),
      getGroup("COUPON_TARGET_TYPE"),
      getGroup("COUPON_ISSUANCE_STATUS"),
    ])
      .then(([it, ct, tt, ist]) => {
        setIssuerTypes(it.details.filter((d) => d.useYn));
        setCouponTypes(ct.details);
        setTargetTypes(tt.details);
        setIssuanceStatuses(ist.details);
      })
      .catch((err) => setGlobalError(err instanceof Error ? err.message : "코드 목록을 불러오지 못했습니다."));
  }, []);

  useEffect(() => {
    if (!globalError) return;
    const t = setTimeout(() => setGlobalError(""), 3200);
    return () => clearTimeout(t);
  }, [globalError]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const issuerTypeLabel = useMemo(() => buildLabelMap(issuerTypes), [issuerTypes]);
  const couponTypeLabel = useMemo(() => buildLabelMap(couponTypes), [couponTypes]);
  const targetTypeLabel = useMemo(() => buildLabelMap(targetTypes), [targetTypes]);
  const issuanceStatusLabel = useMemo(() => buildLabelMap(issuanceStatuses), [issuanceStatuses]);

  const handleSearch = () => loadRows();

  const columnDefs = useMemo<ColDef<AdminCouponListItem>[]>(
    () => [
      { headerName: "쿠폰번호", field: "couponNo", flex: 1, minWidth: 110 },
      { headerName: "쿠폰명", field: "name", flex: 1.3, minWidth: 160 },
      {
        headerName: "발행주체",
        field: "issuerType",
        flex: 0.9,
        minWidth: 110,
        valueGetter: (p) =>
          p.data ? issuerTypeLabel(p.data.issuerType) + (p.data.issuerCompanyName ? `(${p.data.issuerCompanyName})` : "") : "",
      },
      { headerName: "발행수량", field: "issuedCount", flex: 0.7, minWidth: 90, valueFormatter: (p) => `${p.value}건` },
      { headerName: "사용수량", field: "usedCount", flex: 0.7, minWidth: 90, valueFormatter: (p) => `${p.value}건` },
      {
        headerName: "발행일",
        field: "createdAt",
        flex: 0.9,
        minWidth: 110,
        valueFormatter: (p) => p.value.slice(0, 10),
      },
      {
        headerName: "상태",
        field: "status",
        flex: 0.7,
        minWidth: 90,
        cellRenderer: (p: { value: string }) => (
          <span className={`text-xs font-bold ${STATUS_COLOR[p.value] ?? "text-gray-600"}`}>
            {p.value === "ACTIVE" ? "발행중" : "종료"}
          </span>
        ),
      },
    ],
    [issuerTypeLabel],
  );

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-8 py-6">
      <PageBreadcrumb path="/coupon/cpn-hist" />

      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label className={labelClass}>발행주체</label>
            <select value={issuerTypeFilter} onChange={(e) => setIssuerTypeFilter(e.target.value)} className={`${inputClass} w-32`}>
              <option value="all">전체</option>
              {issuerTypes.map((t) => (
                <option key={t.detailCode} value={t.detailCode}>
                  {t.detailName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>상태</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputClass} w-28`}>
              <option value="all">전체</option>
              <option value="ACTIVE">발행중</option>
              <option value="CLOSED">종료</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>발행일(시작)</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={`${inputClass} w-40`} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>발행일(종료)</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={`${inputClass} w-40`} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSearch}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
          >
            <Search className="h-3.5 w-3.5" />
            검색
          </button>
          <button
            type="button"
            onClick={() => setIssueModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/5 px-4 py-2.5 text-xs font-bold text-primary transition-all hover:bg-primary/10"
          >
            <Plus className="h-3.5 w-3.5" />
            쿠폰 발행
          </button>
        </div>
      </div>

      <DataGrid<AdminCouponListItem>
        columnDefs={columnDefs}
        rowData={rows}
        getRowId={(p) => p.data.couponNo}
        onCellClicked={(e) => e.data && setDetailCouponNo(e.data.couponNo)}
        rowClass="cursor-pointer"
        loading={loading}
        emptyMessage="조건에 맞는 쿠폰이 없습니다."
      />

      {detailCouponNo && (
        <DetailModal
          couponNo={detailCouponNo}
          issuerTypeLabel={issuerTypeLabel}
          targetTypeLabel={targetTypeLabel}
          couponTypeLabel={couponTypeLabel}
          issuanceStatusLabel={issuanceStatusLabel}
          onClose={() => setDetailCouponNo(null)}
          onError={setGlobalError}
        />
      )}

      {issueModalOpen && (
        <CpnIssueModal
          onClose={() => setIssueModalOpen(false)}
          onDone={(issuedCount) => {
            setIssueModalOpen(false);
            setToast(`${issuedCount}명에게 발행되었습니다.`);
            loadRows();
          }}
        />
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
