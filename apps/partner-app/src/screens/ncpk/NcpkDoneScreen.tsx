// PT-NCPK-04: 시공 완료 등록 - 항목별 완료 체크, 시공 사진(최대 10장) 등록, 작업 메모 입력 후 완료 처리
import Button from "../../components/ui/Button";
import Textarea from "../../components/ui/Textarea";
import carImg from "../../assets/images/car.png";
import type { PackageJobItem } from "../../api/reservations";
import { AddPhotoIcon } from "./ncpkIcons";

interface NcpkDoneScreenProps {
  items: PackageJobItem[];
  checks: boolean[];
  onToggleCheck: (index: number) => void;
  photos: number;
  onAddPhoto: () => void;
  onRemovePhoto: (index: number) => void;
  memo: string;
  onChangeMemo: (value: string) => void;
  onBack: () => void;
  onConfirm: () => void;
  canConfirm: boolean;
}

export default function NcpkDoneScreen({
  items,
  checks,
  onToggleCheck,
  photos,
  onAddPhoto,
  onRemovePhoto,
  memo,
  onChangeMemo,
  onBack,
  onConfirm,
  canConfirm,
}: NcpkDoneScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex-none border-b border-gray-100 bg-white pt-[50px] px-3">
        <div className="flex h-[50px] items-center gap-1.5">
          <span onClick={onBack} className="flex h-9 w-9 cursor-pointer items-center justify-center text-[22px] text-gray-800">
            ‹
          </span>
          <span className="text-[17px] font-bold text-gray-900">시공 완료 등록</span>
        </div>
      </div>

      <div className="mp-scroll flex-1 overflow-y-auto px-5 py-[18px]">
        <div className="mb-1 text-[15px] font-extrabold text-gray-900">항목별 완료 체크</div>
        <div className="mb-3 text-[12.5px] text-gray-600">모든 항목을 완료해야 인수확인을 요청할 수 있어요.</div>
        <div className="mb-6 flex flex-col gap-2">
          {items.length === 0 && (
            <div className="rounded-[14px] border border-gray-200 bg-white px-[15px] py-4 text-center text-[13px] text-gray-400">
              연결된 패키지 구성상품이 없어요
            </div>
          )}
          {items.map((it, i) => {
            const on = checks[i];
            return (
              <div
                key={`${it.name}-${i}`}
                onClick={() => onToggleCheck(i)}
                className={`flex cursor-pointer items-center gap-2.5 rounded-[14px] border bg-white px-[15px] py-3.5 ${
                  on ? "border-brand" : "border-gray-200"
                }`}
              >
                <span
                  className={`flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[7px] border-[1.5px] text-[13px] font-extrabold text-white ${
                    on ? "border-brand bg-brand" : "border-gray-300 bg-white"
                  }`}
                >
                  {on ? "✓" : ""}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-gray-800">{it.name}</div>
                  {it.spec && <div className="mt-0.5 text-[11.5px] text-gray-500">{it.spec}</div>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-[15px] font-extrabold text-gray-900">시공 사진</span>
          <span className="text-[12.5px] tabular-nums text-gray-500">{photos}/10</span>
        </div>
        <div className="mb-6 text-[12.5px] text-gray-600">
          고객 인수확인 화면에 그대로 노출돼요. 최소 3장 이상 등록해 주세요.
        </div>
        <div className="mb-6 grid grid-cols-3 gap-2">
          <div
            onClick={onAddPhoto}
            className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-gray-400 bg-white"
          >
            <AddPhotoIcon />
            <span className="text-[11.5px] font-semibold text-gray-500">사진 추가</span>
          </div>
          {Array.from({ length: photos }, (_, i) => (
            <div key={i} className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-gray-100">
              <img src={carImg} alt="시공 사진" className="h-auto w-4/5 object-contain" />
              <span
                onClick={() => onRemovePhoto(i)}
                className="absolute top-[5px] right-[5px] flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-black/60 text-xs text-white"
              >
                ✕
              </span>
            </div>
          ))}
        </div>

        <div className="mb-2.5 text-[15px] font-extrabold text-gray-900">
          작업 메모 <span className="text-xs font-semibold text-gray-500">(선택)</span>
        </div>
        <Textarea
          value={memo}
          onChange={(e) => onChangeMemo(e.target.value)}
          placeholder="특이사항이나 고객 안내 사항을 남겨주세요"
          rows={3}
        />
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-[22px]">
        <Button disabled={!canConfirm} onClick={onConfirm}>
          완료 처리하고 인수확인 요청
        </Button>
      </div>
    </div>
  );
}
