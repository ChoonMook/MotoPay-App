// 엑셀 다운로드/업로드 공통 버튼 - 엑셀 아이콘의 초록색을 배경으로 사용해 기능을 직관적으로 인지시킴.
// 목록 화면에 엑셀 다운로드·업로드 버튼을 추가할 때는 이 컴포넌트를 사용해 색상을 통일한다.
import type { LucideIcon } from "lucide-react";

interface ExcelActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

export default function ExcelActionButton({ icon: Icon, label, onClick }: ExcelActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-lg bg-[#21a366] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#21a366]/20 transition-all hover:bg-[#1c8c58]"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
