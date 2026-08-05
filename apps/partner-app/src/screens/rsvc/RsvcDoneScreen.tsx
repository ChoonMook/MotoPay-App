// PT-RSVC-10: 시공 완료 처리 - 항목별 완료 체크(전 항목 체크 시 제출 가능), 시공 사진(최대 10장) 등록, 작업 메모
import { useRef } from "react";
import Button from "../../components/ui/Button";
import Textarea from "../../components/ui/Textarea";
import type { RsvcJob } from "./rsvcTypes";
import { AddPhotoIcon } from "./rsvcIcons";

const MAX_PHOTOS = 10;
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

interface RsvcDoneScreenProps {
  job: RsvcJob;
  onToggleCheck: (index: number) => void;
  onAddPhoto: (dataUri: string) => void;
  onRemovePhoto: (index: number) => void;
  onChangeMemo: (value: string) => void;
  onBack: () => void;
  onConfirm: () => void;
  onError: (message: string) => void;
}

export default function RsvcDoneScreen({
  job,
  onToggleCheck,
  onAddPhoto,
  onRemovePhoto,
  onChangeMemo,
  onBack,
  onConfirm,
  onError,
}: RsvcDoneScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const allChecked = job.items.every((_, i) => job.doneCheck[i]);

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

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex-none border-b border-gray-100 bg-white pt-[50px] px-3">
        <div className="flex h-[50px] items-center gap-1.5">
          <span onClick={onBack} className="flex h-9 w-9 cursor-pointer items-center justify-center text-[22px] text-gray-800">
            ‹
          </span>
          <span className="text-[17px] font-bold text-gray-900">시공 완료 처리</span>
        </div>
      </div>

      <div className="mp-scroll flex-1 overflow-y-auto px-5 py-[18px]">
        <div className="mb-1 text-[15px] font-extrabold text-gray-900">항목별 완료 체크</div>
        <div className="mb-3 text-[12.5px] text-gray-600">건마다 시공 항목 구성이 다르니, 항목별로 개별 체크해 주세요.</div>
        <div className="mb-6 flex flex-col gap-2">
          {job.items.map((it, i) => {
            const on = !!job.doneCheck[i];
            return (
              <div
                key={`${it.name}-${i}`}
                onClick={() => onToggleCheck(i)}
                className={`flex cursor-pointer items-center gap-2.5 rounded-[14px] border bg-white px-[15px] py-3.5 ${
                  on ? "border-brand" : "border-gray-200"
                }`}
              >
                <span
                  className={`flex h-6 w-6 flex-none items-center justify-center rounded-[7px] text-[13px] font-extrabold text-white ${
                    on ? "bg-brand" : "bg-gray-100"
                  }`}
                >
                  {on ? "✓" : ""}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-gray-800">{it.name}</div>
                  <div className="mt-0.5 text-[11.5px] text-gray-500">{it.spec}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-[15px] font-extrabold text-gray-900">시공 사진</span>
          <span className="text-[12.5px] tabular-nums text-gray-500">
            {job.photos.length}/{MAX_PHOTOS}
          </span>
        </div>
        <div className="mb-3 text-[12.5px] text-gray-600">고객 인수확인 화면에 그대로 노출돼요. 최소 3장 이상 등록해 주세요.</div>
        <div className="mb-6 grid grid-cols-3 gap-2">
          {job.photos.length < MAX_PHOTOS && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-gray-400 bg-white"
            >
              <AddPhotoIcon />
              <span className="text-[11.5px] font-semibold text-gray-500">사진 추가</span>
            </div>
          )}
          {job.photos.map((photo, i) => (
            <div key={i} className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-gray-100">
              <img src={photo} alt="시공 사진" className="h-full w-full object-cover" />
              <span
                onClick={() => onRemovePhoto(i)}
                className="absolute top-[5px] right-[5px] flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-black/60 text-xs text-white"
              >
                ✕
              </span>
            </div>
          ))}
        </div>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFileSelected} />

        <div className="mb-2.5 text-[15px] font-extrabold text-gray-900">
          작업 메모 <span className="text-xs font-semibold text-gray-500">(선택)</span>
        </div>
        <Textarea value={job.memo} onChange={(e) => onChangeMemo(e.target.value)} placeholder="작업 중 특이사항을 적어주세요" rows={3} />
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-[22px]">
        <Button disabled={!allChecked || job.photos.length < 3} onClick={onConfirm}>
          완료 처리하고 인수확인 요청
        </Button>
      </div>
    </div>
  );
}
