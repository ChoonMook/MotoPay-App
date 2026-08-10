// 브랜드 관리 (uploads/MotoPay_프로그램목록표_v1_48.xlsx "관리자웹_프로그램" 시트 AD-CTLG-04 스펙 이식)
// [구성요소] 시공항목별 브랜드 목록 + 등록/수정 팝업 — 상품 브랜드(PROD_BRAND 공통코드 그룹)를 그대로 재사용한다
// (차종마스터 AD-CTLG-02·시공항목관리 AD-CTLG-03과 동일하게 신규 테이블 없이 공통코드 인프라 재사용).
// ref1에 소속 시공항목(CAR_INST detailCode)을, ref2에 로고 이미지 경로를 저장한다
// apps/api(/admin/common-codes/*)와 연동된 실 데이터 화면
// 목록 그리드는 관리자웹 표준 컴포넌트인 components/DataGrid.tsx(ag-grid-community 기반)를 사용한다
import { useEffect, useMemo, useState } from "react";
import type { CellClickedEvent, ColDef, ICellRendererParams } from "ag-grid-community";
import { ImageIcon, Plus, Search, Trash2, X } from "lucide-react";
import {
  createDetail,
  deleteDetail,
  deleteDetailPhoto,
  getGroup,
  updateDetail,
  uploadDetailPhoto,
  type CommonCodeDetailApi,
} from "../../api/commonCodes";
import { API_BASE_URL } from "../../api/config";
import ConfirmModal from "../../components/ConfirmModal";
import DataGrid from "../../components/DataGrid";
import PageBreadcrumb from "../../components/PageBreadcrumb";

const BRAND_GROUP = "PROD_BRAND";
const INST_GROUP = "CAR_INST";

const inputClass =
  "w-full rounded-lg border border-[#ced4da] bg-white px-3 py-2 text-xs font-normal outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5";
const labelClass = "ml-0.5 text-[11px] font-bold tracking-widest text-secondary uppercase";

const MAX_IMAGE_DIMENSION = 1600;
const IMAGE_JPEG_QUALITY = 0.82;

// 폰 카메라 원본을 그대로 base64로 올리면 요청이 너무 커지므로, 캔버스로 긴 변 기준 축소 + JPEG 압축
function resizeImageToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(img.width, img.height));
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("이미지를 처리하지 못했습니다"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", IMAGE_JPEG_QUALITY));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("이미지를 읽지 못했습니다"));
    };
    img.src = objectUrl;
  });
}

