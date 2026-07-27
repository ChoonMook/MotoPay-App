// CU-RSVC-17: 후기 작성(팝업) - 인수 확인 후 시공업체 평점(1~5)·텍스트·사진 후기 작성
// 신차패키지·예약시공·쇼핑몰 등 여러 채널에서 공통으로 쓰는 화면
// 사진 첨부: 모토페이 앱(웹뷰) 안에서는 네이티브 카메라·앨범 브릿지, 일반 브라우저(PC 등)에서는 파일 선택 input 사용
import { useRef } from "react";
import BottomSheet from "../../components/ui/BottomSheet";
import Button from "../../components/ui/Button";
import { CloseIcon, StarBigIcon, PlusIcon } from "./commonIcons";
import { isNativeBridgeAvailable, captureFromCamera, pickFromLibrary } from "../../native/bridge";

const REVIEW_LABELS = ["별점을 선택해주세요", "별로예요", "아쉬워요", "보통이에요", "좋아요", "최고예요"];
const MAX_PHOTOS = 5;

function CameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

function RemoveBadge() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

interface ReviewWriteScreenProps {
  selName: string;
  reviewStar: number;
  reviewText: string;
  photos: string[];
  onSelectStar: (n: number) => void;
  onTextChange: (value: string) => void;
  onAddPhoto: (dataUri: string) => void;
  onRemovePhoto: (index: number) => void;
  onClose: () => void;
  onSubmit: () => void;
  title?: string;
  question?: string;
  placeholder?: string;
  ctaLabel?: string;
  onError?: (message: string) => void;
}

export default function ReviewWriteScreen({
  selName,
  reviewStar,
  reviewText,
  photos,
  onSelectStar,
  onTextChange,
  onAddPhoto,
  onRemovePhoto,
  onClose,
  onSubmit,
  title = "후기 작성",
  question = `${selName} 시공은 어떠셨나요?`,
  placeholder = "시공 품질, 응대, 소요 시간 등 경험을 남겨주세요",
  ctaLabel = "후기 등록하기",
  onError,
}: ReviewWriteScreenProps) {
  const reviewOk = reviewStar > 0;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isNative = isNativeBridgeAvailable();
  const canAddMore = photos.length < MAX_PHOTOS;

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onAddPhoto(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const onTapCamera = async () => {
    try {
      const { base64, mimeType } = await captureFromCamera();
      onAddPhoto(`data:${mimeType};base64,${base64}`);
    } catch (err) {
      if (err instanceof Error) onError?.(err.message);
    }
  };

  const onTapGallery = async () => {
    try {
      const { base64, mimeType } = await pickFromLibrary();
      onAddPhoto(`data:${mimeType};base64,${base64}`);
    } catch (err) {
      if (err instanceof Error) onError?.(err.message);
    }
  };

  return (
    <BottomSheet onClose={onClose}>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-lg font-extrabold text-gray-900">{title}</span>
        <span onClick={onClose} className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center text-gray-500">
          <CloseIcon />
        </span>
      </div>
      <div className="mb-[18px] text-[12.5px] text-gray-600">{question}</div>

      <div className="mb-1.5 flex justify-center gap-2.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} onClick={() => onSelectStar(n)} className="cursor-pointer" style={{ color: n <= reviewStar ? "var(--color-accent)" : "var(--gray-200)" }}>
            <StarBigIcon color={n <= reviewStar ? "var(--color-accent)" : "var(--gray-200)"} />
          </span>
        ))}
      </div>
      <div className="mb-4 text-center text-[13px] font-bold text-brand">{REVIEW_LABELS[reviewStar] || REVIEW_LABELS[0]}</div>

      <textarea
        value={reviewText}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-24 w-full resize-none rounded-xl border border-gray-400 bg-white px-3.5 py-[13px] text-[13.5px] leading-relaxed text-gray-900 outline-none placeholder:text-gray-400"
      />

      {photos.length > 0 && (
        <div className="mp-scroll mt-3 flex gap-2 overflow-x-auto">
          {photos.map((src, i) => (
            <span key={i} className="relative h-16 w-16 flex-none overflow-hidden rounded-xl bg-gray-100">
              <img src={src} alt={`첨부 사진 ${i + 1}`} className="h-full w-full object-cover" />
              <span
                onClick={() => onRemovePhoto(i)}
                className="absolute top-1 right-1 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-black/60"
              >
                <RemoveBadge />
              </span>
            </span>
          ))}
        </div>
      )}

      {canAddMore &&
        (isNative ? (
          <div className="mt-3 flex items-center gap-2">
            <span
              onClick={onTapCamera}
              className="flex h-16 w-16 flex-none cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] border-dashed border-gray-400 text-gray-500"
            >
              <CameraIcon />
              <span className="text-[9.5px] font-semibold">촬영</span>
            </span>
            <span
              onClick={onTapGallery}
              className="flex h-16 w-16 flex-none cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] border-dashed border-gray-400 text-gray-500"
            >
              <GalleryIcon />
              <span className="text-[9.5px] font-semibold">앨범</span>
            </span>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2">
            <span
              onClick={() => fileInputRef.current?.click()}
              className="flex h-16 w-16 flex-none cursor-pointer items-center justify-center rounded-xl border-[1.5px] border-dashed border-gray-400 text-gray-500"
            >
              <PlusIcon />
            </span>
            <span className="text-xs text-gray-500">사진 첨부 · 선택</span>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileSelected} />
          </div>
        ))}

      <div className="mt-[18px]">
        <Button disabled={!reviewOk} onClick={onSubmit}>
          {reviewOk ? ctaLabel : "별점을 선택하세요"}
        </Button>
      </div>
    </BottomSheet>
  );
}
