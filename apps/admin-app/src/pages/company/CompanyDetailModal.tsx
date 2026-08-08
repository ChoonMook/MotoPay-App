// 업체 상세 팝업(AD-CO-04) — 전체화면 크기 + 탭 구조로 업체 기본정보/매장정보(사진·주소·카테고리 포함)/
// 예약가능시간/휴무일/일별슬롯/소속 사용자 계정을 한 곳에서 관리한다. 매장 관련 탭은 시공업체(coType=SHOP)
// 업체에만 노출되며, 화면 구성·상호작용은 apps/partner-app의 자기 업체 관리 화면(BizBasicInfoScreen 등)을
// 그대로 참고해 관리자용으로 옮겼다.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Image as ImageIcon,
  Lock,
  Pencil,
  Plus,
  Trash2,
  Unlock,
  X,
} from "lucide-react";
import { API_BASE_URL } from "../../api/config";
import {
  addCompanyHolidays,
  checkPartnerUsernameAvailable,
  createPartnerUser,
  deleteCompanyShopPhoto,
  deletePartnerUser,
  getCompanyDailySchedule,
  getCompanyShop,
  getCompanyTimeSlots,
  listCompanyHolidays,
  listPartnerUsers,
  removeCompanyHoliday,
  replaceCompanyTimeSlots,
  updateCompany,
  updateCompanyShop,
  updatePartnerUser,
  uploadCompanyShopPhoto,
  upsertCompanyDailySlot,
  type CompanyListItem,
  type CompanyShopDetail,
  type DailySchedule,
  type PartnerUserListItem,
  type TimeSlot,
} from "../../api/companies";
import { getGroup, type CommonCodeDetailApi } from "../../api/commonCodes";
import { useDaumPostcode } from "../../hooks/useDaumPostcode";
import ConfirmModal from "../../components/ConfirmModal";

const inputClass =
  "w-full rounded-lg border border-[#ced4da] bg-white px-3 py-2 text-xs font-normal outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5";
const labelClass = "ml-0.5 whitespace-nowrap text-[11px] font-bold tracking-widest text-secondary uppercase";
const disabledInputClass = `${inputClass} cursor-not-allowed bg-surface-container-low text-on-surface-variant`;

function statusText(active: boolean, activeLabel = "정상", inactiveLabel = "중지"): string {
  return active ? activeLabel : inactiveLabel;
}

const MAX_CASE_PHOTOS = 10;
const MAX_IMAGE_DIMENSION = 1600;
const IMAGE_JPEG_QUALITY = 0.82;

// 폰 카메라 원본을 그대로 base64로 올리면 요청이 너무 커지므로, 캔버스로 긴 변 기준 축소 + JPEG 압축
// (apps/partner-app의 BizBasicInfoScreen.tsx와 동일한 로직)
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

const FIXED_TIME_OPTIONS = Array.from({ length: 12 }, (_, i) => `${String(8 + i).padStart(2, "0")}:00`);
const DAY_TYPE_ORDER = ["WEEKDAY", "SAT", "SUN", "HOLIDAY"];

type DetailTab = "basic" | "shop" | "timeSlots" | "holidays" | "dailySlots" | "users";

// 사진을 원본 크기로 크게 보기 위한 라이트박스 — 배경 클릭 또는 닫기 버튼으로 닫힘
function PhotoLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 p-8"
    >
      <button type="button" onClick={onClose} className="absolute top-5 right-5 text-white/80 hover:text-white">
        <X className="h-6 w-6" />
      </button>
      <img src={src} alt="사진 크게 보기" className="max-h-full max-w-full rounded-lg object-contain shadow-2xl" />
    </div>
  );
}

// ───────────────────────── 기본정보 탭 ─────────────────────────

