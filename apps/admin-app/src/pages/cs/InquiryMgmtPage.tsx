// 1:1 문의 관리(AD-CS-02) — 문의유형·상태·문의자 검색·접수일 기간 필터, 행 클릭 시 상세+답변 작성 팝업.
// 답변은 실제 이메일 발송 없이(발송 인프라 없음) 등록 즉시 문의자 앱 내 문의 상세 화면에 반영된다.
import { useEffect, useMemo, useState } from "react";
import type { ColDef } from "ag-grid-community";
import { Search, X } from "lucide-react";
import {
  listAdminInquiries,
  getAdminInquiryDetail,
  answerInquiry,
  type AdminInquiryListItem,
  type AdminInquiryDetail,
} from "../../api/inquiries";
import { getGroup, type CommonCodeDetailApi } from "../../api/commonCodes";
import { API_BASE_URL } from "../../api/config";
import ConfirmModal from "../../components/ConfirmModal";
import DataGrid from "../../components/DataGrid";
import PageBreadcrumb from "../../components/PageBreadcrumb";

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
  PENDING: "text-amber-700",
  ANSWERED: "text-green-700",
};

function DetailModal({
  inquiryNo,
  categoryLabel,
  statusLabel,
  onClose,
  onAnswered,
  onError,
}: {
  inquiryNo: string;
  categoryLabel: (c: string) => string;
  statusLabel: (c: string) => string;
  onClose: () => void;
  onAnswered: () => void;
  onError: (msg: string) => void;
}) {
  const [detail, setDetail] = useState<AdminInquiryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [answerDraft, setAnswerDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmingSend, setConfirmingSend] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAdminInquiryDetail(inquiryNo)
      .then((d) => {
        setDetail(d);
        setAnswerDraft(d.answer ?? "");
      })
      .catch((err) => {
        onError(err instanceof Error ? err.message : "문의 상세를 불러오지 못했습니다.");
        onClose();
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inquiryNo]);

  const doSend = async () => {
    if (!answerDraft.trim()) return;
    setConfirmingSend(false);
    setSubmitting(true);
    try {
      await answerInquiry(inquiryNo, answerDraft.trim());
      onAnswered();
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : "답변 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
      <div className="flex h-full max-h-[85vh] w-full max-w-[600px] flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-outline-variant/60 px-6 py-4">
          <h3 className="text-base font-bold text-secondary">접수번호 {inquiryNo}</h3>
          <button type="button" onClick={onClose} className="text-outline hover:text-on-surface">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loading || !detail ? (
            <div className="py-16 text-center text-xs text-on-surface-variant">불러오는 중...</div>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xs font-bold text-primary">{categoryLabel(detail.category)}</span>
                <span className={`text-xs font-bold ${STATUS_COLOR[detail.status] ?? "text-gray-600"}`}>
                  {statusLabel(detail.status)}
                </span>
              </div>
              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-4 text-xs">
                <div className="text-sm font-bold text-secondary">{detail.title}</div>
                <div className="mt-1 text-on-surface-variant">
                  {detail.memberName} · {formatDateTime(detail.createdAt)}
                </div>
                <p className="mt-3 leading-relaxed whitespace-pre-wrap text-secondary">{detail.content}</p>
                {detail.photos.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {detail.photos.map((photo) => (
                      <a key={photo} href={`${API_BASE_URL}/uploads/${photo}`} target="_blank" rel="noreferrer">
                        <img
                          src={`${API_BASE_URL}/uploads/${photo}`}
                          alt="첨부 사진"
                          className="h-16 w-16 rounded-lg border border-outline-variant/40 object-cover"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 space-y-1.5">
                <label className={labelClass}>답변 작성</label>
                <textarea
                  value={answerDraft}
                  onChange={(e) => setAnswerDraft(e.target.value)}
                  rows={5}
                  placeholder="답변 내용을 입력해 주세요"
                  className={`${inputClass} resize-none`}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-outline-variant/60 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-outline-variant px-4 py-2.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container-low"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={() => setConfirmingSend(true)}
            disabled={submitting || !answerDraft.trim()}
            className="rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "발송 중..." : "답변 발송"}
          </button>
        </div>
      </div>

      {confirmingSend && (
        <ConfirmModal
          title="답변 발송"
          message="답변을 발송하시겠습니까? 발송 후에는 문의자가 문의 내용을 수정할 수 없습니다."
          confirmLabel="발송"
          onCancel={() => setConfirmingSend(false)}
          onConfirm={doSend}
        />
      )}
    </div>
  );
}

export default function InquiryMgmtPage() {
  const [rows, setRows] = useState<AdminInquiryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CommonCodeDetailApi[]>([]);
  const [statuses, setStatuses] = useState<CommonCodeDetailApi[]>([]);

  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [detailNo, setDetailNo] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState("");

  const loadRows = () => {
    setLoading(true);
    listAdminInquiries({
      keyword: keyword.trim() || undefined,
      category: categoryFilter === "all" ? undefined : categoryFilter,
      status: statusFilter === "all" ? undefined : statusFilter,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    })
      .then(setRows)
      .catch((err) => setGlobalError(err instanceof Error ? err.message : "문의 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(loadRows, []);

  useEffect(() => {
    Promise.all([getGroup("INQUIRY_CATEGORY"), getGroup("INQUIRY_STATUS")])
      .then(([cat, status]) => {
        setCategories(cat.details.filter((d) => d.useYn));
        setStatuses(status.details.filter((d) => d.useYn));
      })
      .catch((err) => setGlobalError(err instanceof Error ? err.message : "코드 목록을 불러오지 못했습니다."));
  }, []);

  useEffect(() => {
    if (!globalError) return;
    const t = setTimeout(() => setGlobalError(""), 3200);
    return () => clearTimeout(t);
  }, [globalError]);

  const categoryLabel = useMemo(() => buildLabelMap(categories), [categories]);
  const statusLabel = useMemo(() => buildLabelMap(statuses), [statuses]);
  const handleSearch = () => loadRows();

  const columnDefs = useMemo<ColDef<AdminInquiryListItem>[]>(
    () => [
      { headerName: "접수번호", field: "inquiryNo", flex: 1, minWidth: 110 },
      { headerName: "문의자", field: "memberName", flex: 0.8, minWidth: 100 },
      {
        headerName: "문의유형",
        field: "category",
        flex: 0.9,
        minWidth: 110,
        valueFormatter: (p) => categoryLabel(p.value),
      },
      { headerName: "제목", field: "title", flex: 1.5, minWidth: 200 },
      { headerName: "접수일", field: "createdAt", flex: 1, minWidth: 140, valueFormatter: (p) => formatDateTime(p.value) },
      {
        headerName: "상태",
        field: "status",
        flex: 0.7,
        minWidth: 100,
        cellRenderer: (p: { value: string }) => (
          <span className={`text-xs font-bold ${STATUS_COLOR[p.value] ?? "text-gray-600"}`}>{statusLabel(p.value)}</span>
        ),
      },
    ],
    [categoryLabel, statusLabel],
  );

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-8 py-6">
      <PageBreadcrumb path="/cs/inquiry-mgmt" />

      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label className={labelClass}>문의자 검색</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="문의자명"
              className={`${inputClass} w-40`}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>문의유형</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={`${inputClass} w-36`}>
              <option value="all">전체</option>
              {categories.map((c) => (
                <option key={c.detailCode} value={c.detailCode}>
                  {c.detailName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>상태</label>
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
            <label className={labelClass}>접수일(시작)</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={`${inputClass} w-40`} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>접수일(종료)</label>
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

      <DataGrid<AdminInquiryListItem>
        columnDefs={columnDefs}
        rowData={rows}
        getRowId={(p) => p.data.inquiryNo}
        onCellClicked={(e) => e.data && setDetailNo(e.data.inquiryNo)}
        rowClass="cursor-pointer"
        loading={loading}
        emptyMessage="조건에 맞는 문의가 없습니다."
      />

      {detailNo && (
        <DetailModal
          inquiryNo={detailNo}
          categoryLabel={categoryLabel}
          statusLabel={statusLabel}
          onClose={() => setDetailNo(null)}
          onAnswered={() => {
            loadRows();
          }}
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
