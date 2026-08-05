// PT-RSVC-10: 시공 완료 처리 - 항목별 완료 체크(전 항목 체크 시 제출 가능), 시공 사진(최대 10장) 등록, 작업 메모
import { useState } from "react";
import Button from "../../components/ui/Button";
import Textarea from "../../components/ui/Textarea";
import PhotoUploadGrid from "../../components/ui/PhotoUploadGrid";
import PhotoLightbox from "../../components/ui/PhotoLightbox";
import type { RsvcJob } from "./rsvcTypes";

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
  const allChecked = job.items.every((_, i) => job.doneCheck[i]);
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);

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

        <PhotoUploadGrid
          photos={job.photos}
          onAddPhoto={onAddPhoto}
          onRemovePhoto={onRemovePhoto}
          onViewPhoto={setViewingPhotoUrl}
          onError={onError}
        />

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

      <PhotoLightbox photoUrl={viewingPhotoUrl} onClose={() => setViewingPhotoUrl(null)} />
    </div>
  );
}
