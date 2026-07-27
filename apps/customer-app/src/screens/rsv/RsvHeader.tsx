// 예약시공 하위 화면 공용 헤더: 뒤로가기 + 타이틀 (+선택적 진행바)
import ProgressSteps from "../../components/ui/ProgressSteps";
import { BackIcon } from "./rsvIcons";

interface RsvHeaderProps {
  title: string;
  onBack: () => void;
  steps?: string[];
  current?: number;
}

export default function RsvHeader({ title, onBack, steps, current }: RsvHeaderProps) {
  return (
    <div className="flex-none bg-white">
      <div className="flex items-center gap-1.5 pt-[50px] pr-2.5 pl-2.5">
        <span onClick={onBack} className="flex h-9 w-9 cursor-pointer items-center justify-center text-gray-800">
          <BackIcon />
        </span>
        <span className="text-base font-bold text-gray-900">{title}</span>
      </div>
      {steps && current !== undefined && (
        <div className="border-b border-gray-100 px-5 py-3">
          <ProgressSteps steps={steps} current={current} />
        </div>
      )}
    </div>
  );
}
