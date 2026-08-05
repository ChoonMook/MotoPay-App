// 시공완료 등록 화면(신차패키지 NcpkDoneScreen·예약시공 RsvcDoneScreen)이 공유하는 "시공 사진" 섹션.
// 두 화면이 항상 동일하게 동작하도록 공용 컴포넌트로 분리했다.
// 파트너센터도 customer-mobile의 웹뷰 셸에 그대로 로드되므로 apps/customer-app과 동일한 네이티브 브릿지
// (window.MotoBridge, ReviewWriteScreen.tsx와 동일 패턴)를 우선 사용한다 — 브라우저 기본 <input type="file">의
// 파일선택창은 이 웹뷰에서 아예 뜨지 않는 문제가 있어(실기기·에뮬레이터 모두 재현) 브릿지가 없을 때만
// (일반 브라우저로 직접 접속한 경우) input 방식으로 대체한다
import { useRef } from "react";
import { isNativeBridgeAvailable, captureFromCamera, pickFromLibrary } from "../../native/bridge";

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

interface PhotoUploadGridProps {
  photos: string[];
  maxPhotos?: number;
  onAddPhoto: (dataUri: string) => void;
  onRemovePhoto: (index: number) => void;
  onViewPhoto: (dataUri: string) => void;
  onError: (message: string) => void;
}

export default function PhotoUploadGrid({ photos, maxPhotos = 10, onAddPhoto, onRemovePhoto, onViewPhoto, onError }: PhotoUploadGridProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const canAddMore = photos.length < maxPhotos;
  const isNative = isNativeBridgeAvailable();

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      onAddPhoto(await resizeImageToDataUri(file));
    } catch (err) {
      onError(err instanceof Error ? err.message : "사진을 처리하지 못했습니다");
    }
  };

  const onTapCamera = async () => {
    try {
      const { base64, mimeType } = await captureFromCamera();
      onAddPhoto(`data:${mimeType};base64,${base64}`);
    } catch (err) {
      if (err instanceof Error) onError(err.message);
    }
  };

  const onTapGallery = async () => {
    try {
      const { base64, mimeType } = await pickFromLibrary();
      onAddPhoto(`data:${mimeType};base64,${base64}`);
    } catch (err) {
      if (err instanceof Error) onError(err.message);
    }
  };

  return (
    <>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[15px] font-extrabold text-gray-900">시공 사진</span>
        <span className="text-[12.5px] tabular-nums text-gray-500">
          {photos.length}/{maxPhotos}
        </span>
      </div>
      <div className="mb-6 text-[12.5px] text-gray-600">고객 인수확인 화면에 그대로 노출돼요. 최소 3장 이상 등록해 주세요.</div>
      <div className="mb-6 grid grid-cols-3 gap-2">
        {canAddMore && (
          <>
            <div
              onClick={isNative ? onTapCamera : () => cameraInputRef.current?.click()}
              className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-gray-400 bg-white text-gray-500"
            >
              <CameraIcon />
              <span className="text-[11.5px] font-semibold">촬영</span>
            </div>
            <div
              onClick={isNative ? onTapGallery : () => galleryInputRef.current?.click()}
              className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-gray-400 bg-white text-gray-500"
            >
              <GalleryIcon />
              <span className="text-[11.5px] font-semibold">앨범</span>
            </div>
          </>
        )}
        {photos.map((photo, i) => (
          <div key={i} className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-gray-100">
            <img
              src={photo}
              alt="시공 사진"
              className="h-full w-full cursor-pointer object-cover"
              onClick={() => onViewPhoto(photo)}
            />
            <span
              onClick={() => onRemovePhoto(i)}
              className="absolute top-[5px] right-[5px] flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-black/60 text-xs text-white"
            >
              ✕
            </span>
          </div>
        ))}
      </div>
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileSelected} />
      <input ref={galleryInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFileSelected} />
    </>
  );
}
