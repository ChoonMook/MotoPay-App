// 차종 마스터 (uploads/MotoPay_프로그램목록표_v1_48.xlsx "관리자웹_프로그램" 시트 AD-CTLG-02 스펙 이식)
// [구성요소] 좌측 메이커>차종 2단 트리 + 우측 선택 항목 상세 패널 — 메이커(CAR_BRAND)·차종(CAR_MODEL) 공통코드
// 그룹을 그대로 재사용하고, 차종의 대표사진 경로는 CommonCodeDetail.ref2에 저장한다(2026-08-10 논의로 원래
// 기획서의 3단계(메이커>차종>모델)·틴팅 시공 가능 부위 설정은 이번 범위에서 제외하고 2단계로 단순화)
// apps/api(/admin/common-codes/*)와 연동된 실 데이터 화면
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Download, ImageIcon, Plus, Search, Trash2, X } from "lucide-react";
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
import ExcelActionButton from "../../components/ExcelActionButton";
import { exportRowsAsXlsx } from "../../lib/exportXlsx";
import PageBreadcrumb from "../../components/PageBreadcrumb";

const BRAND_GROUP = "CAR_BRAND";
const MODEL_GROUP = "CAR_MODEL";

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

type Selection = { level: "brand"; detailCode: string } | { level: "model"; detailCode: string };

