// PT-RSVC-13: 부위·농도 선택 팝업 - 틴팅 등 부위 옵션 상품의 시공 부위·농도 지정 (고객앱 CU-RSVC-06과 동일 UI 패턴, 강제모드 없이 자유 선택)
import BottomSheet from "../../components/ui/BottomSheet";
import Button from "../../components/ui/Button";
import Switch from "../../components/ui/Switch";
import { POS_NAMES } from "./rsvcData";
import type { PlanLine } from "./rsvcTypes";
import { CloseIcon } from "./rsvcIcons";

const LEVELS = ["5", "15", "30"];

interface RsvcPlanPosSheetProps {
  line: PlanLine;
  onTogglePos: (name: string) => void;
  onSetLevel: (name: string, level: string) => void;
  onToggleBulk: () => void;
  onClose: () => void;
  onDone: () => void;
}

export default function RsvcPlanPosSheet({ line, onTogglePos, onSetLevel, onToggleBulk, onClose, onDone }: RsvcPlanPosSheetProps) {
  return (
    <BottomSheet onClose={onClose} maxHeight="90%">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-lg font-extrabold text-gray-900">부위·농도 선택</span>
        <span onClick={onClose} className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center text-gray-500">
          <CloseIcon />
        </span>
      </div>
      <div className="mb-3.5 text-[12.5px] text-gray-600">
        시공할 <b>부위</b>와 <b>농도</b>를 선택하세요. 체크 해제한 부위는 추천안에서 제외돼요.
      </div>

      <div className="mb-3.5 flex items-center justify-between rounded-xl bg-brand-subtle px-3.5 py-3">
        <div>
          <div className="text-[13.5px] font-bold text-gray-900">전체 일괄 적용</div>
          <div className="mt-px text-[11px] text-gray-500">모든 부위 농도를 한 번에 변경</div>
        </div>
        <Switch checked={line.posBulk} onChange={onToggleBulk} />
      </div>

      <div className="mp-scroll flex flex-col gap-2.5 overflow-y-auto">
        {POS_NAMES.map((name) => {
          const off = !!line.posOff[name];
          const lvl = line.posLevels[name] ?? "15";
          return (
            <div key={name} className={`rounded-xl border px-3.5 py-3 ${off ? "border-gray-200 opacity-60" : "border-gray-400"}`}>
              <div className="mb-2.5 flex items-center gap-2.5">
                <span
                  onClick={() => onTogglePos(name)}
                  className={`flex h-[22px] w-[22px] flex-none cursor-pointer items-center justify-center rounded-md text-xs font-extrabold ${
                    off ? "border-[1.5px] border-gray-300 bg-white text-transparent" : "bg-brand text-white"
                  }`}
                >
                  {off ? "" : "✓"}
                </span>
                <span className={`text-[13.5px] font-bold ${off ? "text-gray-500" : "text-gray-900"}`}>{name}</span>
              </div>
              <div className="flex gap-[7px]">
                {LEVELS.map((l) => {
                  const selected = !off && lvl === l;
                  return (
                    <span
                      key={l}
                      onClick={() => !off && onSetLevel(name, l)}
                      className={`flex-1 rounded-[9px] py-[9px] text-center text-[12.5px] font-bold ${off ? "cursor-default" : "cursor-pointer"} ${
                        selected ? "bg-brand text-white" : off ? "bg-gray-100 text-gray-300" : "bg-gray-100 text-gray-600"
                      }`}
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
        <Button size="lg" onClick={onDone}>
          선택 완료
        </Button>
      </div>
    </BottomSheet>
  );
}
