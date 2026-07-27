// 신차패키지 하위 화면 공용 헤더: 뒤로가기 + 타이틀 (+선택적 4단계 진행바)
import ProgressSteps from "../../components/ui/ProgressSteps";
import { BackIcon } from "./ncpIcons";

const STEP_LABELS = ["패키지", "업체", "일정", "완료"];

interface NcpHeaderProps {
  title: string;
  onBack: () => void;
  step?: 0 | 1 | 2;
}

export default function NcpHeader({ title, onBack, step }: NcpHeaderProps) {
  return (
    <div className="flex-none bg-white">
      <div className="flex items-center gap-1.5 pt-[50px] pr-2.5 pl-2.5">
        <span onClick={onBack} className="flex h-9 w-9 cursor-pointer items-center justify-center text-gray-800">
          <BackIcon />
        </span>
        <span className="text-base font-bold text-gray-900">{title}</span>
      </div>
      {step !== undefined && (
        <div className="border-b border-gray-100 px-5 py-3">
          <ProgressSteps steps={STEP_LABELS} current={step} />
        </div>
      )}
    </div>
  );
}
