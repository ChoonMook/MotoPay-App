// 고객 회원 목록 (uploads/MotoPay_프로그램목록표_v1_46.xlsx "관리자웹_프로그램" 시트 AD-MBR-02 스펙 이식)
// [구성요소] 상단 필터 바(이름·휴대폰번호 검색/가입일 기간/상태) + 하단 목록 테이블(페이징)
// [인터랙션] 검색 버튼(또는 검색어 입력 후 Enter) 클릭 시에만 필터가 적용되고, 행 클릭 시 회원 상세
// (보유차량·신차패키지) 팝업 / 탈퇴 처리·취소
// apps/api(/admin/members/*)와 연동된 실 데이터 화면. "이용내역"은 스펙상 구체적인 필드 정의가 없어
// 이번 화면 범위에서는 보유차량·신차패키지까지만 상세 팝업에 반영(회원번호 컬럼은 노출하지 않고, 로그인 아이디인
// 회원아이디를 대신 노출)
import { useEffect, useMemo, useState } from "react";
import type { CellClickedEvent, ColDef } from "ag-grid-community";
import { Download, Search, X } from "lucide-react";
import {
  getMemberDetail,
  listMembers,
  setMemberWithdrawn,
  type AdminMemberDetail,
  type AdminMemberListItem,
} from "../../api/adminMembers";
import { getGroup, type CommonCodeDetailApi } from "../../api/commonCodes";
import ConfirmModal from "../../components/ConfirmModal";
import DataGrid from "../../components/DataGrid";
import ExcelActionButton from "../../components/ExcelActionButton";
import { exportRowsAsXlsx } from "../../lib/exportXlsx";
import PageBreadcrumb from "../../components/PageBreadcrumb";

const inputClass =
  "w-full rounded-lg border border-[#ced4da] bg-white px-3 py-2 text-xs font-normal outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5";
const labelClass = "ml-0.5 text-[11px] font-bold tracking-widest text-secondary uppercase";

function formatDate(value: string | null): string {
  if (!value) return "-";
  return value.slice(0, 10);
}

function formatDateTime(value: string | null): string {
  if (!value) return "-";
  return value.replace("T", " ").slice(0, 16);
}

function isWithdrawn(item: AdminMemberListItem): boolean {
  return item.withdrawnAt !== null;
}

function buildLabelMap(details: CommonCodeDetailApi[]): (code: string) => string {
  const map = new Map(details.map((d) => [d.detailCode, d.detailName]));
  return (code: string) => map.get(code) ?? code;
}