function CompanyBasicInfoTab({
  company,
  coTypeLabel,
  onSaved,
}: {
  company: CompanyListItem;
  coTypeLabel: (code: string) => string;
  onSaved: (updated: CompanyListItem) => void;
}) {
  const [name, setName] = useState(company.name);
  const [businessRegNo, setBusinessRegNo] = useState(company.businessRegNo);
  const [representativeName, setRepresentativeName] = useState(company.representativeName ?? "");
  const [contactName, setContactName] = useState(company.contactName ?? "");
  const [contactPhone, setContactPhone] = useState(company.contactPhone ?? "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [showSuspendForm, setShowSuspendForm] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [pendingResume, setPendingResume] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const updated = await updateCompany(company.id, {
        name: name.trim(),
        businessRegNo: businessRegNo.trim(),
        representativeName: representativeName.trim(),
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
      });
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmSuspend = async () => {
    if (!suspendReason.trim()) {
      setError("중지 사유를 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const updated = await updateCompany(company.id, { useYn: false, suspendReason: suspendReason.trim() });
      onSaved(updated);
      setShowSuspendForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "사용중지 처리에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmResume = async () => {
    setSubmitting(true);
    try {
      const updated = await updateCompany(company.id, { useYn: true });
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "재개 처리에 실패했습니다.");
    } finally {
      setSubmitting(false);
      setPendingResume(false);
    }
  };

  return (
    <div className="mx-auto max-w-[560px]">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelClass}>업체구분</label>
            <input value={coTypeLabel(company.coType)} disabled className={disabledInputClass} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>사업자번호</label>
            <input value={businessRegNo} onChange={(e) => setBusinessRegNo(e.target.value)} className={inputClass} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>업체명</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>대표자명</label>
          <input value={representativeName} onChange={(e) => setRepresentativeName(e.target.value)} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelClass}>담당자명</label>
            <input value={contactName} onChange={(e) => setContactName(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>담당자 연락처</label>
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="010-1234-5678"
              className={inputClass}
            />
          </div>
        </div>

        {company.suspendReason && !showSuspendForm && (
          <div className="space-y-1.5">
            <label className={labelClass}>중지 사유</label>
            <p className="rounded-lg border border-outline-variant/60 bg-surface-container-low px-3 py-2.5 text-[11px] text-on-surface-variant">{company.suspendReason}</p>
          </div>
        )}

        {showSuspendForm && (
          <div className="space-y-1.5">
            <label className={labelClass}>사용중지 사유</label>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="사용중지 사유를 입력하세요"
              rows={3}
              className={inputClass}
            />
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowSuspendForm(false)} className="rounded-lg bg-surface-container-high px-3 py-1.5 text-[11px] font-bold text-on-surface hover:bg-surface-dim">
                취소
              </button>
              <button
                type="button"
                onClick={confirmSuspend}
                disabled={submitting}
                className="rounded-lg bg-red-500 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-red-600 disabled:opacity-60"
              >
                중지 확정
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-[12px] font-semibold text-red-600">{error}</p>}

        <div className="flex items-center justify-between gap-2 border-t border-outline-variant/60 pt-4">
          {company.useYn ? (
            <button
              type="button"
              onClick={() => setShowSuspendForm(true)}
              disabled={showSuspendForm}
              className="rounded-lg bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition-all hover:bg-red-100 disabled:opacity-50"
            >
              사용중지
            </button>
          ) : (
            <button type="button" onClick={() => setPendingResume(true)} className="rounded-lg bg-primary/10 px-4 py-2 text-xs font-bold text-primary transition-all hover:bg-primary/20">
              재개
            </button>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? "저장 중..." : "저장"}
          </button>
        </div>
      </form>

      {pendingResume && (
        <ConfirmModal
          title="업체 재개"
          message="이 업체를 다시 정상 상태로 재개하시겠습니까?"
          confirmLabel="재개"
          onCancel={() => setPendingResume(false)}
          onConfirm={confirmResume}
        />
      )}
    </div>
  );
}

// ───────────────────────── 매장정보 탭(기본정보+사진+주소+카테고리) ─────────────────────────

function ShopInfoTab({ companyId, onError }: { companyId: number; onError: (message: string) => void }) {
  const [shop, setShop] = useState<CompanyShopDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [greeting, setGreeting] = useState("");
  const [intro, setIntro] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [address, setAddress] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessHours, setBusinessHours] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<CommonCodeDetailApi[]>([]);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingCase, setUploadingCase] = useState(false);
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);
  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const caseFileInputRef = useRef<HTMLInputElement>(null);
  const { open: openAddressSearch, modal: addressSearchModal } = useDaumPostcode();

  const load = () => {
    setLoading(true);
    getCompanyShop(companyId)
      .then((detail) => {
        setShop(detail);
        setGreeting(detail.greeting ?? "");
        setIntro(detail.intro ?? "");
        setZipCode(detail.zipCode ?? "");
        setAddress(detail.address ?? "");
        setAddressDetail(detail.addressDetail ?? "");
        setPhone(detail.phone ?? "");
        setBusinessHours(detail.businessHours ?? "");
        setSelectedCategories(detail.categories);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "매장 정보를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [companyId]);

  useEffect(() => {
    getGroup("CAR_INST")
      .then((g) => setAllCategories(g.details.filter((d) => d.useYn)))
      .catch((err) => onError(err instanceof Error ? err.message : "시공가능 카테고리를 불러오지 못했습니다."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchAddress = () => {
    openAddressSearch(
      (result) => {
        setZipCode(result.zonecode);
        setAddress(result.address);
      },
      (message) => setError(message),
    );
  };

  const toggleCategory = (detailCode: string) => {
    setSelectedCategories((prev) => (prev.includes(detailCode) ? prev.filter((c) => c !== detailCode) : [...prev, detailCode]));
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const updated = await updateCompanyShop(companyId, {
        greeting: greeting.trim(),
        intro: intro.trim(),
        zipCode: zipCode.trim(),
        address: address.trim(),
        addressDetail: addressDetail.trim(),
        phone: phone.trim(),
        businessHours: businessHours.trim(),
        categories: selectedCategories,
      });
      setShop(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "매장 정보 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const onMainFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingMain(true);
    try {
      const dataUri = await resizeImageToDataUri(file);
      setShop(await uploadCompanyShopPhoto(companyId, dataUri, "MAIN"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "대표사진 업로드에 실패했습니다.");
    } finally {
      setUploadingMain(false);
    }
  };

  const onCaseFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingCase(true);
    try {
      const dataUri = await resizeImageToDataUri(file);
      setShop(await uploadCompanyShopPhoto(companyId, dataUri, "CASE"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "소개 사진 업로드에 실패했습니다.");
    } finally {
      setUploadingCase(false);
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    try {
      setShop(await deleteCompanyShopPhoto(companyId, photoId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "사진 삭제에 실패했습니다.");
    }
  };

  if (loading) {
    return <p className="text-xs font-medium text-on-surface-variant">매장 정보를 불러오는 중...</p>;
  }
  if (!shop) {
    return <p className="text-xs font-medium text-red-600">{error || "매장 정보를 찾을 수 없습니다."}</p>;
  }

  const mainPhoto = shop.photos.find((p) => p.photoType === "MAIN") ?? null;
  const casePhotos = shop.photos.filter((p) => p.photoType === "CASE").sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="relative mx-auto max-w-[720px] space-y-6">
      <div className="space-y-2">
        <p className={labelClass}>대표 사진</p>
        <div className="flex items-center gap-4">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-outline-variant bg-surface-container-low">
            {mainPhoto ? (
              <img
                src={`${API_BASE_URL}/uploads/${mainPhoto.photoPath}`}
                alt="대표사진"
                onClick={() => setZoomedPhoto(`${API_BASE_URL}/uploads/${mainPhoto.photoPath}`)}
                className="h-full w-full cursor-zoom-in object-cover"
              />
            ) : (
              <ImageIcon className="h-6 w-6 text-outline" />
            )}
          </div>
          <button
            type="button"
            onClick={() => mainFileInputRef.current?.click()}
            disabled={uploadingMain}
            className="shrink-0 rounded-lg bg-surface-container-high px-3 py-1.5 text-[11px] font-bold whitespace-nowrap text-on-surface hover:bg-surface-dim disabled:opacity-60"
          >
            {uploadingMain ? "업로드 중..." : mainPhoto ? "사진 변경" : "사진 등록"}
          </button>
          <input ref={mainFileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onMainFileSelected} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className={labelClass}>소개 사진 ({casePhotos.length}/{MAX_CASE_PHOTOS})</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {casePhotos.map((photo) => (
            <div key={photo.id} className="relative h-20 w-20 overflow-hidden rounded-lg border border-outline-variant/60">
              <img
                src={`${API_BASE_URL}/uploads/${photo.photoPath}`}
                alt="소개사진"
                onClick={() => setZoomedPhoto(`${API_BASE_URL}/uploads/${photo.photoPath}`)}
                className="h-full w-full cursor-zoom-in object-cover"
              />
              <button
                type="button"
                onClick={() => handleDeletePhoto(photo.id)}
                className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {casePhotos.length < MAX_CASE_PHOTOS && (
            <button
              type="button"
              onClick={() => caseFileInputRef.current?.click()}
              disabled={uploadingCase}
              className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-outline-variant text-outline hover:border-primary hover:text-primary disabled:opacity-60"
            >
              <Plus className="h-5 w-5" />
            </button>
          )}
          <input ref={caseFileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onCaseFileSelected} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className={labelClass}>주소</label>
        <div className="flex gap-2">
          <input value={zipCode} disabled placeholder="우편번호" style={{ width: "96px" }} className={`${disabledInputClass} shrink-0`} />
          <button
            type="button"
            onClick={handleSearchAddress}
            className="shrink-0 rounded-lg border border-primary px-3 py-2 text-[11px] font-bold whitespace-nowrap text-primary hover:bg-primary/5"
          >
            주소 검색
          </button>
        </div>
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <input value={address} disabled className={disabledInputClass} />
          </div>
          <input
            value={addressDetail}
            onChange={(e) => setAddressDetail(e.target.value)}
            placeholder="상세주소"
            style={{ width: "180px" }}
            className={`${inputClass} shrink-0`}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className={labelClass}>전화번호</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="02-1234-5678" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>운영시간</label>
          <input value={businessHours} onChange={(e) => setBusinessHours(e.target.value)} placeholder="평일 09:00 ~ 19:00" className={inputClass} />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className={labelClass}>인사말</label>
        <textarea value={greeting} onChange={(e) => setGreeting(e.target.value)} rows={2} className={inputClass} />
      </div>
      <div className="space-y-1.5">
        <label className={labelClass}>소개</label>
        <textarea value={intro} onChange={(e) => setIntro(e.target.value)} rows={3} className={inputClass} />
      </div>

      <div className="space-y-2">
        <label className={labelClass}>시공가능 카테고리</label>
        <div className="flex flex-wrap gap-2">
          {allCategories.map((c) => {
            const active = selectedCategories.includes(c.detailCode);
            return (
              <button
                key={c.detailCode}
                type="button"
                onClick={() => toggleCategory(c.detailCode)}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all ${
                  active ? "border-primary bg-primary text-white" : "border-outline-variant text-on-surface-variant hover:border-primary/50"
                }`}
              >
                {c.detailName}
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="text-[12px] font-semibold text-red-600">{error}</p>}

      <div className="flex items-center justify-end gap-2 border-t border-outline-variant/60 pt-4">
        {saved && <span className="whitespace-nowrap text-[11px] font-semibold text-emerald-600">저장됨</span>}
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="shrink-0 rounded-lg bg-primary px-4 py-2 text-xs font-bold whitespace-nowrap text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? "저장 중..." : "매장정보 저장"}
        </button>
      </div>

      {addressSearchModal}
      {zoomedPhoto && <PhotoLightbox src={zoomedPhoto} onClose={() => setZoomedPhoto(null)} />}
    </div>
  );
}

// ───────────────────────── 예약가능시간 탭 ─────────────────────────

function TimeSlotsTab({ companyId }: { companyId: number }) {
  const [dayTypes, setDayTypes] = useState<CommonCodeDetailApi[]>([]);
  const [activeDayType, setActiveDayType] = useState("WEEKDAY");
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTime, setNewTime] = useState("");
  const [newCapacity, setNewCapacity] = useState(1);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getGroup("SHOP_DAY_TYPE")
      .then((g) => {
        const sorted = [...g.details].sort((a, b) => DAY_TYPE_ORDER.indexOf(a.detailCode) - DAY_TYPE_ORDER.indexOf(b.detailCode));
        setDayTypes(sorted);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "요일구분 목록을 불러오지 못했습니다."));
  }, []);

  useEffect(() => {
    setLoading(true);
    getCompanyTimeSlots(companyId, activeDayType)
      .then((rows) => setSlots([...rows].sort((a, b) => a.time.localeCompare(b.time))))
      .catch((err) => setError(err instanceof Error ? err.message : "시간대 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [companyId, activeDayType]);

  const addSlot = () => {
    if (!newTime) return;
    if (slots.some((s) => s.time === newTime)) {
      setError("이미 등록된 시간대입니다.");
      return;
    }
    setSlots((prev) => [...prev, { time: newTime, capacity: newCapacity }].sort((a, b) => a.time.localeCompare(b.time)));
    setNewTime("");
    setNewCapacity(1);
    setError("");
  };

  const removeSlot = (time: string) => {
    setSlots((prev) => prev.filter((s) => s.time !== time));
  };

  const updateCapacity = (time: string, capacity: number) => {
    setSlots((prev) => prev.map((s) => (s.time === time ? { ...s, capacity } : s)));
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await replaceCompanyTimeSlots(companyId, activeDayType, slots);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "시간대 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[560px] space-y-4">
      <div className="flex flex-wrap gap-2">
        {dayTypes.map((d) => (
          <button
            key={d.detailCode}
            type="button"
            onClick={() => setActiveDayType(d.detailCode)}
            className={`rounded-full border px-3.5 py-1.5 text-[11px] font-bold transition-all ${
              activeDayType === d.detailCode ? "border-primary bg-primary text-white" : "border-outline-variant text-on-surface-variant hover:border-primary/50"
            }`}
          >
            {d.detailName}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-xs font-medium text-on-surface-variant">불러오는 중...</p>
      ) : (
        <div className="space-y-2">
          {slots.length === 0 && (
            <p className="rounded-lg border border-outline-variant/60 bg-surface-container-low px-3 py-2.5 text-[11px] text-on-surface-variant">등록된 시간대가 없습니다.</p>
          )}
          {slots.map((slot) => (
            <div key={slot.time} className="flex items-center gap-3 rounded-lg border border-outline-variant/60 px-3 py-2">
              <span className="w-16 text-xs font-bold text-on-surface">{slot.time}</span>
              <input
                type="number"
                min={0}
                value={slot.capacity}
                onChange={(e) => updateCapacity(slot.time, Math.max(0, Number(e.target.value)))}
                style={{ width: "80px" }}
                className={`${inputClass} shrink-0`}
              />
              <span className="text-[11px] text-on-surface-variant">대</span>
              <button type="button" onClick={() => removeSlot(slot.time)} className="ml-auto text-outline hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 rounded-lg border border-dashed border-outline-variant px-3 py-2.5">
        <select value={newTime} onChange={(e) => setNewTime(e.target.value)} style={{ width: "112px" }} className={`${inputClass} shrink-0`}>
          <option value="">시간 선택</option>
          {FIXED_TIME_OPTIONS.filter((t) => !slots.some((s) => s.time === t)).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={0}
          value={newCapacity}
          onChange={(e) => setNewCapacity(Math.max(0, Number(e.target.value)))}
          style={{ width: "80px" }}
          className={`${inputClass} shrink-0`}
        />
        <span className="shrink-0 text-[11px] text-on-surface-variant">대</span>
        <button
          type="button"
          onClick={addSlot}
          disabled={!newTime}
          className="ml-auto flex shrink-0 items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-[11px] font-bold whitespace-nowrap text-primary hover:bg-primary/20 disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          시간대 추가
        </button>
      </div>

      {error && <p className="text-[12px] font-semibold text-red-600">{error}</p>}

      <div className="flex items-center justify-end gap-2 border-t border-outline-variant/60 pt-4">
        {saved && <span className="whitespace-nowrap text-[11px] font-semibold text-emerald-600">저장됨</span>}
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="shrink-0 rounded-lg bg-primary px-4 py-2 text-xs font-bold whitespace-nowrap text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? "저장 중..." : "이 요일구분 저장"}
        </button>
      </div>
    </div>
  );
}

// ───────────────────────── 휴무일 탭 ─────────────────────────

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function HolidaysTab({ companyId }: { companyId: number }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [holidays, setHolidays] = useState<Set<string>>(new Set());
  const [originalHolidays, setOriginalHolidays] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    listCompanyHolidays(companyId, year, month)
      .then((dates) => {
        const set = new Set(dates);
        setHolidays(set);
        setOriginalHolidays(set);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "휴무일을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [companyId, year, month]);

  const changeMonth = (delta: number) => {
    let nextMonth = month + delta;
    let nextYear = year;
    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    } else if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    setYear(nextYear);
    setMonth(nextMonth);
  };

  const toggleDate = (dateKey: string) => {
    setHolidays((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) next.delete(dateKey);
      else next.add(dateKey);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const toAdd = [...holidays].filter((d) => !originalHolidays.has(d));
      const toRemove = [...originalHolidays].filter((d) => !holidays.has(d));
      if (toAdd.length > 0) await addCompanyHolidays(companyId, toAdd);
      for (const date of toRemove) await removeCompanyHoliday(companyId, date);
      setOriginalHolidays(new Set(holidays));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "휴무일 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div className="mx-auto max-w-[480px] space-y-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => changeMonth(-1)} className="rounded-lg p-1.5 hover:bg-surface-container-low">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-bold text-secondary">
          {year}년 {month}월
        </span>
        <button type="button" onClick={() => changeMonth(1)} className="rounded-lg p-1.5 hover:bg-surface-container-low">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <p className="text-xs font-medium text-on-surface-variant">불러오는 중...</p>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1 text-center">
            {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
              <div key={d} className="py-1 text-[11px] font-bold text-on-surface-variant">
                {d}
              </div>
            ))}
            {cells.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} />;
              const dateKey = toDateKey(year, month, day);
              const isHoliday = holidays.has(dateKey);
              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => toggleDate(dateKey)}
                  className={`aspect-square rounded-lg text-xs font-semibold transition-all ${
                    isHoliday ? "bg-red-500 text-white" : "text-on-surface hover:bg-surface-container-low"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {holidays.size > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {[...holidays]
                .sort()
                .map((d) => (
                  <span key={d} className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600">
                    {d}
                    <button type="button" onClick={() => toggleDate(d)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
            </div>
          )}
        </>
      )}

      {error && <p className="text-[12px] font-semibold text-red-600">{error}</p>}

      <div className="flex items-center justify-end gap-2 border-t border-outline-variant/60 pt-4">
        {saved && <span className="whitespace-nowrap text-[11px] font-semibold text-emerald-600">저장됨</span>}
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="shrink-0 rounded-lg bg-primary px-4 py-2 text-xs font-bold whitespace-nowrap text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? "저장 중..." : "휴무일 저장"}
        </button>
      </div>
    </div>
  );
}

// ───────────────────────── 일별슬롯 탭 ─────────────────────────

function DailySlotsTab({ companyId }: { companyId: number }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [schedule, setSchedule] = useState<DailySchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingCapacity, setPendingCapacity] = useState<Record<string, string>>({});

  const load = () => {
    setLoading(true);
    getCompanyDailySchedule(companyId, date)
      .then(setSchedule)
      .catch((err) => setError(err instanceof Error ? err.message : "일별 스케줄을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [companyId, date]);

  const applyCapacity = async (time: string) => {
    const raw = pendingCapacity[time];
    if (raw === undefined) return;
    const capacity = Math.max(0, Number(raw));
    try {
      await upsertCompanyDailySlot(companyId, { date, time, capacity });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "정원 변경에 실패했습니다.");
    }
  };

  const toggleLock = async (time: string, isLocked: boolean) => {
    try {
      await upsertCompanyDailySlot(companyId, { date, time, isLocked: !isLocked });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "잠금 상태 변경에 실패했습니다.");
    }
  };

  return (
    <div className="mx-auto max-w-[600px] space-y-4">
      <div className="flex items-center gap-3">
        <label className={labelClass}>날짜</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: "160px" }} className={`${inputClass} shrink-0`} />
        {schedule?.isHoliday && <span className="text-[11px] font-bold text-red-500">휴무일</span>}
      </div>

      {error && <p className="text-[12px] font-semibold text-red-600">{error}</p>}

      {loading ? (
        <p className="text-xs font-medium text-on-surface-variant">불러오는 중...</p>
      ) : !schedule || schedule.slots.length === 0 ? (
        <p className="rounded-lg border border-outline-variant/60 bg-surface-container-low px-3 py-2.5 text-[11px] text-on-surface-variant">
          해당 날짜에 등록된 시간대가 없습니다(예약가능시간 탭에서 요일구분별 템플릿을 먼저 등록하세요).
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-outline-variant/60">
          <table className="w-full text-[11px]">
            <thead className="bg-surface-container-low">
              <tr>
                <th className="px-3 py-2 text-left font-bold text-on-surface-variant">시간</th>
                <th className="px-3 py-2 text-left font-bold text-on-surface-variant">정원</th>
                <th className="px-3 py-2 text-left font-bold text-on-surface-variant">예약</th>
                <th className="px-3 py-2 text-center font-bold text-on-surface-variant">잠금</th>
              </tr>
            </thead>
            <tbody>
              {schedule.slots.map((slot) => (
                <tr key={slot.time} className="border-t border-outline-variant/60">
                  <td className="px-3 py-2 font-bold text-on-surface">{slot.time}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        value={pendingCapacity[slot.time] ?? slot.capacity ?? 0}
                        onChange={(e) => setPendingCapacity((prev) => ({ ...prev, [slot.time]: e.target.value }))}
                        disabled={slot.isLocked}
                        style={{ width: "64px" }}
                        className={`${inputClass} shrink-0 disabled:cursor-not-allowed disabled:opacity-50`}
                      />
                      <button
                        type="button"
                        onClick={() => applyCapacity(slot.time)}
                        disabled={slot.isLocked}
                        className="rounded-lg bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary hover:bg-primary/20 disabled:opacity-40"
                      >
                        적용
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-on-surface">
                    {slot.reservedCount > 0 ? `${slot.reservedCount}건 (${slot.reservations.map((r) => r.customerName).join(", ")})` : "-"}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => toggleLock(slot.time, slot.isLocked)}
                      disabled={slot.reservedCount > 0 && !slot.isLocked}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition-all ${
                        slot.isLocked ? "bg-red-50 text-red-500" : "bg-surface-container-low text-on-surface-variant"
                      } disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      {slot.isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                      {slot.isLocked ? "잠김" : "열림"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[11px] text-on-surface-variant">정원·잠금 변경은 즉시 반영됩니다(별도 저장 불필요).</p>
    </div>
  );
}

// ───────────────────────── 소속 사용자 계정 탭 ─────────────────────────

function PartnerUserFormModal({
  companyId,
  existing,
  onCancel,
  onCreated,
  onUpdated,
}: {
  companyId: number;
  existing: PartnerUserListItem | null;
  onCancel: () => void;
  onCreated: (user: PartnerUserListItem, tempPassword: string) => void;
  onUpdated: (user: PartnerUserListItem) => void;
}) {
  const [username, setUsername] = useState(existing?.username ?? "");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [checkedUsername, setCheckedUsername] = useState("");
  const [name, setName] = useState(existing?.name ?? "");
  const [email, setEmail] = useState(existing?.email ?? "");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleUsernameChange = (v: string) => {
    setUsername(v);
    setUsernameStatus("idle");
  };

  const handleCheckUsername = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setError("아이디를 입력해주세요.");
      return;
    }
    setUsernameStatus("checking");
    setError("");
    try {
      const { available } = await checkPartnerUsernameAvailable(companyId, trimmed);
      setUsernameStatus(available ? "available" : "taken");
      setCheckedUsername(trimmed);
    } catch (err) {
      setUsernameStatus("idle");
      setError(err instanceof Error ? err.message : "중복 확인에 실패했습니다.");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim() || (!existing && !username.trim())) {
      setError("모든 필드를 입력해주세요.");
      return;
    }
    if (!existing && (usernameStatus !== "available" || checkedUsername !== username.trim())) {
      setError("아이디 중복확인을 완료해주세요.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      if (existing) {
        const updated = await updatePartnerUser(companyId, existing.id, {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
        });
        onUpdated(updated);
      } else {
        const { user, tempPassword } = await createPartnerUser(companyId, {
          username: username.trim(),
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
        });
        onCreated(user, tempPassword);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="w-full max-w-[360px] rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-bold text-secondary">{existing ? "사용자 계정 수정" : "사용자 계정 추가"}</h3>
          <button type="button" onClick={onCancel} className="text-outline hover:text-on-surface">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <label className={labelClass}>아이디</label>
            {existing ? (
              <input value={username} disabled className={disabledInputClass} />
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="로그인 아이디를 입력하세요"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={handleCheckUsername}
                    disabled={usernameStatus === "checking" || !username.trim()}
                    className="shrink-0 rounded-lg border border-primary px-3 py-2 text-[11px] font-bold whitespace-nowrap text-primary transition-all hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {usernameStatus === "checking" ? "확인 중..." : "중복확인"}
                  </button>
                </div>
                {usernameStatus === "available" && checkedUsername === username.trim() && (
                  <p className="text-[11px] font-semibold text-emerald-600">사용 가능한 아이디입니다.</p>
                )}
                {usernameStatus === "taken" && checkedUsername === username.trim() && (
                  <p className="text-[11px] font-semibold text-red-600">이미 사용 중인 아이디입니다.</p>
                )}
              </>
            )}
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>이름</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>이메일</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>휴대폰번호</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-1234-5678" className={inputClass} />
          </div>
          {error && <p className="text-[12px] font-semibold text-red-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg bg-surface-container-high px-4 py-2 text-xs font-bold text-on-surface transition-all hover:bg-surface-dim">
            취소
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? "저장 중..." : existing ? "저장" : "추가"}
          </button>
        </div>
      </form>
    </div>
  );
}

function IssuedPasswordBox({ username, tempPassword, onClose }: { username: string; tempPassword: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[320px] rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="mb-2 text-base font-bold text-secondary">임시 비밀번호 발급</h3>
        <p className="mb-4 text-xs font-medium text-on-surface-variant">
          <span className="font-bold text-on-surface">{username}</span> 계정이 등록되었습니다.
        </p>
        <div className="mb-6 flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3">
          <span className="font-mono text-sm font-bold tracking-widest text-secondary">{tempPassword}</span>
          <button type="button" onClick={copy} className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline">
            <Copy className="h-3.5 w-3.5" />
            {copied ? "복사됨" : "복사"}
          </button>
        </div>
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90">
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

function PartnerUsersTab({ companyId }: { companyId: number }) {
  const [users, setUsers] = useState<PartnerUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formTarget, setFormTarget] = useState<{ mode: "add" } | { mode: "edit"; user: PartnerUserListItem } | null>(null);
  const [issued, setIssued] = useState<{ username: string; tempPassword: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PartnerUserListItem | null>(null);

  const load = () => {
    setLoading(true);
    listPartnerUsers(companyId)
      .then(setUsers)
      .catch((err) => setError(err instanceof Error ? err.message : "소속 사용자 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [companyId]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deletePartnerUser(companyId, pendingDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
      setPendingDelete(null);
    }
  };

  return (
    <div className="mx-auto max-w-[640px] space-y-2">
      <div className="flex items-center justify-between">
        <p className={labelClass}>소속 사용자 계정</p>
        <button
          type="button"
          onClick={() => setFormTarget({ mode: "add" })}
          className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary transition-all hover:bg-primary/20"
        >
          <Plus className="h-3 w-3" />
          계정 추가
        </button>
      </div>

      {loading ? (
        <p className="text-[11px] font-medium text-on-surface-variant">불러오는 중...</p>
      ) : error ? (
        <p className="text-[11px] font-semibold text-red-600">{error}</p>
      ) : users.length === 0 ? (
        <p className="rounded-lg border border-outline-variant/60 bg-surface-container-low px-3 py-2.5 text-[11px] text-on-surface-variant">등록된 사용자 계정이 없습니다.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-outline-variant/60">
          <table className="w-full text-[11px]">
            <thead className="bg-surface-container-low">
              <tr>
                <th className="px-3 py-2 text-left font-bold text-on-surface-variant">아이디</th>
                <th className="px-3 py-2 text-left font-bold text-on-surface-variant">이름</th>
                <th className="px-3 py-2 text-left font-bold text-on-surface-variant">상태</th>
                <th className="px-3 py-2 text-center font-bold text-on-surface-variant">관리</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-outline-variant/60">
                  <td className="px-3 py-2 text-on-surface">{u.username}</td>
                  <td className="px-3 py-2 text-on-surface">{u.name}</td>
                  <td className="px-3 py-2 text-on-surface">{statusText(u.useYn, "활성", "비활성")}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-2">
                      <button type="button" onClick={() => setFormTarget({ mode: "edit", user: u })} className="text-outline hover:text-primary">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => setPendingDelete(u)} className="text-outline hover:text-red-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formTarget && (
        <PartnerUserFormModal
          companyId={companyId}
          existing={formTarget.mode === "edit" ? formTarget.user : null}
          onCancel={() => setFormTarget(null)}
          onCreated={(user, tempPassword) => {
            setUsers((prev) => [...prev, user]);
            setFormTarget(null);
            setIssued({ username: user.username, tempPassword });
          }}
          onUpdated={(user) => {
            setUsers((prev) => prev.map((u) => (u.id === user.id ? user : u)));
            setFormTarget(null);
          }}
        />
      )}
      {issued && <IssuedPasswordBox username={issued.username} tempPassword={issued.tempPassword} onClose={() => setIssued(null)} />}
      {pendingDelete && (
        <ConfirmModal
          title="사용자 계정 삭제"
          message={`'${pendingDelete.name}(${pendingDelete.username})' 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
          confirmLabel="삭제"
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

// ───────────────────────── 메인 모달 ─────────────────────────

export default function CompanyDetailModal({
  company,
  coTypeLabel,
  onCancel,
  onSaved,
}: {
  company: CompanyListItem;
  coTypeLabel: (code: string) => string;
  onCancel: () => void;
  onSaved: (updated: CompanyListItem) => void;
}) {
  const [activeTab, setActiveTab] = useState<DetailTab>("basic");
  const [globalError, setGlobalError] = useState("");

  const isShop = company.coType === "SHOP";

  const tabs = useMemo(() => {
    const base: { key: DetailTab; label: string }[] = [{ key: "basic", label: "기본정보" }];
    if (isShop) {
      base.push(
        { key: "shop", label: "매장정보" },
        { key: "timeSlots", label: "예약가능시간" },
        { key: "holidays", label: "휴무일" },
        { key: "dailySlots", label: "일별슬롯" },
        { key: "users", label: "소속 사용자 계정" },
      );
    }
    return base;
  }, [isShop]);

  useEffect(() => {
    if (!globalError) return;
    const t = setTimeout(() => setGlobalError(""), 3200);
    return () => clearTimeout(t);
  }, [globalError]);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
      <div className="flex h-full max-h-[92vh] w-full max-w-[1100px] flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-outline-variant/60 px-6 py-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-secondary">{company.name}</h3>
            <span className="text-xs font-bold text-on-surface-variant">{statusText(company.useYn)}</span>
          </div>
          <button type="button" onClick={onCancel} className="text-outline hover:text-on-surface">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-outline-variant/60 px-6 pt-3">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`shrink-0 rounded-t-lg px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === t.key ? "bg-surface-container-low text-primary" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {activeTab === "basic" && <CompanyBasicInfoTab company={company} coTypeLabel={coTypeLabel} onSaved={onSaved} />}
          {activeTab === "shop" && isShop && <ShopInfoTab companyId={company.id} onError={setGlobalError} />}
          {activeTab === "timeSlots" && isShop && <TimeSlotsTab companyId={company.id} />}
          {activeTab === "holidays" && isShop && <HolidaysTab companyId={company.id} />}
          {activeTab === "dailySlots" && isShop && <DailySlotsTab companyId={company.id} />}
          {activeTab === "users" && isShop && <PartnerUsersTab companyId={company.id} />}
        </div>
      </div>

      {globalError && (
        <div className="fixed right-6 bottom-6 z-[1100] rounded-lg bg-red-600 px-4 py-3 text-xs font-bold text-white shadow-xl">{globalError}</div>
      )}
    </div>
  );
}