function AddBrandModal({
  instItems,
  defaultInstCode,
  onCancel,
  onSubmit,
}: {
  instItems: CommonCodeDetailApi[];
  defaultInstCode: string;
  onCancel: () => void;
  onSubmit: (v: { detailCode: string; detailName: string; ref1: string }) => Promise<void>;
}) {
  const [detailCode, setDetailCode] = useState("");
  const [detailName, setDetailName] = useState("");
  const [instCode, setInstCode] = useState(defaultInstCode || instItems[0]?.detailCode || "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailCode.trim() || !detailName.trim() || !instCode) {
      setError("시공항목·브랜드코드·브랜드명을 모두 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({ detailCode: detailCode.trim().toUpperCase(), detailName: detailName.trim(), ref1: instCode });
    } catch (err) {
      setError(err instanceof Error ? err.message : "브랜드 추가에 실패했습니다.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="w-full max-w-[360px] rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-bold text-secondary">브랜드 추가</h3>
          <button type="button" onClick={onCancel} className="text-outline hover:text-on-surface">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <label className={labelClass}>시공항목</label>
            <select value={instCode} onChange={(e) => setInstCode(e.target.value)} className={inputClass}>
              {instItems.map((i) => (
                <option key={i.detailCode} value={i.detailCode}>
                  {i.detailName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>브랜드코드</label>
            <input value={detailCode} onChange={(e) => setDetailCode(e.target.value.toUpperCase())} placeholder="예: SUNTEK" className={`${inputClass} font-mono`} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>브랜드명</label>
            <input value={detailName} onChange={(e) => setDetailName(e.target.value)} placeholder="예: 썬텍" className={inputClass} />
          </div>
          {error && <p className="text-[12px] font-semibold text-red-600">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg bg-surface-container-high px-4 py-2 text-xs font-bold text-on-surface transition-all hover:bg-surface-dim">
            취소
          </button>
          <button type="submit" disabled={submitting} className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-60">
            {submitting ? "추가 중..." : "추가"}
          </button>
        </div>
      </form>
    </div>
  );
}

function EditBrandModal({
  brand,
  instItems,
  onCancel,
  onSave,
  onUploadLogo,
  onDeleteLogo,
}: {
  brand: CommonCodeDetailApi;
  instItems: CommonCodeDetailApi[];
  onCancel: () => void;
  onSave: (detailName: string, ref1: string, useYn: boolean) => Promise<void>;
  onUploadLogo: (file: File) => Promise<void>;
  onDeleteLogo: () => Promise<void>;
}) {
  const [detailName, setDetailName] = useState(brand.detailName);
  const [instCode, setInstCode] = useState(brand.ref1 ?? instItems[0]?.detailCode ?? "");
  const [useYn, setUseYn] = useState(brand.useYn);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailName.trim() || !instCode) {
      setError("시공항목·브랜드명을 모두 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onSave(detailName.trim(), instCode, useYn);
      onCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
      setSubmitting(false);
    }
  };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      await onUploadLogo(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "로고 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="w-full max-w-[360px] rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-bold text-secondary">브랜드 수정</h3>
          <button type="button" onClick={onCancel} className="text-outline hover:text-on-surface">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <label className={labelClass}>브랜드코드</label>
            <input value={brand.detailCode} disabled className={`${inputClass} cursor-not-allowed bg-surface-container-low text-on-surface-variant font-mono`} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>시공항목</label>
            <select value={instCode} onChange={(e) => setInstCode(e.target.value)} className={inputClass}>
              {instItems.map((i) => (
                <option key={i.detailCode} value={i.detailCode}>
                  {i.detailName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>브랜드명</label>
            <input value={detailName} onChange={(e) => setDetailName(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>사용여부</label>
            <select value={useYn ? "active" : "inactive"} onChange={(e) => setUseYn(e.target.value === "active")} className={inputClass}>
              <option value="active">사용</option>
              <option value="inactive">미사용</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className={labelClass}>로고</label>
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-outline-variant bg-surface-container-low">
                {brand.ref2 ? (
                  <img src={`${API_BASE_URL}/uploads/${brand.ref2}`} alt="로고" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-outline" />
                )}
              </div>
              <div className="flex gap-2">
                <label className="cursor-pointer rounded-lg bg-surface-container-high px-3 py-1.5 text-[11px] font-bold text-on-surface transition-all hover:bg-surface-dim">
                  {uploading ? "업로드 중..." : brand.ref2 ? "로고 변경" : "로고 등록"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFileSelected} disabled={uploading} />
                </label>
                {brand.ref2 && (
                  <button type="button" onClick={() => onDeleteLogo()} className="rounded-lg bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-600 transition-all hover:bg-red-100">
                    삭제
                  </button>
                )}
              </div>
            </div>
          </div>
          {error && <p className="text-[12px] font-semibold text-red-600">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg bg-surface-container-high px-4 py-2 text-xs font-bold text-on-surface transition-all hover:bg-surface-dim">
            취소
          </button>
          <button type="submit" disabled={submitting} className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-60">
            {submitting ? "저장 중..." : "저장"}
          </button>
        </div>
      </form>
    </div>
  );
}

interface GridContext {
  instLabel: (code: string | null) => string;
  onDeleteRequest: (brand: CommonCodeDetailApi) => void;
}

function LogoCellRenderer({ data }: ICellRendererParams<CommonCodeDetailApi>) {
  if (!data) return null;
  return (
    <div className="flex h-full items-center">
      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-outline-variant/60 bg-surface-container-low">
        {data.ref2 ? (
          <img src={`${API_BASE_URL}/uploads/${data.ref2}`} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImageIcon className="h-4 w-4 text-outline" />
        )}
      </div>
    </div>
  );
}

function DeleteActionCellRenderer({ data, context }: ICellRendererParams<CommonCodeDetailApi>) {
  if (!data) return null;
  const { onDeleteRequest } = context as GridContext;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onDeleteRequest(data);
      }}
      className="flex h-full w-full items-center justify-center text-outline transition-colors hover:text-red-500"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}

export default function BrandMgmtPage() {
  const [brands, setBrands] = useState<CommonCodeDetailApi[]>([]);
  const [instItems, setInstItems] = useState<CommonCodeDetailApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [keyword, setKeyword] = useState("");
  const [instFilter, setInstFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<CommonCodeDetailApi | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CommonCodeDetailApi | null>(null);

  const [toast, setToast] = useState("");
  const [globalError, setGlobalError] = useState("");

  const load = () => {
    setLoading(true);
    setLoadError("");
    Promise.all([getGroup(BRAND_GROUP), getGroup(INST_GROUP)])
      .then(([brandGroup, instGroup]) => {
        setBrands([...brandGroup.details].sort((a, b) => a.sortOrder - b.sortOrder));
        setInstItems([...instGroup.details].filter((d) => d.useYn).sort((a, b) => a.sortOrder - b.sortOrder));
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "브랜드 목록을 불러오지 못했습니다."))
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

  const instLabelMap = useMemo(() => {
    const map = new Map(instItems.map((i) => [i.detailCode, i.detailName]));
    return (code: string | null) => (code ? (map.get(code) ?? code) : "-");
  }, [instItems]);

  const kw = keyword.trim();
  const filtered = brands.filter((b) => {
    const matchesInst = instFilter === "all" || b.ref1 === instFilter;
    const matchesKeyword = !kw || b.detailName.includes(kw);
    return matchesInst && matchesKeyword;
  });

  const handleAdd = async (v: { detailCode: string; detailName: string; ref1: string }) => {
    const created = await createDetail(BRAND_GROUP, v);
    setBrands((prev) => [...prev, created]);
    setShowAddModal(false);
    setToast("브랜드를 추가했습니다.");
  };

  const handleSaveEdit = async (detailName: string, ref1: string, useYn: boolean) => {
    if (!editingBrand) return;
    const updated = await updateDetail(BRAND_GROUP, editingBrand.detailCode, { detailName, ref1, useYn });
    setBrands((prev) => prev.map((b) => (b.detailCode === updated.detailCode ? updated : b)));
    setToast("브랜드를 저장했습니다.");
  };

  const handleUploadLogo = async (file: File) => {
    if (!editingBrand) return;
    const dataUri = await resizeImageToDataUri(file);
    const updated = await uploadDetailPhoto(BRAND_GROUP, editingBrand.detailCode, dataUri);
    setBrands((prev) => prev.map((b) => (b.detailCode === updated.detailCode ? updated : b)));
    setEditingBrand(updated);
  };

  const handleDeleteLogo = async () => {
    if (!editingBrand) return;
    try {
      const updated = await deleteDetailPhoto(BRAND_GROUP, editingBrand.detailCode);
      setBrands((prev) => prev.map((b) => (b.detailCode === updated.detailCode ? updated : b)));
      setEditingBrand(updated);
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "로고 삭제에 실패했습니다.");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const brand = pendingDelete;
    setPendingDelete(null);
    try {
      await deleteDetail(BRAND_GROUP, brand.detailCode);
      setBrands((prev) => prev.filter((b) => b.detailCode !== brand.detailCode));
      setToast("브랜드를 삭제했습니다.");
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    }
  };

  const gridContext = useMemo<GridContext>(
    () => ({ instLabel: instLabelMap, onDeleteRequest: setPendingDelete }),
    [instLabelMap],
  );

  const columnDefs = useMemo<ColDef<CommonCodeDetailApi>[]>(
    () => [
      { headerName: "로고", colId: "logo", width: 80, sortable: false, resizable: false, cellRenderer: LogoCellRenderer },
      { headerName: "브랜드코드", field: "detailCode", flex: 1, minWidth: 130, cellClass: "font-mono" },
      { headerName: "브랜드명", field: "detailName", flex: 1.2, minWidth: 140 },
      {
        headerName: "시공항목",
        field: "ref1",
        flex: 1,
        minWidth: 120,
        valueFormatter: (p) => instLabelMap(p.value),
      },
      {
        headerName: "사용여부",
        colId: "useYnStatus",
        flex: 0.8,
        minWidth: 100,
        // useYn(boolean)에 field를 그대로 바인딩하면 ag-grid가 자동으로 체크박스 셀로 렌더링해버려
        // valueFormatter로 텍스트를 지정해도 무시된다 — valueGetter로 문자열을 직접 반환해 우회
        valueGetter: (p) => (p.data ? (p.data.useYn ? "사용" : "미사용") : ""),
      },
      {
        headerName: "관리",
        colId: "actions",
        width: 90,
        sortable: false,
        resizable: false,
        cellRenderer: DeleteActionCellRenderer,
        cellClass: "flex items-center justify-center",
      },
    ],
    [instLabelMap],
  );

  const onCellClicked = (e: CellClickedEvent<CommonCodeDetailApi>) => {
    if (e.colDef.colId === "actions" || !e.data) return;
    setEditingBrand(e.data);
  };

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-8 py-6">
      <PageBreadcrumb path="/catalog/brand-mgmt" />

      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label className={labelClass}>시공항목</label>
            <select value={instFilter} onChange={(e) => setInstFilter(e.target.value)} className={`${inputClass} w-40`}>
              <option value="all">전체</option>
              {instItems.map((i) => (
                <option key={i.detailCode} value={i.detailCode}>
                  {i.detailName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>브랜드명 검색</label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-outline" />
              <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="브랜드명" className={`${inputClass} w-56 pl-8`} />
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          disabled={instItems.length === 0}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-3.5 w-3.5" />
          브랜드 추가
        </button>
      </div>

      <DataGrid<CommonCodeDetailApi>
        columnDefs={columnDefs}
        rowData={filtered}
        getRowId={(p) => p.data.detailCode}
        context={gridContext}
        onCellClicked={onCellClicked}
        rowClass="cursor-pointer"
        loading={loading}
        emptyMessage={loadError || (kw || instFilter !== "all" ? "조건에 맞는 브랜드가 없습니다." : "등록된 브랜드가 없습니다.")}
      />

      {showAddModal && (
        <AddBrandModal
          instItems={instItems}
          defaultInstCode={instFilter !== "all" ? instFilter : ""}
          onCancel={() => setShowAddModal(false)}
          onSubmit={handleAdd}
        />
      )}
      {editingBrand && (
        <EditBrandModal
          brand={editingBrand}
          instItems={instItems}
          onCancel={() => setEditingBrand(null)}
          onSave={handleSaveEdit}
          onUploadLogo={handleUploadLogo}
          onDeleteLogo={handleDeleteLogo}
        />
      )}
      {pendingDelete && (
        <ConfirmModal
          title="브랜드 삭제"
          message={`"${pendingDelete.detailName}" 브랜드를 삭제하시겠습니까?`}
          confirmLabel="삭제"
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}

      {globalError && (
        <div className="fixed right-6 bottom-6 z-[999] rounded-lg bg-red-600 px-4 py-3 text-xs font-bold text-white shadow-xl">{globalError}</div>
      )}
      {toast && !globalError && (
        <div className="fixed right-6 bottom-6 z-[999] rounded-lg bg-secondary px-4 py-3 text-xs font-bold text-white shadow-xl">{toast}</div>
      )}
    </div>
  );
}