function MemberDetailModal({
  memberId,
  onClose,
  onWithdrawnChange,
}: {
  memberId: string;
  onClose: () => void;
  onWithdrawnChange: (item: AdminMemberListItem) => void;
}) {
  const [detail, setDetail] = useState<AdminMemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [carBrandLabel, setCarBrandLabel] = useState<(code: string) => string>(() => (c: string) => c);
  const [carModelLabel, setCarModelLabel] = useState<(code: string) => string>(() => (c: string) => c);
  const [pendingWithdraw, setPendingWithdraw] = useState<{ next: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    getMemberDetail(memberId)
      .then(setDetail)
      .catch((err) => setError(err instanceof Error ? err.message : "회원 상세를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [memberId]);

  useEffect(() => {
    getGroup("CAR_BRAND").then((g) => setCarBrandLabel(() => buildLabelMap(g.details)));
    getGroup("CAR_MODEL").then((g) => setCarModelLabel(() => buildLabelMap(g.details)));
  }, []);

  const confirmWithdrawToggle = async () => {
    if (!pendingWithdraw || !detail) return;
    setSubmitting(true);
    try {
      const updated = await setMemberWithdrawn(detail.id, pendingWithdraw.next);
      setDetail({ ...detail, withdrawnAt: updated.withdrawnAt });
      onWithdrawnChange(updated);
      setPendingWithdraw(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "탈퇴 상태 변경에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-[560px] flex-col rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-secondary">회원 상세</h3>
          <button type="button" onClick={onClose} className="text-outline hover:text-on-surface">
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <p className="py-8 text-center text-xs font-medium text-on-surface-variant">불러오는 중...</p>
        ) : !detail ? (
          <p className="py-8 text-center text-xs font-medium text-red-600">{error || "회원 정보를 찾을 수 없습니다."}</p>
        ) : (
          <div className="flex-1 space-y-5 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>회원아이디</label>
                <input value={detail.username} disabled className={`${inputClass} cursor-not-allowed bg-surface-container-low text-on-surface-variant`} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>이름</label>
                <input value={detail.name} disabled className={`${inputClass} cursor-not-allowed bg-surface-container-low text-on-surface-variant`} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>상태</label>
                <input
                  value={detail.withdrawnAt ? "탈퇴" : "정상"}
                  disabled
                  className={`${inputClass} cursor-not-allowed bg-surface-container-low text-on-surface-variant`}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>휴대폰번호</label>
                <input value={detail.phone ?? "-"} disabled className={`${inputClass} cursor-not-allowed bg-surface-container-low text-on-surface-variant`} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>이메일</label>
                <input value={detail.email ?? "-"} disabled className={`${inputClass} cursor-not-allowed bg-surface-container-low text-on-surface-variant`} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>가입일</label>
                <input value={formatDate(detail.createdAt)} disabled className={`${inputClass} cursor-not-allowed bg-surface-container-low text-on-surface-variant`} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>보유차량수</label>
                <input value={String(detail.carCount)} disabled className={`${inputClass} cursor-not-allowed bg-surface-container-low text-on-surface-variant`} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>최근 로그인 일시</label>
                <input value={formatDateTime(detail.lastLoginAt)} disabled className={`${inputClass} cursor-not-allowed bg-surface-container-low text-on-surface-variant`} />
              </div>
            </div>

            <div className="space-y-2">
              <p className={labelClass}>보유차량</p>
              {detail.cars.length === 0 ? (
                <p className="rounded-lg border border-outline-variant/60 bg-surface-container-low px-3 py-2.5 text-[11px] text-on-surface-variant">등록된 차량이 없습니다.</p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-outline-variant/60">
                  <table className="w-full text-[11px]">
                    <thead className="bg-surface-container-low">
                      <tr>
                        <th className="px-3 py-2 text-left font-bold text-on-surface-variant">차량</th>
                        <th className="px-3 py-2 text-left font-bold text-on-surface-variant">트림/연식</th>
                        <th className="px-3 py-2 text-left font-bold text-on-surface-variant">차량번호</th>
                        <th className="px-3 py-2 text-center font-bold text-on-surface-variant">대표</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.cars.map((c) => (
                        <tr key={c.id} className="border-t border-outline-variant/60">
                          <td className="px-3 py-2 text-on-surface">
                            {carBrandLabel(c.carBrandCode)} {carModelLabel(c.carModelCode)}
                          </td>
                          <td className="px-3 py-2 text-on-surface">{[c.trimName, c.modelYear].filter(Boolean).join(" / ") || "-"}</td>
                          <td className="px-3 py-2 text-on-surface">{c.plateNumber ?? "-"}</td>
                          <td className="px-3 py-2 text-center">{c.isDefault ? "●" : ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className={labelClass}>신차패키지</p>
              {detail.packages.length === 0 ? (
                <p className="rounded-lg border border-outline-variant/60 bg-surface-container-low px-3 py-2.5 text-[11px] text-on-surface-variant">가입된 신차패키지가 없습니다.</p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-outline-variant/60">
                  <table className="w-full text-[11px]">
                    <thead className="bg-surface-container-low">
                      <tr>
                        <th className="px-3 py-2 text-left font-bold text-on-surface-variant">패키지</th>
                        <th className="px-3 py-2 text-left font-bold text-on-surface-variant">차종</th>
                        <th className="px-3 py-2 text-left font-bold text-on-surface-variant">매핑일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.packages.map((p) => (
                        <tr key={p.vin} className="border-t border-outline-variant/60">
                          <td className="px-3 py-2 text-on-surface">{p.packageName ?? p.packageCode}</td>
                          <td className="px-3 py-2 text-on-surface">
                            {carBrandLabel(p.carBrandCode)} {carModelLabel(p.carModelCode)} {p.trimName}
                          </td>
                          <td className="px-3 py-2 text-on-surface">{formatDate(p.mappedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {error && <p className="text-[12px] font-semibold text-red-600">{error}</p>}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg bg-surface-container-high px-4 py-2 text-xs font-bold text-on-surface transition-all hover:bg-surface-dim">
            닫기
          </button>
          {detail && (
            <button
              type="button"
              onClick={() => setPendingWithdraw({ next: !detail.withdrawnAt })}
              disabled={submitting}
              className={`rounded-lg px-4 py-2 text-xs font-bold text-white shadow-lg transition-all disabled:opacity-60 ${
                detail.withdrawnAt ? "bg-primary shadow-primary/20 hover:bg-primary/90" : "bg-red-500 shadow-red-500/20 hover:bg-red-600"
              }`}
            >
              {detail.withdrawnAt ? "탈퇴 취소(복구)" : "탈퇴 처리"}
            </button>
          )}
        </div>
      </div>

      {pendingWithdraw && (
        <ConfirmModal
          title={pendingWithdraw.next ? "회원 탈퇴 처리" : "탈퇴 취소(복구)"}
          message={
            pendingWithdraw.next
              ? "이 회원을 탈퇴 처리하시겠습니까?"
              : "이 회원의 탈퇴를 취소하고 정상 상태로 복구하시겠습니까?"
          }
          confirmLabel={pendingWithdraw.next ? "탈퇴 처리" : "복구"}
          onCancel={() => setPendingWithdraw(null)}
          onConfirm={confirmWithdrawToggle}
        />
      )}
    </div>
  );
}

export default function CustMbrListPage() {
  const [members, setMembers] = useState<AdminMemberListItem[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  // 입력 중인 필터값(draft) - "검색" 버튼을 눌러야 appliedFilters로 반영되어 목록에 적용된다
  const [keyword, setKeyword] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [appliedFilters, setAppliedFilters] = useState({ keyword: "", dateFrom: "", dateTo: "", statusFilter: "all" });

  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [globalError, setGlobalError] = useState("");

  const loadMembers = () => {
    setMembersLoading(true);
    listMembers()
      .then(setMembers)
      .catch((err) => setGlobalError(err instanceof Error ? err.message : "회원 목록을 불러오지 못했습니다."))
      .finally(() => setMembersLoading(false));
  };

  useEffect(loadMembers, []);

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

  const filtered = useMemo(() => {
    const kw = appliedFilters.keyword.trim();
    return members.filter((m) => {
      const matchesKeyword = !kw || m.name.includes(kw) || (m.phone ?? "").includes(kw);
      const matchesFrom = !appliedFilters.dateFrom || m.createdAt.slice(0, 10) >= appliedFilters.dateFrom;
      const matchesTo = !appliedFilters.dateTo || m.createdAt.slice(0, 10) <= appliedFilters.dateTo;
      const withdrawn = isWithdrawn(m);
      const matchesStatus =
        appliedFilters.statusFilter === "all" || (appliedFilters.statusFilter === "active" ? !withdrawn : withdrawn);
      return matchesKeyword && matchesFrom && matchesTo && matchesStatus;
    });
  }, [members, appliedFilters]);

  const handleSearch = () => {
    setAppliedFilters({ keyword, dateFrom, dateTo, statusFilter });
  };

  const columnDefs = useMemo<ColDef<AdminMemberListItem>[]>(
    () => [
      { headerName: "회원아이디", field: "username", flex: 1, minWidth: 130 },
      { headerName: "이름", field: "name", flex: 0.9, minWidth: 100 },
      { headerName: "휴대폰번호", field: "phone", flex: 1, minWidth: 130, valueFormatter: (p) => p.value ?? "-" },
      { headerName: "이메일", field: "email", flex: 1.3, minWidth: 180, valueFormatter: (p) => p.value ?? "-" },
      { headerName: "가입일", field: "createdAt", flex: 0.8, minWidth: 110, valueFormatter: (p) => formatDate(p.value) },
      { headerName: "보유차량수", field: "carCount", flex: 0.7, minWidth: 100 },
      {
        headerName: "최근 로그인 일시",
        field: "lastLoginAt",
        flex: 1,
        minWidth: 150,
        valueFormatter: (p) => formatDateTime(p.value),
      },
      {
        headerName: "상태",
        colId: "status",
        flex: 0.7,
        minWidth: 90,
        valueGetter: (p) => (p.data ? (isWithdrawn(p.data) ? "탈퇴" : "정상") : ""),
      },
    ],
    [],
  );

  const onCellClicked = (e: CellClickedEvent<AdminMemberListItem>) => {
    if (!e.data) return;
    setSelectedMemberId(e.data.id);
  };

  const handleWithdrawnChange = (updated: AdminMemberListItem) => {
    setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    setToast(updated.withdrawnAt ? "회원을 탈퇴 처리했습니다." : "회원 탈퇴를 취소했습니다.");
  };

  const handleExcelDownload = () => {
    exportRowsAsXlsx({
      fileName: `고객_회원_목록_${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: "고객 회원",
      columns: [
        { header: "회원아이디", key: "username", width: 16 },
        { header: "이름", key: "name", width: 12 },
        { header: "휴대폰번호", key: "phone", width: 16 },
        { header: "이메일", key: "email", width: 28 },
        { header: "가입일", key: "createdAt", width: 14 },
        { header: "보유차량수", key: "carCount", width: 12 },
        { header: "최근 로그인 일시", key: "lastLoginAt", width: 18 },
        { header: "상태", key: "status", width: 10 },
      ],
      rows: filtered.map((m) => ({
        username: m.username,
        name: m.name,
        phone: m.phone ?? "-",
        email: m.email ?? "-",
        createdAt: formatDate(m.createdAt),
        carCount: m.carCount,
        lastLoginAt: formatDateTime(m.lastLoginAt),
        status: isWithdrawn(m) ? "탈퇴" : "정상",
      })),
    });
  };

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-8 py-6">
      <PageBreadcrumb path="/member/cust-mbr-list" />

      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label className={labelClass}>이름·휴대폰번호 검색</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="이름 또는 휴대폰번호"
              className={`${inputClass} w-56`}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>가입일(시작)</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={`${inputClass} w-40`} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>가입일(종료)</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={`${inputClass} w-40`} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>상태</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputClass} w-28`}>
              <option value="all">전체</option>
              <option value="active">정상</option>
              <option value="withdrawn">탈퇴</option>
            </select>
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
          <ExcelActionButton icon={Download} label="엑셀 다운로드" onClick={handleExcelDownload} />
        </div>
      </div>

      <DataGrid<AdminMemberListItem>
        columnDefs={columnDefs}
        rowData={filtered}
        getRowId={(p) => p.data.id}
        onCellClicked={onCellClicked}
        rowClass="cursor-pointer"
        getRowClass={(p) => (p.data && isWithdrawn(p.data) ? "opacity-45" : undefined)}
        loading={membersLoading}
        emptyMessage="조건에 맞는 회원이 없습니다."
      />

      {selectedMemberId && (
        <MemberDetailModal
          memberId={selectedMemberId}
          onClose={() => setSelectedMemberId(null)}
          onWithdrawnChange={handleWithdrawnChange}
        />
      )}

      {(toast || globalError) && (
        <div
          className={`fixed right-6 bottom-6 z-[999] rounded-lg px-4 py-3 text-xs font-bold text-white shadow-xl ${
            globalError ? "bg-red-600" : "bg-secondary"
          }`}
        >
          {globalError || toast}
        </div>
      )}
    </div>
  );
}
