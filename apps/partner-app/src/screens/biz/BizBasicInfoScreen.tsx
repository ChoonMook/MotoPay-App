// PT-PROF-02: 기본정보 관리 - 대표사진·소개사진·소개글·인사말·주소·전화번호·운영시간·시공가능 카테고리 수정
import { useEffect, useRef, useState } from "react";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Button from "../../components/ui/Button";
import { API_BASE_URL } from "../../api/config";
import { getCommonCodeDetails, type CommonCodeDetailApi } from "../../api/commonCodes";
import { deleteShopPhoto, updateMyShop, uploadShopPhoto, type MyShop } from "../../api/shops";
import { useDaumPostcode } from "../../hooks/useDaumPostcode";
import { BackIcon } from "./bizIcons";

const MAX_CASE_PHOTOS = 10;
const MAX_IMAGE_DIMENSION = 1600; // 이 크기를 넘는 변은 축소(가로세로 비율 유지)
const IMAGE_JPEG_QUALITY = 0.82;

// 폰 카메라 원본(수 MB~십수 MB)을 그대로 base64로 올리면 요청이 너무 커지므로,
// 캔버스로 긴 변 기준 축소 + JPEG 압축해서 업로드 용량을 줄인다
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

interface BizBasicInfoScreenProps {
  shop: MyShop;
  onBack: () => void;
  onSaved: (shop: MyShop) => void;
  onError: (message: string) => void;
}

