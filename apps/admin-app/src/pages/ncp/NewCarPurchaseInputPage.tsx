// 신차 구매내역 (uploads/MotoPay_프로그램목록표_v1_49.xlsx "딜러사웹_프로그램" 시트 DL-NCPK-01~04 스펙 이식)
// [구성요소] 등록 내역 조회(DL-NCPK-04)를 기본 화면으로 삼고, 그 위에 신규 등록(DL-NCPK-02)·엑셀 업로드
// (DL-NCPK-03) 버튼을 팝업으로 배치 — 원 기획서는 3개 화면을 좌측 탭으로 나열하는 구조였지만, 다른 목록
// 화면들과 인터랙션을 통일하기 위해 "목록 + 등록/업로드 팝업" 구조로 변경(2026-08-11 사용자 요청)
// 딜러사웹 전용으로 설계된 화면이지만, 딜러 직원도 시공업체 직원과 마찬가지로 AdminAccount(accountType=DEALER)로
// admin-app에 로그인하므로 신차패키지 관리 하위 메뉴로 그대로 편입(2026-08-11 확정)
// [등록→확정 2단계 상태] 확정 전에는 등록한 딜러 직원이 자유롭게 수정 가능, 확정 후에는 accountType='ADMIN'인
// 플랫폼 관리자만 수정 가능(서버가 강제)
// apps/api(/admin/new-car-purchases/*, /admin/products/*, /admin/common-codes/*)와 연동된 실 데이터 화면
import { useEffect, useMemo, useState } from "react";
import type { CellClickedEvent, ColDef } from "ag-grid-community";
import ExcelJS from "exceljs";
import { Search, Upload, X } from "lucide-react";
import { getMe, type AdminAccount } from "../../api/adminAuth";
import { getGroup, type CommonCodeDetailApi } from "../../api/commonCodes";
import { listCompanies, type CompanyListItem } from "../../api/companies";
import {
  bulkCreateNewCarPurchases,
  confirmNewCarPurchase,
  createNewCarPurchase,
  listNewCarPurchases,
  updateNewCarPurchase,
  type BulkCreateResultRow,
  type NewCarPurchaseInput,
  type NewCarPurchaseListItem,
} from "../../api/newCarPurchases";
import { listProducts, type ProductApi } from "../../api/products";
import DataGrid from "../../components/DataGrid";
import ExcelActionButton from "../../components/ExcelActionButton";
import PageBreadcrumb from "../../components/PageBreadcrumb";

const inputClass =
  "w-full rounded-lg border border-[#ced4da] bg-white px-3 py-2 text-xs font-normal outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5";
const labelClass = "ml-0.5 text-[11px] font-bold tracking-widest text-secondary uppercase";

interface SharedData {
  dealers: CompanyListItem[];
  brands: CommonCodeDetailApi[];
  models: CommonCodeDetailApi[];
  packages: ProductApi[];
  me: AdminAccount | null;
}

interface PurchaseFormValue {
  vin: string;
  dealerCompanyId: string;
  customerName: string;
  phone: string;
  carBrandCode: string;
  carModelCode: string;
  trimName: string;
  modelYear: string;
  purchaseDate: string;
  packageCode: string;
}

const EMPTY_FORM: PurchaseFormValue = {
  vin: "",
  dealerCompanyId: "",
  customerName: "",
  phone: "",
  carBrandCode: "",
  carModelCode: "",
  trimName: "",
  modelYear: "",
  purchaseDate: "",
  packageCode: "",
};

function formToInput(v: PurchaseFormValue): NewCarPurchaseInput {
  return {
    vin: v.vin.trim().toUpperCase(),
    dealerCompanyId: Number(v.dealerCompanyId),
    customerName: v.customerName.trim(),
    phone: v.phone.trim(),
    carBrandCode: v.carBrandCode,
    carModelCode: v.carModelCode,
    trimName: v.trimName.trim(),
    modelYear: v.modelYear.trim() || undefined,
    purchaseDate: v.purchaseDate || undefined,
    packageCode: v.packageCode || undefined,
  };
}