function AddBrandModal({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (v: { detailCode: string; detailName: string }) => Promise<void> }) {
  const [detailCode, setDetailCode] = useState("");
  const [detailName, setDetailName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailCode.trim() || !detailName.trim()) {
      setError("메이커코드·메이커명을 모두 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({ detailCode: detailCode.trim().toUpperCase(), detailName: detailName.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "메이커 추가에 실패했습니다.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="w-full max-w-[360px] rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-bold text-secondary">메이커 추가</h3>
          <button type="button" onClick={onCancel} className="text-outline hover:text-on-surface">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <label className={labelClass}>메이커코드</label>
            <input value={detailCode} onChange={(e) => setDetailCode(e.target.value.toUpperCase())} placeholder="예: AUDI" className={`${inputClass} font-mono`} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>메이커명</label>
            <input value={detailName} onChange={(e) => setDetailName(e.target.value)} placeholder="예: 아우디" className={inputClass} />
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

function AddModelModal({
  brandName,
  onCancel,
  onSubmit,
}: {
  brandName: string;
  onCancel: () => void;
  onSubmit: (v: { detailCode: string; detailName: string }) => Promise<void>;
}) {
  const [detailCode, setDetailCode] = useState("");
  const [detailName, setDetailName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailCode.trim() || !detailName.trim()) {
      setError("차종코드·차종명을 모두 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({ detailCode: detailCode.trim().toUpperCase(), detailName: detailName.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "차종 추가에 실패했습니다.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="w-full max-w-[360px] rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-bold text-secondary">차종 추가</h3>
          <button type="button" onClick={onCancel} className="text-outline hover:text-on-surface">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <label className={labelClass}>소속 메이커</label>
            <input value={brandName} disabled className={`${inputClass} cursor-not-allowed bg-surface-container-low text-on-surface-variant`} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>차종코드</label>
            <input value={detailCode} onChange={(e) => setDetailCode(e.target.value.toUpperCase())} placeholder="예: A4" className={`${inputClass} font-mono`} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>차종명</label>
            <input value={detailName} onChange={(e) => setDetailName(e.target.value)} placeholder="예: A4" className={inputClass} />
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

export default function CarModelMstPage() {
  const [brands, setBrands] = useState<CommonCodeDetailApi[]>([]);
  const [models, setModels] = useState<CommonCodeDetailApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selection, setSelection] = useState<Selection | null>(null);
  const [keyword, setKeyword] = useState("");

  const [showAddBrandModal, setShowAddBrandModal] = useState(false);
  const [addModelForBrand, setAddModelForBrand] = useState<CommonCodeDetailApi | null>(null);
  const [pendingDeleteBrand, setPendingDeleteBrand] = useState<CommonCodeDetailApi | null>(null);
  const [pendingDeleteModel, setPendingDeleteModel] = useState<CommonCodeDetailApi | null>(null);

  const [toast, setToast] = useState("");
  const [globalError, setGlobalError] = useState("");

  const load = () => {
    setLoading(true);
    setLoadError("");
    Promise.all([getGroup(BRAND_GROUP), getGroup(MODEL_GROUP)])
      .then(([brandGroup, modelGroup]) => {
        setBrands([...brandGroup.details].sort((a, b) => a.sortOrder - b.sortOrder));
        setModels([...modelGroup.details].sort((a, b) => a.sortOrder - b.sortOrder));
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "차종 마스터 목록을 불러오지 못했습니다."))
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

  const modelsByBrand = useMemo(() => {
    const map = new Map<string, CommonCodeDetailApi[]>();
    for (const m of models) {
      const list = map.get(m.ref1 ?? "") ?? [];
      list.push(m);
      map.set(m.ref1 ?? "", list);
    }
    return map;
  }, [models]);

  const kw = keyword.trim();
  const matchesKeyword = (name: string) => !kw || name.includes(kw);
  // 검색어가 있으면: 이름이 일치하는 메이커 자신 + 소속 차종 중 하나라도 일치하는 메이커를 표시
  const visibleBrands = useMemo(() => {
    if (!kw) return brands;
    return brands.filter((b) => matchesKeyword(b.detailName) || (modelsByBrand.get(b.detailCode) ?? []).some((m) => matchesKeyword(m.detailName)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brands, modelsByBrand, kw]);

  const toggleExpand = (brandCode: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(brandCode)) next.delete(brandCode);
      else next.add(brandCode);
      return next;
    });
  };

  const selectBrand = (brand: CommonCodeDetailApi) => {
    setSelection({ level: "brand", detailCode: brand.detailCode });
    setExpanded((prev) => new Set(prev).add(brand.detailCode));
  };

  const selectModel = (model: CommonCodeDetailApi) => {
    setSelection({ level: "model", detailCode: model.detailCode });
  };

  const selectedBrand = selection?.level === "brand" ? (brands.find((b) => b.detailCode === selection.detailCode) ?? null) : null;
  const selectedModel = selection?.level === "model" ? (models.find((m) => m.detailCode === selection.detailCode) ?? null) : null;
  const selectedModelBrand = selectedModel ? (brands.find((b) => b.detailCode === selectedModel.ref1) ?? null) : null;

  const handleAddBrand = async (v: { detailCode: string; detailName: string }) => {
    const created = await createDetail(BRAND_GROUP, v);
    setBrands((prev) => [...prev, created]);
    setShowAddBrandModal(false);
    setToast("메이커를 추가했습니다.");
    selectBrand(created);
  };

  const handleAddModel = async (v: { detailCode: string; detailName: string }) => {
    if (!addModelForBrand) return;
    const created = await createDetail(MODEL_GROUP, { ...v, ref1: addModelForBrand.detailCode });
    setModels((prev) => [...prev, created]);
    setAddModelForBrand(null);
    setToast("차종을 추가했습니다.");
    setExpanded((prev) => new Set(prev).add(addModelForBrand.detailCode));
    selectModel(created);
  };

  const handleSaveBrand = async (detailName: string, useYn: boolean) => {
    if (!selectedBrand) return;
    try {
      const updated = await updateDetail(BRAND_GROUP, selectedBrand.detailCode, { detailName, useYn });
      setBrands((prev) => prev.map((b) => (b.detailCode === updated.detailCode ? updated : b)));
      setToast("메이커 정보를 저장했습니다.");
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "메이커 저장에 실패했습니다.");
    }
  };

  const handleSaveModel = async (detailName: string, useYn: boolean) => {
    if (!selectedModel) return;
    try {
      const updated = await updateDetail(MODEL_GROUP, selectedModel.detailCode, { detailName, useYn });
      setModels((prev) => prev.map((m) => (m.detailCode === updated.detailCode ? updated : m)));
      setToast("차종 정보를 저장했습니다.");
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "차종 저장에 실패했습니다.");
    }
  };

  const handleUploadModelPhoto = async (file: File) => {
    if (!selectedModel) return;
    try {
      const dataUri = await resizeImageToDataUri(file);
      const updated = await uploadDetailPhoto(MODEL_GROUP, selectedModel.detailCode, dataUri);
      setModels((prev) => prev.map((m) => (m.detailCode === updated.detailCode ? updated : m)));
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "대표사진 업로드에 실패했습니다.");
    }
  };

  const handleDeleteModelPhoto = async () => {
    if (!selectedModel) return;
    try {
      const updated = await deleteDetailPhoto(MODEL_GROUP, selectedModel.detailCode);
      setModels((prev) => prev.map((m) => (m.detailCode === updated.detailCode ? updated : m)));
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "대표사진 삭제에 실패했습니다.");
    }
  };

  const confirmDeleteBrand = async () => {
    if (!pendingDeleteBrand) return;
    const brand = pendingDeleteBrand;
    setPendingDeleteBrand(null);
    try {
      await deleteDetail(BRAND_GROUP, brand.detailCode);
      setBrands((prev) => prev.filter((b) => b.detailCode !== brand.detailCode));
      if (selection?.level === "brand" && selection.detailCode === brand.detailCode) setSelection(null);
      setToast("메이커를 삭제했습니다.");
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "메이커 삭제에 실패했습니다.");
    }
  };

  const confirmDeleteModel = async () => {
    if (!pendingDeleteModel) return;
    const model = pendingDeleteModel;
    setPendingDeleteModel(null);
    try {
      await deleteDetail(MODEL_GROUP, model.detailCode);
      setModels((prev) => prev.filter((m) => m.detailCode !== model.detailCode));
      if (selection?.level === "model" && selection.detailCode === model.detailCode) setSelection(null);
      setToast("차종을 삭제했습니다.");
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "차종 삭제에 실패했습니다.");
    }
  };

  const handleExcelDownload = () => {
    const rows = brands.flatMap((b) => {
      const children = modelsByBrand.get(b.detailCode) ?? [];
      if (children.length === 0) {
        return [{ brandName: b.detailName, modelName: "-", status: b.useYn ? "사용" : "미사용", hasPhoto: "-" }];
      }
      return children.map((m) => ({
        brandName: b.detailName,
        modelName: m.detailName,
        status: m.useYn ? "사용" : "미사용",
        hasPhoto: m.ref2 ? "있음" : "없음",
      }));
    });
    exportRowsAsXlsx({
      fileName: `차종_마스터_${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: "차종 마스터",
      columns: [
        { header: "메이커명", key: "brandName", width: 16 },
        { header: "차종명", key: "modelName", width: 18 },
        { header: "사용여부", key: "status", width: 10 },
        { header: "대표사진", key: "hasPhoto", width: 10 },
      ],
      rows,
    });
  };

  const brandChildCount = (brandCode: string) => (modelsByBrand.get(brandCode) ?? []).length;

  const requestDeleteBrand = (brand: CommonCodeDetailApi) => {
    if (brandChildCount(brand.detailCode) > 0) {
      setGlobalError(`"${brand.detailName}"에 소속된 차종이 있어 삭제할 수 없습니다. 먼저 소속 차종을 모두 삭제해주세요.`);
      return;
    }
    setPendingDeleteBrand(brand);
  };

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-8 py-6">
      <PageBreadcrumb path="/catalog/car-model-mst" />

      <div className="flex min-h-0 flex-1 gap-4">
        {/* 좌측: 메이커>차종 트리 */}
        <div className="flex w-[360px] shrink-0 flex-col rounded-xl border border-outline-variant/30 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-outline-variant/60 p-4">
            <h3 className="text-sm font-extrabold text-on-surface">메이커 / 차종</h3>
            <button
              type="button"
              onClick={() => setShowAddBrandModal(true)}
              className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-[11px] font-bold text-primary transition-all hover:bg-primary/20"
            >
              <Plus className="h-3.5 w-3.5" />
              메이커 추가
            </button>
          </div>
          <div className="border-b border-outline-variant/60 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-outline" />
              <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="메이커·차종명 검색" className={`${inputClass} pl-8`} />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {loading ? (
              <p className="px-2 py-6 text-center text-[12px] font-medium text-on-surface-variant">불러오는 중...</p>
            ) : loadError ? (
              <p className="px-2 py-6 text-center text-[12px] font-semibold text-red-600">{loadError}</p>
            ) : visibleBrands.length === 0 ? (
              <p className="px-2 py-6 text-center text-[12px] text-on-surface-variant">등록된 메이커가 없습니다.</p>
            ) : (
              visibleBrands.map((brand) => {
                const isExpanded = expanded.has(brand.detailCode);
                const children = (modelsByBrand.get(brand.detailCode) ?? []).filter((m) => !kw || matchesKeyword(m.detailName));
                const isBrandSelected = selection?.level === "brand" && selection.detailCode === brand.detailCode;
                return (
                  <div key={brand.detailCode}>
                    <button
                      type="button"
                      onClick={() => {
                        toggleExpand(brand.detailCode);
                        selectBrand(brand);
                      }}
                      className={`flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-[12px] font-bold transition-all ${
                        isBrandSelected ? "bg-primary/10 text-primary" : "text-on-surface hover:bg-surface-container-low"
                      }`}
                    >
                      {isExpanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                      <span className="flex-1 truncate">{brand.detailName}</span>
                      {!brand.useYn && <span className="shrink-0 text-[10px] font-semibold text-on-surface-variant">미사용</span>}
                      <span className="shrink-0 text-[10px] font-semibold text-on-surface-variant">{brandChildCount(brand.detailCode)}</span>
                    </button>
                    {isExpanded && (
                      <div className="ml-5 border-l border-outline-variant/60 pl-2">
                        {children.length === 0 ? (
                          <p className="px-2 py-1.5 text-[11px] text-on-surface-variant">등록된 차종이 없습니다.</p>
                        ) : (
                          children.map((model) => {
                            const isModelSelected = selection?.level === "model" && selection.detailCode === model.detailCode;
                            return (
                              <button
                                key={model.detailCode}
                                type="button"
                                onClick={() => selectModel(model)}
                                className={`flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-[11px] font-semibold transition-all ${
                                  isModelSelected ? "bg-primary/10 text-primary" : "text-on-surface-variant hover:bg-surface-container-low"
                                }`}
                              >
                                {model.ref2 ? (
                                  <img src={`${API_BASE_URL}/uploads/${model.ref2}`} alt="" className="h-4 w-4 shrink-0 rounded object-cover" />
                                ) : (
                                  <ImageIcon className="h-3.5 w-3.5 shrink-0 text-outline" />
                                )}
                                <span className="flex-1 truncate">{model.detailName}</span>
                                {!model.useYn && <span className="shrink-0 text-[10px] text-on-surface-variant">미사용</span>}
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 우측: 선택 항목 상세 패널 */}
        <div className="flex min-w-0 flex-1 flex-col rounded-xl border border-outline-variant/30 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-outline-variant/60 p-4">
            <h3 className="text-sm font-extrabold text-on-surface">상세정보</h3>
            <ExcelActionButton icon={Download} label="엑셀 다운로드" onClick={handleExcelDownload} />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            {selectedBrand ? (
              <BrandDetailForm
                key={selectedBrand.detailCode}
                brand={selectedBrand}
                childCount={brandChildCount(selectedBrand.detailCode)}
                onSave={handleSaveBrand}
                onAddModel={() => setAddModelForBrand(selectedBrand)}
                onDelete={() => requestDeleteBrand(selectedBrand)}
              />
            ) : selectedModel ? (
              <ModelDetailForm
                key={selectedModel.detailCode}
                model={selectedModel}
                brandName={selectedModelBrand?.detailName ?? "-"}
                onSave={handleSaveModel}
                onUploadPhoto={handleUploadModelPhoto}
                onDeletePhoto={handleDeleteModelPhoto}
                onDelete={() => setPendingDeleteModel(selectedModel)}
              />
            ) : (
              <p className="text-[12px] text-on-surface-variant">좌측 트리에서 메이커 또는 차종을 선택하세요.</p>
            )}
          </div>
        </div>
      </div>

      {showAddBrandModal && <AddBrandModal onCancel={() => setShowAddBrandModal(false)} onSubmit={handleAddBrand} />}
      {addModelForBrand && (
        <AddModelModal brandName={addModelForBrand.detailName} onCancel={() => setAddModelForBrand(null)} onSubmit={handleAddModel} />
      )}
      {pendingDeleteBrand && (
        <ConfirmModal
          title="메이커 삭제"
          message={`"${pendingDeleteBrand.detailName}" 메이커를 삭제하시겠습니까?`}
          confirmLabel="삭제"
          onCancel={() => setPendingDeleteBrand(null)}
          onConfirm={confirmDeleteBrand}
        />
      )}
      {pendingDeleteModel && (
        <ConfirmModal
          title="차종 삭제"
          message={`"${pendingDeleteModel.detailName}" 차종을 삭제하시겠습니까?`}
          confirmLabel="삭제"
          onCancel={() => setPendingDeleteModel(null)}
          onConfirm={confirmDeleteModel}
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

function BrandDetailForm({
  brand,
  childCount,
  onSave,
  onAddModel,
  onDelete,
}: {
  brand: CommonCodeDetailApi;
  childCount: number;
  onSave: (detailName: string, useYn: boolean) => Promise<void>;
  onAddModel: () => void;
  onDelete: () => void;
}) {
  const [detailName, setDetailName] = useState(brand.detailName);
  const [useYn, setUseYn] = useState(brand.useYn);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(detailName.trim(), useYn).finally(() => setSaving(false));
  };

  return (
    <form onSubmit={submit} className="mx-auto flex max-w-[480px] flex-col gap-4">
      <div className="space-y-1.5">
        <label className={labelClass}>메이커코드</label>
        <input value={brand.detailCode} disabled className={`${inputClass} cursor-not-allowed bg-surface-container-low text-on-surface-variant font-mono`} />
      </div>
      <div className="space-y-1.5">
        <label className={labelClass}>메이커명</label>
        <input value={detailName} onChange={(e) => setDetailName(e.target.value)} className={inputClass} />
      </div>
      <div className="space-y-1.5">
        <label className={labelClass}>사용여부</label>
        <select value={useYn ? "active" : "inactive"} onChange={(e) => setUseYn(e.target.value === "active")} className={inputClass}>
          <option value="active">사용</option>
          <option value="inactive">미사용</option>
        </select>
      </div>
      <p className="text-[11px] text-on-surface-variant">소속 차종 {childCount}건</p>

      <div className="flex items-center justify-between gap-2 border-t border-outline-variant/60 pt-4">
        <div className="flex items-center gap-2">
          <button type="button" onClick={onAddModel} className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-2 text-xs font-bold text-primary transition-all hover:bg-primary/20">
            <Plus className="h-3.5 w-3.5" />이 메이커에 차종 추가
          </button>
          <button type="button" onClick={onDelete} className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition-all hover:bg-red-100">
            <Trash2 className="h-3.5 w-3.5" />
            삭제
          </button>
        </div>
        <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-60">
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  );
}

function ModelDetailForm({
  model,
  brandName,
  onSave,
  onUploadPhoto,
  onDeletePhoto,
  onDelete,
}: {
  model: CommonCodeDetailApi;
  brandName: string;
  onSave: (detailName: string, useYn: boolean) => Promise<void>;
  onUploadPhoto: (file: File) => Promise<void>;
  onDeletePhoto: () => Promise<void>;
  onDelete: () => void;
}) {
  const [detailName, setDetailName] = useState(model.detailName);
  const [useYn, setUseYn] = useState(model.useYn);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(detailName.trim(), useYn).finally(() => setSaving(false));
  };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    await onUploadPhoto(file).finally(() => setUploading(false));
  };

  return (
    <form onSubmit={submit} className="mx-auto flex max-w-[480px] flex-col gap-4">
      <div className="space-y-1.5">
        <label className={labelClass}>소속 메이커</label>
        <input value={brandName} disabled className={`${inputClass} cursor-not-allowed bg-surface-container-low text-on-surface-variant`} />
      </div>
      <div className="space-y-1.5">
        <label className={labelClass}>차종코드</label>
        <input value={model.detailCode} disabled className={`${inputClass} cursor-not-allowed bg-surface-container-low text-on-surface-variant font-mono`} />
      </div>
      <div className="space-y-1.5">
        <label className={labelClass}>차종명</label>
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
        <label className={labelClass}>대표사진</label>
        <div className="flex items-center gap-4">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-outline-variant bg-surface-container-low">
            {model.ref2 ? (
              <img src={`${API_BASE_URL}/uploads/${model.ref2}`} alt="대표사진" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="h-6 w-6 text-outline" />
            )}
          </div>
          <div className="flex gap-2">
            <label className="cursor-pointer rounded-lg bg-surface-container-high px-3 py-1.5 text-[11px] font-bold text-on-surface transition-all hover:bg-surface-dim">
              {uploading ? "업로드 중..." : model.ref2 ? "사진 변경" : "사진 등록"}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFileSelected} disabled={uploading} />
            </label>
            {model.ref2 && (
              <button type="button" onClick={onDeletePhoto} className="rounded-lg bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-600 transition-all hover:bg-red-100">
                삭제
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-outline-variant/60 pt-4">
        <button type="button" onClick={onDelete} className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition-all hover:bg-red-100">
          <Trash2 className="h-3.5 w-3.5" />
          삭제
        </button>
        <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-60">
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  );
}