export default function BizBasicInfoScreen({ shop, onBack, onSaved, onError }: BizBasicInfoScreenProps) {
  const [intro, setIntro] = useState(shop.intro ?? "");
  const [greeting, setGreeting] = useState(shop.greeting ?? "");
  const [zipCode, setZipCode] = useState(shop.zipCode ?? "");
  const [address, setAddress] = useState(shop.address ?? "");
  const [addressDetail, setAddressDetail] = useState(shop.addressDetail ?? "");
  const [latitude, setLatitude] = useState<number | null>(shop.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(shop.longitude ?? null);
  const [phone, setPhone] = useState(shop.phone ?? "");
  const [businessHours, setBusinessHours] = useState(shop.businessHours ?? "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(shop.categories);
  const [allCategories, setAllCategories] = useState<CommonCodeDetailApi[]>([]);
  const [saving, setSaving] = useState(false);
  const [basicSaved, setBasicSaved] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingCase, setUploadingCase] = useState(false);
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);
  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const caseFileInputRef = useRef<HTMLInputElement>(null);
  const { open: openAddressSearch, modal: addressSearchModal } = useDaumPostcode();

  const mainPhoto = shop.photos.find((p) => p.photoType === "MAIN") ?? null;
  const casePhotos = shop.photos.filter((p) => p.photoType === "CASE").sort((a, b) => a.sortOrder - b.sortOrder);

  useEffect(() => {
    getCommonCodeDetails("CAR_INST")
      .then(setAllCategories)
      .catch((err) => onError(err instanceof Error ? err.message : "시공가능 카테고리를 불러오지 못했어요"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchAddress = () => {
    openAddressSearch(
      (result) => {
        setZipCode(result.zonecode);
        setAddress(result.address);
        setLatitude(null);
        setLongitude(null);
      },
      (message) => onError(message),
    );
  };

  const toggleCategory = (detailCode: string) => {
    setSelectedCategories((prev) =>
      prev.includes(detailCode) ? prev.filter((c) => c !== detailCode) : [...prev, detailCode],
    );
  };

  const onMainFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingMain(true);
    try {
      const dataUri = await resizeImageToDataUri(file);
      onSaved(await uploadShopPhoto(dataUri, "MAIN"));
    } catch (err) {
      onError(err instanceof Error ? err.message : "대표사진 업로드에 실패했습니다");
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
      onSaved(await uploadShopPhoto(dataUri, "CASE"));
    } catch (err) {
      onError(err instanceof Error ? err.message : "소개 사진 업로드에 실패했습니다");
    } finally {
      setUploadingCase(false);
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    try {
      onSaved(await deleteShopPhoto(photoId));
    } catch (err) {
      onError(err instanceof Error ? err.message : "사진 삭제에 실패했습니다");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateMyShop({
        intro,
        greeting,
        zipCode,
        address,
        addressDetail,
        latitude,
        longitude,
        phone,
        businessHours,
        categories: selectedCategories,
      });
      setBasicSaved(true);
      onSaved(updated);
    } catch (err) {
      onError(err instanceof Error ? err.message : "저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-gray-50">
      {/* top app bar (sub) */}
      <div className="absolute inset-x-0 top-[46px] z-50 flex h-[52px] items-center gap-1.5 border-b border-gray-100 bg-white px-1.5">
        <span onClick={onBack} className="inline-flex cursor-pointer p-2.5 text-gray-800">
          <BackIcon />
        </span>
        <span className="text-[17px] font-extrabold tracking-tight text-gray-900">기본정보 관리</span>
      </div>

      <div
        className="mp-scroll absolute inset-x-0 top-[98px] bottom-0 overflow-y-auto px-5 pt-5 pb-[120px]"
        style={{ animation: "mp-screen .32s ease" }}
      >
        {basicSaved && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-brand-subtle px-3.5 py-2.5">
            <span className="text-[12.5px] font-bold text-brand">
              승인대기 중이에요 · 관리자 승인 후 고객앱에 반영돼요
            </span>
          </div>
        )}

        <div className="mb-2 text-[13px] font-extrabold tracking-[0.02em] text-gray-500">대표사진</div>
        <div
          onClick={() => {
            if (mainPhoto) {
              setViewingPhotoUrl(`${API_BASE_URL}/uploads/${mainPhoto.photoPath}`);
            } else if (!uploadingMain) {
              mainFileInputRef.current?.click();
            }
          }}
          className="relative mb-5 flex h-40 w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-gray-100 text-sm text-gray-400"
        >
          {mainPhoto ? (
            <img
              src={`${API_BASE_URL}/uploads/${mainPhoto.photoPath}`}
              alt="대표사진"
              className="h-full w-full object-cover"
            />
          ) : (
            <span>{uploadingMain ? "업로드 중..." : "대표사진 등록"}</span>
          )}
          {mainPhoto && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!uploadingMain) mainFileInputRef.current?.click();
              }}
              className="absolute right-2 bottom-2 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white"
            >
              {uploadingMain ? "업로드 중..." : "변경"}
            </button>
          )}
          {mainPhoto && uploadingMain && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm text-white">
              업로드 중...
            </div>
          )}
        </div>
        <input
          ref={mainFileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onMainFileSelected}
        />

        <div className="mb-2 text-[13px] font-extrabold tracking-[0.02em] text-gray-500">
          소개 사진 <span className="font-semibold text-gray-500">(최대 {MAX_CASE_PHOTOS}장)</span>
        </div>
        <div className="mb-5 grid grid-cols-4 gap-2">
          {casePhotos.map((photo) => (
            <div key={photo.id} className="relative h-[74px] overflow-hidden rounded-[10px] bg-gray-100">
              <img
                src={`${API_BASE_URL}/uploads/${photo.photoPath}`}
                alt="소개 사진"
                className="h-full w-full cursor-pointer object-cover"
                onClick={() => setViewingPhotoUrl(`${API_BASE_URL}/uploads/${photo.photoPath}`)}
              />
              <button
                type="button"
                onClick={() => handleDeletePhoto(photo.id)}
                aria-label="사진 삭제"
                className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-[11px] leading-none text-white"
              >
                ×
              </button>
            </div>
          ))}
          {casePhotos.length < MAX_CASE_PHOTOS && (
            <div
              onClick={() => !uploadingCase && caseFileInputRef.current?.click()}
              className="flex h-[74px] cursor-pointer items-center justify-center rounded-[10px] bg-gray-100 text-[11px] text-gray-400"
            >
              {uploadingCase ? "업로드 중..." : "+ 사진 추가"}
            </div>
          )}
        </div>
        <input
          ref={caseFileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onCaseFileSelected}
        />

        <div className="mb-4 flex flex-col gap-4">
          <Textarea
            label="소개글"
            placeholder="고객에게 보여줄 업체 소개를 입력하세요"
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
          />
          <Textarea
            label="인사말"
            placeholder="고객에게 전할 인사말을 입력하세요"
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <div className="mb-2 text-sm font-semibold">주소</div>
          <div className="mb-2 flex gap-2">
            <div className="flex-1">
              <Input value={address} disabled placeholder="주소 검색" />
            </div>
            <Button variant="secondary" size="lg" fullWidth={false} onClick={handleSearchAddress}>
              검색
            </Button>
          </div>
          <Input placeholder="상세주소" value={addressDetail} onChange={(e) => setAddressDetail(e.target.value)} />
        </div>

        <div className="mb-5">
          <Input label="대표 전화번호" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <div className="mb-5">
          <Input
            label="운영시간"
            placeholder="예) 평일 09:00 ~ 19:00, 토/일 휴무"
            value={businessHours}
            onChange={(e) => setBusinessHours(e.target.value)}
          />
        </div>

        <div className="mb-2 text-[13px] font-extrabold tracking-[0.02em] text-gray-500">
          시공 가능 카테고리 <span className="font-semibold text-gray-500">(중복 선택)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {allCategories.map((c) => {
            const on = selectedCategories.includes(c.detailCode);
            return (
              <span
                key={c.detailCode}
                onClick={() => toggleCategory(c.detailCode)}
                className={`cursor-pointer rounded-full px-3.5 py-[7px] text-[13px] font-bold ${
                  on ? "bg-brand text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {c.detailName}
              </span>
            );
          })}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-[55] border-t border-gray-100 bg-white px-5 pt-3.5 pb-[22px]">
        <Button disabled={saving} onClick={handleSave}>
          {saving ? "저장 중..." : "저장"}
        </Button>
      </div>

      {addressSearchModal}

      {viewingPhotoUrl && (
        <div className="absolute inset-0 z-[90] bg-black">
          <div className="absolute inset-x-0 top-[46px] z-10 flex h-[52px] items-center justify-end px-4">
            <button
              type="button"
              onClick={() => setViewingPhotoUrl(null)}
              className="p-2 text-sm font-semibold text-white"
            >
              닫기
            </button>
          </div>
          <div className="absolute inset-0 flex items-center justify-center" onClick={() => setViewingPhotoUrl(null)}>
            <img
              src={viewingPhotoUrl}
              alt="사진 크게 보기"
              className="max-h-full max-w-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
