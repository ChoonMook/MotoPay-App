// 상품 관리 (uploads/MotoPay_프로그램목록표_v1_48.xlsx "관리자웹_프로그램" 시트 AD-CTLG-05 스펙 이식)
// [구성요소] 상품유형/상품분류/브랜드/딜러사/사용여부/상품명 검색 + 상품 목록 + 등록/수정 팝업
// 원가(supplyPrice)는 정산 관련 내부 값이라 SUPER_ADMIN·SETTLEMENT 권한 관리자에게만 노출(서버가 응답에서 필드
// 자체를 생략하고, 클라이언트도 getMe()로 확인한 permGroup 기준으로 컬럼/입력폼을 함께 숨김 — 이중 방어)
// apps/api(/admin/products/*, /admin/common-codes/*)와 연동된 실 데이터 화면
// 목록 그리드는 관리자웹 표준 컴포넌트인 components/DataGrid.tsx(ag-grid-community 기반)를 사용한다
import { useEffect, useMemo, useState } from "react";
import type { CellClickedEvent, ColDef, ICellRendererParams } from "ag-grid-community";
import { Download, ImageIcon, Plus, Search, Trash2, X } from "lucide-react";
import { getMe } from "../../api/adminAuth";
import { getGroup, type CommonCodeDetailApi } from "../../api/commonCodes";
import { API_BASE_URL } from "../../api/config";
import {
  createProduct,
  deleteProduct,
  deleteProductImage,
  listProducts,
  updateProduct,
  uploadProductImage,
  type CreateProductInput,
  type ProductApi,
} from "../../api/products";
import ConfirmModal from "../../components/ConfirmModal";
import DataGrid from "../../components/DataGrid";
import ExcelActionButton from "../../components/ExcelActionButton";
import PageBreadcrumb from "../../components/PageBreadcrumb";
import RichTextEditor from "../../components/RichTextEditor";
import { exportRowsAsXlsx } from "../../lib/exportXlsx";

const PROD_TYPE_GROUP = "PROD_TYPE";
const PROD_CAT_GROUP = "PROD_CAT";
const PROD_BRAND_GROUP = "PROD_BRAND";
const DEALER_GROUP = "DEALER";
const SUPPLY_PRICE_VISIBLE_PERM_GROUPS = new Set(["SUPER_ADMIN", "SETTLEMENT"]);
const MAX_PRODUCT_IMAGES = 10;

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

interface GalleryImage {
  key: string;
  url: string;
}

// 등록 팝업(아직 상품이 없어 임시 미리보기 URL)과 수정 팝업(실제 업로드된 이미지 URL) 모두에서 재사용하는
// 이미지 갤러리 UI — 실제 업로드/삭제 타이밍은 각 팝업이 onAdd/onRemove로 다르게 구현한다
function ProductImageGallery({
  images,
  uploading,
  onAdd,
  onRemove,
}: {
  images: GalleryImage[];
  uploading: boolean;
  onAdd: (file: File) => void;
  onRemove: (key: string) => void;
}) {
  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onAdd(file);
  };

  return (
    <div className="space-y-2">
      <label className={labelClass}>
        이미지 ({images.length}/{MAX_PRODUCT_IMAGES})
      </label>
      <div className="flex flex-wrap gap-2">
        {images.map((img) => (
          <div key={img.key} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-outline-variant/60 bg-surface-container-low">
            <img src={img.url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onRemove(img.key)}
              className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white transition-all hover:bg-black/80"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {images.length < MAX_PRODUCT_IMAGES && (
          <label className="flex h-20 w-20 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-outline-variant text-outline transition-all hover:border-primary hover:text-primary">
            {uploading ? (
              <span className="text-[10px] font-semibold">업로드중</span>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span className="text-[10px] font-semibold">추가</span>
              </>
            )}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFileSelected} disabled={uploading} />
          </label>
        )}
      </div>
    </div>
  );
}

