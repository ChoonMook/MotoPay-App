// 업체 목록 (uploads/MotoPay_프로그램목록표_v1_47.xlsx "관리자웹_프로그램" 시트 AD-CO-03 스펙 이식)
// [구성요소] 상단 필터 바(업체명 검색/업체구분/상태) + 하단 목록 테이블(페이징)
// [인터랙션] 검색 버튼 클릭 시에만 필터 적용 / 신규 등록·행 클릭 모두 동일한 CompanyDetailModal(AD-CO-04)을
// 재사용한다 — 신규 등록은 company=null로 열어 기본정보 탭만 노출(기본정보 탭에 해당하는 항목을 전부 등록할 수
// 있어야 하므로 업체 상세 수정 팝업을 그대로 재사용), 시공업체는 기본정보 저장 시 신규 Shop 레코드까지 함께
// 생성해 shopCode로 연결한다. 자세한 내용은 CompanyDetailModal.tsx 참고.
// apps/api(/admin/companies/*)와 연동된 실 데이터 화면. 업체(딜러사/시공업체/공급업체)를 나타내는 DB 테이블이
// 기존에 없어 이번 작업에서 Company 모델을 신설 — 딜러사·공급업체는 아직 별도 운영 테이블이 없어 이 화면이
// 유일한 관리 지점이다.
import { useEffect, useMemo, useState } from "react";
import type { CellClickedEvent, ColDef } from "ag-grid-community";
import { Download, Plus, Search } from "lucide-react";
import { listCompanies, type CompanyListItem } from "../../api/companies";
import { getGroup, type CommonCodeDetailApi } from "../../api/commonCodes";
import DataGrid from "../../components/DataGrid";
import ExcelActionButton from "../../components/ExcelActionButton";
import { exportRowsAsXlsx } from "../../lib/exportXlsx";
import { formatBusinessRegNo } from "../../lib/format";
import PageBreadcrumb from "../../components/PageBreadcrumb";
import CompanyDetailModal from "./CompanyDetailModal";

const inputClass =
  "w-full rounded-lg border border-[#ced4da] bg-white px-3 py-2 text-xs font-normal outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5";
const labelClass = "ml-0.5 text-[11px] font-bold tracking-widest text-secondary uppercase";

function formatDate(value: string | null): string {
  if (!value) return "-";
  return value.slice(0, 10);
}

function buildLabelMap(details: CommonCodeDetailApi[]): (code: string) => string {
  const map = new Map(details.map((d) => [d.detailCode, d.detailName]));
  return (code: string) => map.get(code) ?? code;
}

function statusText(active: boolean, activeLabel = "정상", inactiveLabel = "중지"): string {
  return active ? activeLabel : inactiveLabel;
}

