// 공용 화면(인수확인 등) 헤더: 뒤로가기 + 타이틀만 (진행바 없음)
import { BackIcon } from "./commonIcons";

interface CommonHeaderProps {
  title: string;
  onBack: () => void;
}

export default function CommonHeader({ title, onBack }: CommonHeaderProps) {
  return (
    <div className="flex-none bg-white">
      <div className="flex items-center gap-1.5 pt-[50px] pr-2.5 pl-2.5">
        <span onClick={onBack} className="flex h-9 w-9 cursor-pointer items-center justify-center text-gray-800">
          <BackIcon />
        </span>
        <span className="text-base font-bold text-gray-900">{title}</span>
      </div>
    </div>
  );
}