function formatWon(v: number | null | undefined): string {
  if (v === null || v === undefined) return "-";
  return `${v.toLocaleString("ko-KR")}원`;
}

interface ProductFormValue {
  prodType: string;
  brand: string;
  prodCat: string;
  dealerCode: string;
  name: string;
  price: string;
  originPrice: string;
  supplyPrice: string;
  description: string;
  useYn: boolean;
  ncpApplicable: boolean;
  bidApplicable: boolean;
}

function ProductFormFields({
  value,
  onChange,
  prodTypeItems,
  prodCatItems,
  brandItems,
  dealerItems,
  canViewSupplyPrice,
}: {
  value: ProductFormValue;
  onChange: (patch: Partial<ProductFormValue>) => void;
  prodTypeItems: CommonCodeDetailApi[];
  prodCatItems: CommonCodeDetailApi[];
  brandItems: CommonCodeDetailApi[];
  dealerItems: CommonCodeDetailApi[];
  canViewSupplyPrice: boolean;
}) {
  const isPackage = value.prodType === "PKG";

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className={labelClass}>상품유형</label>
          <select
            value={value.prodType}
            onChange={(e) => onChange({ prodType: e.target.value, ...(e.target.value !== "PKG" ? { dealerCode: "" } : {}) })}
            className={inputClass}
          >
            {prodTypeItems.map((i) => (
              <option key={i.detailCode} value={i.detailCode}>
                {i.detailName}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>브랜드</label>
          <select value={value.brand} onChange={(e) => onChange({ brand: e.target.value })} className={inputClass}>
            <option value="">선택 안 함</option>
            {brandItems.map((i) => (
              <option key={i.detailCode} value={i.detailCode}>
                {i.detailName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className={labelClass}>상품분류</label>
          <select value={value.prodCat} onChange={(e) => onChange({ prodCat: e.target.value })} className={inputClass}>
            <option value="">선택 안 함</option>
            {prodCatItems.map((i) => (
              <option key={i.detailCode} value={i.detailCode}>
                {i.detailName}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>딜러사{isPackage ? "" : " (패키지 전용)"}</label>
          <select
            value={value.dealerCode}
            onChange={(e) => onChange({ dealerCode: e.target.value })}
            disabled={!isPackage}
            className={`${inputClass} disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:text-on-surface-variant`}
          >
            <option value="">선택 안 함</option>
            {dealerItems.map((i) => (
              <option key={i.detailCode} value={i.detailCode}>
                {i.detailName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className={labelClass}>상품명</label>
        <input value={value.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="상품명" className={inputClass} />
      </div>

      <div className={`grid gap-3 ${canViewSupplyPrice ? "grid-cols-3" : "grid-cols-2"}`}>
        <div className="space-y-1.5">
          <label className={labelClass}>판매가</label>
          <input
            type="number"
            min={0}
            value={value.price}
            onChange={(e) => onChange({ price: e.target.value })}
            placeholder="0"
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>정가</label>
          <input
            type="number"
            min={0}
            value={value.originPrice}
            onChange={(e) => onChange({ originPrice: e.target.value })}
            placeholder="0"
            className={inputClass}
          />
        </div>
        {canViewSupplyPrice && (
          <div className="space-y-1.5">
            <label className={labelClass}>원가</label>
            <input
              type="number"
              min={0}
              value={value.supplyPrice}
              onChange={(e) => onChange({ supplyPrice: e.target.value })}
              placeholder="0"
              className={inputClass}
            />
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label className={labelClass}>상품설명</label>
        <RichTextEditor value={value.description} onChange={(html) => onChange({ description: html })} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <label className="flex items-center gap-2 text-xs font-semibold text-on-surface">
          <input type="checkbox" checked={value.useYn} onChange={(e) => onChange({ useYn: e.target.checked })} className="h-4 w-4 rounded border-outline-variant text-primary" />
          판매여부
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold text-on-surface">
          <input type="checkbox" checked={value.ncpApplicable} onChange={(e) => onChange({ ncpApplicable: e.target.checked })} className="h-4 w-4 rounded border-outline-variant text-primary" />
          신차패키지 적용
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold text-on-surface">
          <input type="checkbox" checked={value.bidApplicable} onChange={(e) => onChange({ bidApplicable: e.target.checked })} className="h-4 w-4 rounded border-outline-variant text-primary" />
          예약시공 적용
        </label>
      </div>
    </div>
  );
}

const EMPTY_FORM: ProductFormValue = {
  prodType: "",
  brand: "",
  prodCat: "",
  dealerCode: "",
  name: "",
  price: "",
  originPrice: "",
  supplyPrice: "",
  description: "",
  useYn: true,
  ncpApplicable: true,
  bidApplicable: true,
};

function formToInput(v: ProductFormValue): CreateProductInput {
  return {
    prodType: v.prodType,
    brand: v.brand || undefined,
    prodCat: v.prodCat || undefined,
    dealerCode: v.dealerCode || undefined,
    name: v.name.trim(),
    price: Number(v.price) || 0,
    originPrice: v.originPrice ? Number(v.originPrice) : undefined,
    supplyPrice: v.supplyPrice ? Number(v.supplyPrice) : undefined,
    description: v.description || undefined,
    useYn: v.useYn,
    ncpApplicable: v.ncpApplicable,
    bidApplicable: v.bidApplicable,
  };
}

function AddProductModal({
  prodTypeItems,
  prodCatItems,
  brandItems,
  dealerItems,
  canViewSupplyPrice,
  onCancel,
  onSubmit,
}: {
  prodTypeItems: CommonCodeDetailApi[];
  prodCatItems: CommonCodeDetailApi[];
  brandItems: CommonCodeDetailApi[];
  dealerItems: CommonCodeDetailApi[];
  canViewSupplyPrice: boolean;
  onCancel: () => void;
  onSubmit: (input: CreateProductInput, imageDataUris: string[]) => Promise<void>;
}) {
  const [value, setValue] = useState<ProductFormValue>({ ...EMPTY_FORM, prodType: prodTypeItems[0]?.detailCode ?? "" });
  const [stagedImages, setStagedImages] = useState<GalleryImage[]>([]);
  const [processingImage, setProcessingImage] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 상품이 아직 없는 등록 단계라 서버 업로드 없이 로컬 미리보기(dataURI)로만 들고 있다가, 등록 성공 후 순서대로 업로드한다
  const addStagedImage = async (file: File) => {
    setProcessingImage(true);
    try {
      const dataUri = await resizeImageToDataUri(file);
      setStagedImages((prev) => [...prev, { key: `${Date.now()}-${prev.length}`, url: dataUri }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "이미지를 처리하지 못했습니다.");
    } finally {
      setProcessingImage(false);
    }
  };
  const removeStagedImage = (key: string) => {
    setStagedImages((prev) => prev.filter((img) => img.key !== key));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.prodType || !value.name.trim() || !value.price) {
      setError("상품유형·상품명·판매가를 모두 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onSubmit(formToInput(value), stagedImages.map((img) => img.url));
    } catch (err) {
      setError(err instanceof Error ? err.message : "상품 등록에 실패했습니다.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-bold text-secondary">상품 추가</h3>
          <button type="button" onClick={onCancel} className="text-outline hover:text-on-surface">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mb-4">
          <ProductImageGallery images={stagedImages} uploading={processingImage} onAdd={addStagedImage} onRemove={removeStagedImage} />
        </div>
        <ProductFormFields
          value={value}
          onChange={(patch) => setValue((prev) => ({ ...prev, ...patch }))}
          prodTypeItems={prodTypeItems}
          prodCatItems={prodCatItems}
          brandItems={brandItems}
          dealerItems={dealerItems}
          canViewSupplyPrice={canViewSupplyPrice}
        />
        {error && <p className="mt-3 text-[12px] font-semibold text-red-600">{error}</p>}
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

function EditProductModal({
  product,
  prodTypeItems,
  prodCatItems,
  brandItems,
  dealerItems,
  canViewSupplyPrice,
  onCancel,
  onSave,
  onAddImage,
  onRemoveImage,
}: {
  product: ProductApi;
  prodTypeItems: CommonCodeDetailApi[];
  prodCatItems: CommonCodeDetailApi[];
  brandItems: CommonCodeDetailApi[];
  dealerItems: CommonCodeDetailApi[];
  canViewSupplyPrice: boolean;
  onCancel: () => void;
  onSave: (input: CreateProductInput) => Promise<void>;
  onAddImage: (file: File) => Promise<void>;
  onRemoveImage: (imageId: number) => Promise<void>;
}) {
  const [value, setValue] = useState<ProductFormValue>({
    prodType: product.prodType,
    brand: product.brand ?? "",
    prodCat: product.prodCat ?? "",
    dealerCode: product.dealerCode ?? "",
    name: product.name,
    price: String(product.price),
    originPrice: product.originPrice !== null ? String(product.originPrice) : "",
    supplyPrice: product.supplyPrice !== null && product.supplyPrice !== undefined ? String(product.supplyPrice) : "",
    description: product.description ?? "",
    useYn: product.useYn,
    ncpApplicable: product.ncpApplicable,
    bidApplicable: product.bidApplicable,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.prodType || !value.name.trim() || !value.price) {
      setError("상품유형·상품명·판매가를 모두 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onSave(formToInput(value));
      onCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
      setSubmitting(false);
    }
  };

  const addImage = async (file: File) => {
    setUploadingImage(true);
    setError("");
    try {
      await onAddImage(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "이미지 업로드에 실패했습니다.");
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = async (key: string) => {
    try {
      await onRemoveImage(Number(key));
    } catch (err) {
      setError(err instanceof Error ? err.message : "이미지 삭제에 실패했습니다.");
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-bold text-secondary">상품 수정</h3>
          <button type="button" onClick={onCancel} className="text-outline hover:text-on-surface">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mb-4 space-y-1.5">
          <label className={labelClass}>상품코드</label>
          <input value={product.productCode} disabled className={`${inputClass} cursor-not-allowed bg-surface-container-low text-on-surface-variant`} />
        </div>
        <div className="mb-4">
          <ProductImageGallery
            images={product.images.map((img) => ({ key: String(img.id), url: `${API_BASE_URL}/uploads/${img.imagePath}` }))}
            uploading={uploadingImage}
            onAdd={addImage}
            onRemove={removeImage}
          />
        </div>
        <ProductFormFields
          value={value}
          onChange={(patch) => setValue((prev) => ({ ...prev, ...patch }))}
          prodTypeItems={prodTypeItems}
          prodCatItems={prodCatItems}
          brandItems={brandItems}
          dealerItems={dealerItems}
          canViewSupplyPrice={canViewSupplyPrice}
        />
        {error && <p className="mt-3 text-[12px] font-semibold text-red-600">{error}</p>}
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
  onDeleteRequest: (product: ProductApi) => void;
}

function ImageCellRenderer({ data }: ICellRendererParams<ProductApi>) {
  if (!data) return null;
  return (
    <div className="flex h-full items-center">
      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-outline-variant/60 bg-surface-container-low">
        {data.imagePath ? (
          <img src={`${API_BASE_URL}/uploads/${data.imagePath}`} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImageIcon className="h-4 w-4 text-outline" />
        )}
      </div>
    </div>
  );
}

function DeleteActionCellRenderer({ data, context }: ICellRendererParams<ProductApi>) {
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

export default function ProductMgmtPage() {
  const [products, setProducts] = useState<ProductApi[]>([]);
  const [prodTypeItems, setProdTypeItems] = useState<CommonCodeDetailApi[]>([]);
  const [prodCatItems, setProdCatItems] = useState<CommonCodeDetailApi[]>([]);
  const [brandItems, setBrandItems] = useState<CommonCodeDetailApi[]>([]);
  const [dealerItems, setDealerItems] = useState<CommonCodeDetailApi[]>([]);
  const [permGroup, setPermGroup] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [keyword, setKeyword] = useState("");
  const [prodTypeFilter, setProdTypeFilter] = useState("all");
  const [prodCatFilter, setProdCatFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [useYnFilter, setUseYnFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductApi | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ProductApi | null>(null);

  const [toast, setToast] = useState("");
  const [globalError, setGlobalError] = useState("");

  const canViewSupplyPrice = !!permGroup && SUPPLY_PRICE_VISIBLE_PERM_GROUPS.has(permGroup);

  const load = () => {
    setLoading(true);
    setLoadError("");
    Promise.all([
      listProducts(),
      getGroup(PROD_TYPE_GROUP),
      getGroup(PROD_CAT_GROUP),
      getGroup(PROD_BRAND_GROUP),
      getGroup(DEALER_GROUP),
      getMe(),
    ])
      .then(([productList, prodTypeGroup, prodCatGroup, brandGroup, dealerGroup, me]) => {
        setProducts(productList);
        setProdTypeItems([...prodTypeGroup.details].filter((d) => d.useYn).sort((a, b) => a.sortOrder - b.sortOrder));
        setProdCatItems([...prodCatGroup.details].filter((d) => d.useYn).sort((a, b) => a.sortOrder - b.sortOrder));
        setBrandItems([...brandGroup.details].filter((d) => d.useYn).sort((a, b) => a.sortOrder - b.sortOrder));
        setDealerItems([...dealerGroup.details].filter((d) => d.useYn).sort((a, b) => a.sortOrder - b.sortOrder));
        setPermGroup(me.permGroup);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "상품 목록을 불러오지 못했습니다."))
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

  const prodTypeLabelMap = useMemo(() => {
    const map = new Map(prodTypeItems.map((i) => [i.detailCode, i.detailName]));
    return (code: string) => map.get(code) ?? code;
  }, [prodTypeItems]);
  const prodCatLabelMap = useMemo(() => {
    const map = new Map(prodCatItems.map((i) => [i.detailCode, i.detailName]));
    return (code: string | null) => (code ? (map.get(code) ?? code) : "-");
  }, [prodCatItems]);
  const brandLabelMap = useMemo(() => {
    const map = new Map(brandItems.map((i) => [i.detailCode, i.detailName]));
    return (code: string | null) => (code ? (map.get(code) ?? code) : "-");
  }, [brandItems]);

  const kw = keyword.trim();
  const filtered = products.filter((p) => {
    const matchesType = prodTypeFilter === "all" || p.prodType === prodTypeFilter;
    const matchesCat = prodCatFilter === "all" || p.prodCat === prodCatFilter;
    const matchesBrand = brandFilter === "all" || p.brand === brandFilter;
    const matchesUseYn = useYnFilter === "all" || (useYnFilter === "active" ? p.useYn : !p.useYn);
    const matchesKeyword = !kw || p.name.includes(kw) || p.productCode.includes(kw);
    return matchesType && matchesCat && matchesBrand && matchesUseYn && matchesKeyword;
  });

  const handleAdd = async (input: CreateProductInput, imageDataUris: string[]) => {
    let created = await createProduct(input);
    // 상품이 없는 상태에선 이미지 업로드를 할 수 없어, 등록 성공 직후 스테이징해둔 이미지를 순서대로 업로드
    for (const dataUri of imageDataUris) {
      created = await uploadProductImage(created.id, dataUri);
    }
    setProducts((prev) => [created, ...prev]);
    setShowAddModal(false);
    setToast("상품을 추가했습니다.");
  };

  const handleSaveEdit = async (input: CreateProductInput) => {
    if (!editingProduct) return;
    const updated = await updateProduct(editingProduct.id, input);
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setToast("상품을 저장했습니다.");
  };

  const handleAddImage = async (file: File) => {
    if (!editingProduct) return;
    const dataUri = await resizeImageToDataUri(file);
    const updated = await uploadProductImage(editingProduct.id, dataUri);
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditingProduct(updated);
  };

  const handleRemoveImage = async (imageId: number) => {
    if (!editingProduct) return;
    const updated = await deleteProductImage(editingProduct.id, imageId);
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditingProduct(updated);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const product = pendingDelete;
    setPendingDelete(null);
    try {
      await deleteProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setToast("상품을 삭제했습니다.");
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    }
  };

  const handleExport = () => {
    exportRowsAsXlsx({
      fileName: `상품_관리_${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: "상품 관리",
      columns: [
        { header: "상품코드", key: "productCode", width: 16 },
        { header: "상품유형", key: "prodType", width: 12 },
        { header: "상품분류", key: "prodCat", width: 12 },
        { header: "브랜드", key: "brand", width: 12 },
        { header: "상품명", key: "name", width: 24 },
        { header: "판매가", key: "price", width: 12 },
        { header: "정가", key: "originPrice", width: 12 },
        ...(canViewSupplyPrice ? [{ header: "원가", key: "supplyPrice", width: 12 }] : []),
        { header: "신차패키지", key: "ncpApplicable", width: 12 },
        { header: "예약시공", key: "bidApplicable", width: 12 },
        { header: "판매여부", key: "useYn", width: 10 },
      ],
      rows: filtered.map((p) => ({
        productCode: p.productCode,
        prodType: prodTypeLabelMap(p.prodType),
        prodCat: prodCatLabelMap(p.prodCat),
        brand: brandLabelMap(p.brand),
        name: p.name,
        price: p.price,
        originPrice: p.originPrice ?? "-",
        ...(canViewSupplyPrice ? { supplyPrice: p.supplyPrice ?? "-" } : {}),
        ncpApplicable: p.ncpApplicable ? "Y" : "N",
        bidApplicable: p.bidApplicable ? "Y" : "N",
        useYn: p.useYn ? "사용" : "미사용",
      })),
    });
  };

  const gridContext = useMemo<GridContext>(() => ({ onDeleteRequest: setPendingDelete }), []);

  const columnDefs = useMemo<ColDef<ProductApi>[]>(() => {
    const cols: ColDef<ProductApi>[] = [
      { headerName: "이미지", colId: "image", width: 80, sortable: false, resizable: false, cellRenderer: ImageCellRenderer },
      { headerName: "상품코드", field: "productCode", flex: 1, minWidth: 130 },
      { headerName: "상품유형", field: "prodType", flex: 0.8, minWidth: 100, valueFormatter: (p) => prodTypeLabelMap(p.value) },
      { headerName: "상품분류", field: "prodCat", flex: 0.8, minWidth: 100, valueFormatter: (p) => prodCatLabelMap(p.value) },
      { headerName: "브랜드", field: "brand", flex: 0.8, minWidth: 100, valueFormatter: (p) => brandLabelMap(p.value) },
      { headerName: "상품명", field: "name", flex: 1.4, minWidth: 160 },
      { headerName: "판매가", field: "price", flex: 0.8, minWidth: 110, type: "rightAligned", valueFormatter: (p) => formatWon(p.value) },
      { headerName: "정가", field: "originPrice", flex: 0.8, minWidth: 110, type: "rightAligned", valueFormatter: (p) => formatWon(p.value) },
    ];
    if (canViewSupplyPrice) {
      cols.push({ headerName: "원가", field: "supplyPrice", flex: 0.8, minWidth: 110, type: "rightAligned", valueFormatter: (p) => formatWon(p.value) });
    }
    cols.push(
      {
        headerName: "신차패키지",
        colId: "ncpApplicable",
        width: 100,
        // useYn(boolean)과 동일한 이유로 valueGetter로 문자열을 직접 반환(체크박스 자동 렌더링 우회)
        valueGetter: (p) => (p.data ? (p.data.ncpApplicable ? "Y" : "N") : ""),
        cellClass: "text-center",
      },
      {
        headerName: "예약시공",
        colId: "bidApplicable",
        width: 100,
        valueGetter: (p) => (p.data ? (p.data.bidApplicable ? "Y" : "N") : ""),
        cellClass: "text-center",
      },
      {
        headerName: "판매여부",
        colId: "useYnStatus",
        flex: 0.7,
        minWidth: 90,
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
    );
    return cols;
  }, [prodTypeLabelMap, prodCatLabelMap, brandLabelMap, canViewSupplyPrice]);

  const onCellClicked = (e: CellClickedEvent<ProductApi>) => {
    if (e.colDef.colId === "actions" || !e.data) return;
    setEditingProduct(e.data);
  };

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-8 py-6">
      <PageBreadcrumb path="/catalog/prod-mgmt" />

      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label className={labelClass}>상품유형</label>
            <select value={prodTypeFilter} onChange={(e) => setProdTypeFilter(e.target.value)} className={`${inputClass} w-32`}>
              <option value="all">전체</option>
              {prodTypeItems.map((i) => (
                <option key={i.detailCode} value={i.detailCode}>
                  {i.detailName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>상품분류</label>
            <select value={prodCatFilter} onChange={(e) => setProdCatFilter(e.target.value)} className={`${inputClass} w-32`}>
              <option value="all">전체</option>
              {prodCatItems.map((i) => (
                <option key={i.detailCode} value={i.detailCode}>
                  {i.detailName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>브랜드</label>
            <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className={`${inputClass} w-32`}>
              <option value="all">전체</option>
              {brandItems.map((i) => (
                <option key={i.detailCode} value={i.detailCode}>
                  {i.detailName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>판매여부</label>
            <select value={useYnFilter} onChange={(e) => setUseYnFilter(e.target.value)} className={`${inputClass} w-28`}>
              <option value="all">전체</option>
              <option value="active">사용</option>
              <option value="inactive">미사용</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>상품명/코드 검색</label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-outline" />
              <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="상품명 또는 상품코드" className={`${inputClass} w-56 pl-8`} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExcelActionButton icon={Download} label="엑셀 다운로드" onClick={handleExport} />
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            disabled={prodTypeItems.length === 0}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-3.5 w-3.5" />
            상품 추가
          </button>
        </div>
      </div>

      <DataGrid<ProductApi>
        columnDefs={columnDefs}
        rowData={filtered}
        getRowId={(p) => String(p.data.id)}
        context={gridContext}
        onCellClicked={onCellClicked}
        rowClass="cursor-pointer"
        loading={loading}
        emptyMessage={
          loadError ||
          (kw || prodTypeFilter !== "all" || prodCatFilter !== "all" || brandFilter !== "all" || useYnFilter !== "all"
            ? "조건에 맞는 상품이 없습니다."
            : "등록된 상품이 없습니다.")
        }
      />

      {showAddModal && (
        <AddProductModal
          prodTypeItems={prodTypeItems}
          prodCatItems={prodCatItems}
          brandItems={brandItems}
          dealerItems={dealerItems}
          canViewSupplyPrice={canViewSupplyPrice}
          onCancel={() => setShowAddModal(false)}
          onSubmit={handleAdd}
        />
      )}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          prodTypeItems={prodTypeItems}
          prodCatItems={prodCatItems}
          brandItems={brandItems}
          dealerItems={dealerItems}
          canViewSupplyPrice={canViewSupplyPrice}
          onCancel={() => setEditingProduct(null)}
          onSave={handleSaveEdit}
          onAddImage={handleAddImage}
          onRemoveImage={handleRemoveImage}
        />
      )}
      {pendingDelete && (
        <ConfirmModal
          title="상품 삭제"
          message={`"${pendingDelete.name}" 상품을 삭제하시겠습니까?`}
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
