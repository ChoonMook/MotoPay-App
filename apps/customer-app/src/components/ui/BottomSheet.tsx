// 팝업 유형 화면(바텀시트) 공용 래퍼: 배경 스크림 + 슬라이드업 애니메이션
import type { ReactNode } from "react";

interface BottomSheetProps {
  onClose: () => void;
  children: ReactNode;
  maxHeight?: string;
}

export default function BottomSheet({ onClose, children, maxHeight = "80%" }: BottomSheetProps) {
  return (
    <div className="absolute inset-0 z-[70]">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/55"
        style={{ animation: "mp-fade .25s ease" }}
      />
      <div
        className="mp-scroll absolute right-0 bottom-0 left-0 overflow-y-auto rounded-t-[20px] bg-white px-6 pt-2.5 pb-[30px]"
        style={{ maxHeight, animation: "mp-sheet .32s cubic-bezier(.2,.8,.2,1)" }}
      >
        <div className="mx-auto mt-1.5 mb-[18px] h-1 w-10 rounded-full bg-gray-300" />
        {children}
      </div>
    </div>
  );
}
