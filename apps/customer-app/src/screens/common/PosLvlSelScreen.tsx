// CU-RSVC-06 / CU-NCPK-03: 부위·농도 선택(팝업) - 부위별 5/15/30% 농도 선택, 부위 체크 해제 시 시공에서 제외
// 신차패키지·예약시공 등 여러 채널에서 공통으로 쓰는 화면
import BottomSheet from "../../components/ui/BottomSheet";
import Button from "../../components/ui/Button";
import Switch from "../../components/ui/Switch";
import { CloseIcon, CheckIcon } from "./commonIcons";
import { TINT_POSITIONS, type TintLevel } from "./commonTypes";

const LEVELS: TintLevel[] = ["5", "15", "30"];

interface PosLvlSelScreenProps {
  onClose: () => void;
  onComplete: () => void;
  posLevels: Record<string, TintLevel>;
  posBulk: boolean;
  posOff: Record<string, boolean>;
  onSelectLevel: (position: string, level: TintLevel) => void;
  onToggleBulk: () => void;
  onTogglePosition: (name: string) => void;
}

export default function PosLvlSelScreen({
  onClose,
  onComplete,
  posLevels,
  posBulk,
  posOff,
  onSelectLevel,
  onToggleBulk,
  onTogglePosition,
}: PosLvlSelScreenProps) {
  return (
    <BottomSheet onClose={onClose} maxHeight="90%">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-lg font-extrabold text-gray-900">부위·농도 선택</span>
        <span onClick={onClose} className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center text-gray-500">
          <CloseIcon />
        </span>
      </div>
      <div className="mb-3.5 text-[12.5px] text-gray-600">
        시공할 <b>부위</b>와 <b>농도</b>를 선택하세요. 체크 해제한 부위는 시공에서 제외돼요.
      </div>

      <div className="mb-3.5 flex items-center justify-between rounded-xl bg-brand-subtle px-3.5 py-3">
        <div>
          <div className="text-[13.5px] font-bold text-gray-900">전체 일괄 적용</div>
          <div className="mt-px text-[11px] text-gray-500">모든 부위 농도를 한 번에 변경</div>
        </div>
        <Switch checked={posBulk} onChange={onToggleBulk} label="" />
      </div>

      <div className="mp-scroll flex flex-col gap-2.5 overflow-y-auto">
        {TINT_POSITIONS.map((name) => {
          const off = !!posOff[name];
          return (
            <div key={name} className={`rounded-xl border px-3.5 py-3 ${off ? "border-gray-200 opacity-60" : "border-gray-400"}`}>
              <div className="mb-2.5 flex items-center gap-2.5">
                <span
                  onClick={() => onTogglePosition(name)}
                  className={`flex h-[22px] w-[22px] flex-none cursor-pointer items-center justify-center rounded-md ${
                    off ? "border-[1.5px] border-gray-300 bg-white" : "bg-brand"
                  }`}
                >
                  {!off && (
                    <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">
                      <CheckIcon />
                    </span>
                  )}
                </span>
                <span className={`text-[13.5px] font-bold ${off ? "text-gray-500" : "text-gray-900"}`}>{name}</span>
              </div>
              <div className="flex gap-[7px]">
                {LEVELS.map((l) => {
                  const sel = !off && posLevels[name] === l;
                  return (
                    <span
                      key={l}
                      onClick={() => !off && onSelectLevel(name, l)}
                      className={`flex-1 rounded-[9px] py-[9px] text-center text-[12.5px] font-bold ${
                        off ? "cursor-default" : "cursor-pointer"
                      } ${sel ? "bg-brand text-white" : off ? "bg-gray-100 text-gray-300" : "bg-gray-100 text-gray-600"}`}
                    >
                      {l}%
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <Button onClick={onComplete}>선택 완료</Button>
      </div>
    </BottomSheet>
  );
}