export default function CoListPage() {
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [coTypes, setCoTypes] = useState<CommonCodeDetailApi[]>([]);

  const [keyword, setKeyword] = useState("");
  const [coTypeFilter, setCoTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [appliedFilters, setAppliedFilters] = useState({ keyword: "", coTypeFilter: "all", statusFilter: "all" });

  // "new"면 신규 등록(빈 CompanyDetailModal), CompanyListItem이면 해당 업체 상세, null이면 닫힘
  const [modalTarget, setModalTarget] = useState<CompanyListItem | "new" | null>(null);
  const [toast, setToast] = useState("");
  const [globalError, setGlobalError] = useState("");

  const loadCompanies = () => {
    setCompaniesLoading(true);
    listCompanies()
      .then(setCompanies)
      .catch((err) => setGlobalError(err instanceof Error ? err.message : "업체 목록을 불러오지 못했습니다."))
      .finally(() => setCompaniesLoading(false));
  };

  useEffect(loadCompanies, []);

  useEffect(() => {
    getGroup("CO_TYPE")
      .then((g) => setCoTypes(g.details.filter((d) => d.useYn)))
      .catch((err) => setGlobalError(err instanceof Error ? err.message : "업체구분 목록을 불러오지 못했습니다."));
  }, []);

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

  const coTypeLabel = useMemo(() => buildLabelMap(coTypes), [coTypes]);

  const filtered = useMemo(() => {
    const kw = appliedFilters.keyword.trim();
    return companies.filter((c) => {
      const matchesKeyword = !kw || c.name.includes(kw);
      const matchesCoType = appliedFilters.coTypeFilter === "all" || c.coType === appliedFilters.coTypeFilter;
      const matchesStatus =
        appliedFilters.statusFilter === "all" || (appliedFilters.statusFilter === "active" ? c.useYn : !c.useYn);
      return matchesKeyword && matchesCoType && matchesStatus;
    });
  }, [companies, appliedFilters]);

  const handleSearch = () => {
    setAppliedFilters({ keyword, coTypeFilter, statusFilter });
  };

  const columnDefs = useMemo<ColDef<CompanyListItem>[]>(
    () => [
      { headerName: "업체명", field: "name", flex: 1.2, minWidth: 160 },
      { headerName: "업체구분", field: "coType", flex: 0.8, minWidth: 100, valueFormatter: (p) => coTypeLabel(p.value) },
      {
        headerName: "사업자번호",
        field: "businessRegNo",
        flex: 1,
        minWidth: 130,
        valueFormatter: (p) => formatBusinessRegNo(p.value),
      },
      { headerName: "담당자", field: "contactName", flex: 0.9, minWidth: 100, valueFormatter: (p) => p.value ?? "-" },
      { headerName: "등록일", field: "createdAt", flex: 0.8, minWidth: 110, valueFormatter: (p) => formatDate(p.value) },
      {
        headerName: "상태",
        colId: "status",
        flex: 0.7,
        minWidth: 100,
        // useYn(boolean)에 field를 그대로 바인딩하면 ag-grid가 자동으로 체크박스 셀로 렌더링해버려
        // valueFormatter로 텍스트를 지정해도 무시된다 — valueGetter로 문자열을 직접 반환해 우회
        valueGetter: (p) => (p.data ? statusText(p.data.useYn) : ""),
      },
    ],
    [coTypeLabel],
  );

  const onCellClicked = (e: CellClickedEvent<CompanyListItem>) => {
    if (!e.data) return;
    setModalTarget(e.data);
  };

  const handleCreated = (created: CompanyListItem, warning?: string) => {
    setCompanies((prev) => [created, ...prev]);
    setModalTarget(null);
    if (warning) setGlobalError(warning);
    else setToast("업체를 등록했습니다.");
  };

  const handleSaved = (updated: CompanyListItem) => {
    setCompanies((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setModalTarget(updated);
    setToast("업체 정보를 저장했습니다.");
  };

  const handleExcelDownload = () => {
    exportRowsAsXlsx({
      fileName: `업체_목록_${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: "업체 목록",
      columns: [
        { header: "업체명", key: "name", width: 20 },
        { header: "업체구분", key: "coType", width: 12 },
        { header: "사업자번호", key: "businessRegNo", width: 16 },
        { header: "담당자", key: "contactName", width: 12 },
        { header: "등록일", key: "createdAt", width: 14 },
        { header: "상태", key: "status", width: 10 },
      ],
      rows: filtered.map((c) => ({
        name: c.name,
        coType: coTypeLabel(c.coType),
        businessRegNo: formatBusinessRegNo(c.businessRegNo),
        contactName: c.contactName ?? "-",
        createdAt: formatDate(c.createdAt),
        status: c.useYn ? "정상" : "중지",
      })),
    });
  };

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-8 py-6">
      <PageBreadcrumb path="/company/co-list" />

      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label className={labelClass}>업체명 검색</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="업체명"
              className={`${inputClass} w-56`}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>업체구분</label>
            <select value={coTypeFilter} onChange={(e) => setCoTypeFilter(e.target.value)} className={`${inputClass} w-32`}>
              <option value="all">전체</option>
              {coTypes.map((t) => (
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
              <option value="active">정상</option>
              <option value="inactive">중지</option>
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
          <button
            type="button"
            onClick={() => setModalTarget("new")}
            disabled={coTypes.length === 0}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-3.5 w-3.5" />
            신규 등록
          </button>
          <ExcelActionButton icon={Download} label="엑셀 다운로드" onClick={handleExcelDownload} />
        </div>
      </div>

      <DataGrid<CompanyListItem>
        columnDefs={columnDefs}
        rowData={filtered}
        getRowId={(p) => String(p.data.id)}
        onCellClicked={onCellClicked}
        rowClass="cursor-pointer"
        getRowClass={(p) => (p.data && !p.data.useYn ? "opacity-60" : undefined)}
        loading={companiesLoading}
        emptyMessage="조건에 맞는 업체가 없습니다."
      />

      {modalTarget && (
        <CompanyDetailModal
          company={modalTarget === "new" ? null : modalTarget}
          coTypes={coTypes}
          coTypeLabel={coTypeLabel}
          onCancel={() => setModalTarget(null)}
          onSaved={handleSaved}
          onCreated={handleCreated}
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