/** VIN·딜러사·고객·차량·패키지 입력 필드 — 직접입력 탭과 등록내역조회의 수정 팝업이 공유. 업그레이드·추가옵션은
    고객앱에서 고객이 직접 선택하는 영역이라 이 화면에서는 다루지 않음(2026-08-12 사용자 확정) */
function PurchaseFormFields({
  value,
  onChange,
  shared,
  vinEditable,
  disabled,
}: {
  value: PurchaseFormValue;
  onChange: (patch: Partial<PurchaseFormValue>) => void;
  shared: SharedData;
  vinEditable: boolean;
  disabled: boolean;
}) {
  const modelsForBrand = useMemo(
    () => shared.models.filter((m) => m.ref1 === value.carBrandCode),
    [shared.models, value.carBrandCode],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className={labelClass}>VIN(차대번호)</label>
          <input
            value={value.vin}
            onChange={(e) => onChange({ vin: e.target.value.toUpperCase() })}
            disabled={!vinEditable || disabled}
            maxLength={17}
            placeholder="17자리"
            className={`${inputClass} font-mono disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:text-on-surface-variant`}
          />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>딜러사</label>
          <select
            value={value.dealerCompanyId}
            onChange={(e) => onChange({ dealerCompanyId: e.target.value })}
            disabled={disabled}
            className={inputClass}
          >
            <option value="">선택</option>
            {shared.dealers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className={labelClass}>고객명</label>
          <input value={value.customerName} onChange={(e) => onChange({ customerName: e.target.value })} disabled={disabled} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>휴대폰</label>
          <input value={value.phone} onChange={(e) => onChange({ phone: e.target.value })} disabled={disabled} placeholder="010-0000-0000" className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className={labelClass}>차량브랜드</label>
          <select
            value={value.carBrandCode}
            onChange={(e) => onChange({ carBrandCode: e.target.value, carModelCode: "" })}
            disabled={disabled}
            className={inputClass}
          >
            <option value="">선택</option>
            {shared.brands.map((b) => (
              <option key={b.detailCode} value={b.detailCode}>
                {b.detailName}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>차종</label>
          <select
            value={value.carModelCode}
            onChange={(e) => onChange({ carModelCode: e.target.value })}
            disabled={disabled || !value.carBrandCode}
            className={`${inputClass} disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:text-on-surface-variant`}
          >
            <option value="">선택</option>
            {modelsForBrand.map((m) => (
              <option key={m.detailCode} value={m.detailCode}>
                {m.detailName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label className={labelClass}>세부차종명</label>
          <input value={value.trimName} onChange={(e) => onChange({ trimName: e.target.value })} disabled={disabled} placeholder="예: E 200" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>연식</label>
          <input value={value.modelYear} onChange={(e) => onChange({ modelYear: e.target.value })} disabled={disabled} placeholder="예: 2026" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>구매일</label>
          <input type="date" value={value.purchaseDate} onChange={(e) => onChange({ purchaseDate: e.target.value })} disabled={disabled} className={inputClass} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className={labelClass}>신차패키지</label>
        <select
          value={value.packageCode}
          onChange={(e) => onChange({ packageCode: e.target.value })}
          disabled={disabled}
          className={inputClass}
        >
          <option value="">선택 안 함</option>
          {shared.packages.map((p) => (
            <option key={p.productCode} value={p.productCode}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function AddPurchaseModal({ shared, onCancel, onCreated }: { shared: SharedData; onCancel: () => void; onCreated: () => void }) {
  const [value, setValue] = useState<PurchaseFormValue>(EMPTY_FORM);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.vin.trim() || value.vin.trim().length !== 17 || !value.dealerCompanyId || !value.customerName.trim() || !value.phone.trim() || !value.carBrandCode || !value.carModelCode || !value.trimName.trim()) {
      setError("VIN(17자)·딜러사·고객명·휴대폰·차량브랜드·차종·세부차종명은 필수입니다.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await createNewCarPurchase(formToInput(value));
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록에 실패했습니다.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-bold text-secondary">신차 구매내역 신규 등록</h3>
          <button type="button" onClick={onCancel} className="text-outline hover:text-on-surface">
            <X className="h-4 w-4" />
          </button>
        </div>
        <PurchaseFormFields value={value} onChange={(patch) => setValue((prev) => ({ ...prev, ...patch }))} shared={shared} vinEditable disabled={false} />
        {error && <p className="mt-3 text-[12px] font-semibold text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg bg-surface-container-high px-4 py-2 text-xs font-bold text-on-surface transition-all hover:bg-surface-dim">
            취소
          </button>
          <button type="submit" disabled={submitting} className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-60">
            {submitting ? "등록 중..." : "등록"}
          </button>
        </div>
      </form>
    </div>
  );
}

const UPLOAD_COLUMNS = ["VIN", "딜러사업체ID", "고객명", "휴대폰", "차량브랜드코드", "차종코드", "세부차종명", "연식", "구매일(YYYY-MM-DD)", "패키지코드"];

function BulkUploadModal({ onCancel, onCreated }: { onCancel: () => void; onCreated: () => void }) {
  const [rows, setRows] = useState<NewCarPurchaseInput[]>([]);
  const [parseError, setParseError] = useState("");
  const [results, setResults] = useState<BulkCreateResultRow[]>([]);
  const [uploading, setUploading] = useState(false);

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setParseError("");
    setResults([]);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const sheet = workbook.worksheets[0];
      const parsed: NewCarPurchaseInput[] = [];
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // 헤더 행 skip
        const cell = (i: number) => String(row.getCell(i).value ?? "").trim();
        const vin = cell(1);
        if (!vin) return;
        parsed.push({
          vin: vin.toUpperCase(),
          dealerCompanyId: Number(cell(2)),
          customerName: cell(3),
          phone: cell(4),
          carBrandCode: cell(5),
          carModelCode: cell(6),
          trimName: cell(7),
          modelYear: cell(8) || undefined,
          purchaseDate: cell(9) || undefined,
          packageCode: cell(10) || undefined,
        });
      });
      if (parsed.length === 0) {
        setParseError("등록할 행을 찾지 못했습니다. 첫 행은 헤더로 비우고 2행부터 데이터를 입력해주세요.");
      }
      setRows(parsed);
    } catch {
      setParseError("엑셀 파일을 읽지 못했습니다.");
    }
  };

  const handleBulkSubmit = async () => {
    if (rows.length === 0) return;
    setUploading(true);
    try {
      const result = await bulkCreateNewCarPurchases(rows);
      setResults(result);
      if (result.every((r) => r.success)) {
        setRows([]);
        onCreated();
      }
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "일괄 등록에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-bold text-secondary">신차 구매내역 엑셀 일괄업로드</h3>
          <button type="button" onClick={onCancel} className="text-outline hover:text-on-surface">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-2 text-xs font-bold text-on-surface">엑셀 파일 첫 행은 헤더로 비우고, 다음 순서의 컬럼으로 2행부터 데이터를 입력하세요.</p>
        <p className="mb-4 text-[11px] text-on-surface-variant">{UPLOAD_COLUMNS.join(" · ")}</p>

        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg bg-surface-container-high px-4 py-2.5 text-xs font-bold text-on-surface transition-all hover:bg-surface-dim">
          <Upload className="h-3.5 w-3.5" />
          엑셀 파일 선택(.xlsx)
          <input type="file" accept=".xlsx" className="hidden" onChange={onFileSelected} />
        </label>

        {parseError && <p className="mt-3 text-[12px] font-semibold text-red-600">{parseError}</p>}

        {rows.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold text-on-surface">{rows.length}건 파싱됨 — 아래 목록 확인 후 일괄 등록을 눌러주세요.</p>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-outline-variant/60">
              <table className="w-full text-[11px]">
                <thead className="bg-surface-container-low">
                  <tr>
                    <th className="px-2 py-1.5 text-left">VIN</th>
                    <th className="px-2 py-1.5 text-left">고객명</th>
                    <th className="px-2 py-1.5 text-left">휴대폰</th>
                    <th className="px-2 py-1.5 text-left">차종</th>
                    <th className="px-2 py-1.5 text-left">결과</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const result = results.find((r) => r.vin === row.vin);
                    return (
                      <tr key={row.vin} className="border-t border-outline-variant/60">
                        <td className="px-2 py-1.5 font-mono">{row.vin}</td>
                        <td className="px-2 py-1.5">{row.customerName}</td>
                        <td className="px-2 py-1.5">{row.phone}</td>
                        <td className="px-2 py-1.5">{row.carModelCode}</td>
                        <td className="px-2 py-1.5">
                          {result ? (
                            <span className={result.success ? "font-semibold text-primary" : "font-semibold text-red-600"}>
                              {result.success ? "성공" : result.error}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={onCancel} className="rounded-lg bg-surface-container-high px-4 py-2 text-xs font-bold text-on-surface transition-all hover:bg-surface-dim">
                닫기
              </button>
              <button
                type="button"
                onClick={handleBulkSubmit}
                disabled={uploading}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? "등록 중..." : "일괄 등록"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function statusBadge(item: NewCarPurchaseListItem) {
  return item.confirmed ? (
    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">확정</span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-surface-container-high px-2 py-0.5 text-[11px] font-bold text-on-surface-variant">등록</span>
  );
}

function PurchaseDetailModal({
  item,
  shared,
  onCancel,
  onSaved,
}: {
  item: NewCarPurchaseListItem;
  shared: SharedData;
  onCancel: () => void;
  onSaved: (updated: NewCarPurchaseListItem) => void;
}) {
  const [value, setValue] = useState<PurchaseFormValue>({
    vin: item.vin,
    dealerCompanyId: String(item.dealerCompanyId),
    customerName: item.customerName,
    phone: item.phone,
    carBrandCode: item.carBrandCode,
    carModelCode: item.carModelCode,
    trimName: item.trimName,
    modelYear: item.modelYear ?? "",
    purchaseDate: item.purchaseDate ?? "",
    packageCode: item.packageCode ?? "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // 확정된 건은 관리자(accountType=ADMIN)만 수정 가능 — 서버도 동일하게 강제하므로 UI는 안내 목적
  const locked = item.confirmed && shared.me?.accountType !== "ADMIN";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const input = formToInput(value);
      const updated = await updateNewCarPurchase(item.vin, {
        customerName: input.customerName,
        phone: input.phone,
        carBrandCode: input.carBrandCode,
        carModelCode: input.carModelCode,
        trimName: input.trimName,
        modelYear: input.modelYear,
        purchaseDate: input.purchaseDate,
        packageCode: input.packageCode,
      });
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    setError("");
    try {
      const updated = await confirmNewCarPurchase(item.vin);
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "확정 처리에 실패했습니다.");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-secondary">구매 내역 상세</h3>
            {statusBadge(item)}
          </div>
          <button type="button" onClick={onCancel} className="text-outline hover:text-on-surface">
            <X className="h-4 w-4" />
          </button>
        </div>
        {locked && <p className="mb-4 text-[12px] font-semibold text-red-600">확정된 구매 내역은 관리자만 수정할 수 있습니다.</p>}
        <PurchaseFormFields value={value} onChange={(patch) => setValue((prev) => ({ ...prev, ...patch }))} shared={shared} vinEditable={false} disabled={locked} />
        {error && <p className="mt-3 text-[12px] font-semibold text-red-600">{error}</p>}
        <div className="mt-6 flex items-center justify-between">
          {!item.confirmed ? (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirming}
              className="rounded-lg bg-secondary px-4 py-2 text-xs font-bold text-white transition-all hover:bg-secondary/90 disabled:opacity-60"
            >
              {confirming ? "처리 중..." : "확정"}
            </button>
          ) : (
            <span className="text-[11px] text-on-surface-variant">{item.confirmedAt?.slice(0, 16).replace("T", " ")} · {item.confirmedBy} 확정</span>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onCancel} className="rounded-lg bg-surface-container-high px-4 py-2 text-xs font-bold text-on-surface transition-all hover:bg-surface-dim">
              닫기
            </button>
            {!locked && (
              <button type="submit" disabled={submitting} className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-60">
                {submitting ? "저장 중..." : "저장"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

function PurchaseListView({ shared }: { shared: SharedData }) {
  const [items, setItems] = useState<NewCarPurchaseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [dealerFilter, setDealerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mappedFilter, setMappedFilter] = useState("all");
  const [usedFilter, setUsedFilter] = useState("all");
  const [appliedFilters, setAppliedFilters] = useState({
    keyword: "",
    dealerFilter: "all",
    statusFilter: "all",
    mappedFilter: "all",
    usedFilter: "all",
  });
  const [selected, setSelected] = useState<NewCarPurchaseListItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const load = () => {
    setLoading(true);
    setLoadError("");
    listNewCarPurchases()
      .then(setItems)
      .catch((err) => setLoadError(err instanceof Error ? err.message : "구매 내역을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const dealerLabelMap = useMemo(() => {
    const map = new Map(shared.dealers.map((d) => [d.id, d.name]));
    return (id: number) => map.get(id) ?? String(id);
  }, [shared.dealers]);
  const brandLabelMap = useMemo(() => {
    const map = new Map(shared.brands.map((b) => [b.detailCode, b.detailName]));
    return (code: string) => map.get(code) ?? code;
  }, [shared.brands]);
  const modelLabelMap = useMemo(() => {
    const map = new Map(shared.models.map((m) => [m.detailCode, m.detailName]));
    return (code: string) => map.get(code) ?? code;
  }, [shared.models]);
  const packageLabelMap = useMemo(() => {
    const map = new Map(shared.packages.map((p) => [p.productCode, p.name]));
    return (code: string | null) => (code ? (map.get(code) ?? code) : "-");
  }, [shared.packages]);

  const filtered = useMemo(() => {
    const kw = appliedFilters.keyword.trim();
    return items.filter((item) => {
      const matchesKeyword = !kw || item.customerName.includes(kw) || item.vin.includes(kw.toUpperCase());
      const matchesDealer = appliedFilters.dealerFilter === "all" || item.dealerCompanyId === Number(appliedFilters.dealerFilter);
      const matchesStatus =
        appliedFilters.statusFilter === "all" || (appliedFilters.statusFilter === "confirmed" ? item.confirmed : !item.confirmed);
      const matchesMapped =
        appliedFilters.mappedFilter === "all" || (appliedFilters.mappedFilter === "mapped" ? item.isMapped : !item.isMapped);
      const matchesUsed =
        appliedFilters.usedFilter === "all" || (appliedFilters.usedFilter === "used" ? item.used : !item.used);
      return matchesKeyword && matchesDealer && matchesStatus && matchesMapped && matchesUsed;
    });
  }, [items, appliedFilters]);

  const handleSearch = () => {
    setAppliedFilters({ keyword, dealerFilter, statusFilter, mappedFilter, usedFilter });
    load();
  };

  const columnDefs = useMemo<ColDef<NewCarPurchaseListItem>[]>(
    () => [
      {
        headerName: "딜러사",
        field: "dealerCompanyId",
        flex: 0.8,
        minWidth: 110,
        valueFormatter: (p) => dealerLabelMap(p.value),
      },
      { headerName: "VIN", field: "vin", flex: 1, minWidth: 150 },
      { headerName: "고객명", field: "customerName", flex: 0.8, minWidth: 100 },
      { headerName: "휴대폰", field: "phone", flex: 1, minWidth: 130 },
      {
        headerName: "차종",
        colId: "carModel",
        flex: 1.2,
        minWidth: 150,
        valueGetter: (p) => (p.data ? `${brandLabelMap(p.data.carBrandCode)} ${modelLabelMap(p.data.carModelCode)}` : ""),
      },
      {
        headerName: "패키지",
        field: "packageCode",
        flex: 1,
        minWidth: 140,
        valueFormatter: (p) => packageLabelMap(p.value),
      },
      { headerName: "구매일", field: "purchaseDate", flex: 0.8, minWidth: 110, valueFormatter: (p) => p.value ?? "-" },
      {
        headerName: "매핑여부",
        colId: "isMapped",
        flex: 0.7,
        minWidth: 90,
        valueGetter: (p) => (p.data ? (p.data.isMapped ? "매핑완료" : "대기") : ""),
      },
      {
        headerName: "상태",
        colId: "confirmed",
        flex: 0.7,
        minWidth: 90,
        valueGetter: (p) => (p.data ? (p.data.confirmed ? "확정" : "등록") : ""),
      },
      {
        headerName: "사용여부",
        colId: "used",
        flex: 0.7,
        minWidth: 90,
        valueGetter: (p) => (p.data ? (p.data.used ? "사용완료" : "미사용") : ""),
      },
      { headerName: "사용일", field: "usedDate", flex: 0.8, minWidth: 110, valueFormatter: (p) => p.value ?? "-" },
      { headerName: "사용처", field: "usedShopName", flex: 1, minWidth: 130, valueFormatter: (p) => p.value ?? "-" },
    ],
    [dealerLabelMap, brandLabelMap, modelLabelMap, packageLabelMap],
  );

  const onCellClicked = (e: CellClickedEvent<NewCarPurchaseListItem>) => {
    if (!e.data) return;
    setSelected(e.data);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label className={labelClass}>딜러사</label>
            <select value={dealerFilter} onChange={(e) => setDealerFilter(e.target.value)} className={`${inputClass} w-32`}>
              <option value="all">전체</option>
              {shared.dealers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>고객명/VIN 검색</label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-outline" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="고객명 또는 VIN"
                className={`${inputClass} w-56 pl-8`}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>확정상태</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputClass} w-32`}>
              <option value="all">전체</option>
              <option value="registered">등록</option>
              <option value="confirmed">확정</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>매핑상태</label>
            <select value={mappedFilter} onChange={(e) => setMappedFilter(e.target.value)} className={`${inputClass} w-32`}>
              <option value="all">전체</option>
              <option value="waiting">대기</option>
              <option value="mapped">매핑완료</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>사용여부</label>
            <select value={usedFilter} onChange={(e) => setUsedFilter(e.target.value)} className={`${inputClass} w-32`}>
              <option value="all">전체</option>
              <option value="unused">미사용</option>
              <option value="used">사용완료</option>
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
          <ExcelActionButton icon={Upload} label="엑셀 업로드" onClick={() => setShowUploadModal(true)} />
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
          >
            신규 등록
          </button>
        </div>
      </div>

      <DataGrid<NewCarPurchaseListItem>
        columnDefs={columnDefs}
        rowData={filtered}
        getRowId={(p) => p.data.vin}
        onCellClicked={onCellClicked}
        rowClass="cursor-pointer"
        loading={loading}
        emptyMessage={loadError || "조건에 맞는 구매 내역이 없습니다."}
      />

      {selected && (
        <PurchaseDetailModal
          item={selected}
          shared={shared}
          onCancel={() => setSelected(null)}
          onSaved={(updated) => {
            setItems((prev) => prev.map((i) => (i.vin === updated.vin ? updated : i)));
            setSelected(null);
          }}
        />
      )}
      {showAddModal && (
        <AddPurchaseModal
          shared={shared}
          onCancel={() => setShowAddModal(false)}
          onCreated={() => {
            setShowAddModal(false);
            load();
          }}
        />
      )}
      {showUploadModal && (
        <BulkUploadModal
          onCancel={() => setShowUploadModal(false)}
          onCreated={() => {
            setShowUploadModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}

export default function NewCarPurchaseInputPage() {
  const [shared, setShared] = useState<SharedData>({ dealers: [], brands: [], models: [], packages: [], me: null });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    Promise.all([listCompanies(), getGroup("CAR_BRAND"), getGroup("CAR_MODEL"), listProducts({ prodType: "PKG", useYn: true }), getMe()])
      .then(([companies, brandGroup, modelGroup, packages, me]) => {
        setShared({
          dealers: companies.filter((c) => c.coType === "DEALER" && c.useYn),
          brands: [...brandGroup.details].filter((d) => d.useYn).sort((a, b) => a.sortOrder - b.sortOrder),
          models: [...modelGroup.details].filter((d) => d.useYn).sort((a, b) => a.sortOrder - b.sortOrder),
          packages,
          me,
        });
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "기초 데이터를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto px-8 py-6">
      <PageBreadcrumb path="/ncp/purchase" />

      {loading ? (
        <p className="py-8 text-center text-[12px] text-on-surface-variant">불러오는 중...</p>
      ) : loadError ? (
        <p className="py-8 text-center text-[12px] font-semibold text-red-600">{loadError}</p>
      ) : (
        <div className="min-h-0 flex-1">
          <PurchaseListView shared={shared} />
        </div>
      )}
    </div>
  );
}
