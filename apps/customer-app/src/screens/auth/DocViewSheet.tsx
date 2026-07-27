// CU-AUTH-08/09 공용: 약관 전문 보기 풀시트(제목·본문·동의하고 닫기)
import Button from "../../components/ui/Button";

interface DocViewSheetProps {
  title: string;
  body: string;
  onClose: () => void;
  onAgree: () => void;
}

export default function DocViewSheet({ title, body, onClose, onAgree }: DocViewSheetProps) {
  return (
    <div className="absolute inset-0 z-[70]">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/55"
        style={{ animation: "mp-fade .25s ease" }}
      />
      <div
        className="absolute inset-x-0 top-[34px] bottom-0 flex flex-col rounded-t-[20px] bg-white"
        style={{ animation: "mp-sheet .32s cubic-bezier(.2,.8,.2,1)" }}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-[18px]">
          <span className="text-[17px] font-bold text-gray-900">{title}</span>
          <span onClick={onClose} className="cursor-pointer text-xl text-gray-600">
            ✕
          </span>
        </div>
        <div className="mp-scroll flex-1 overflow-y-auto px-5 py-5 text-[13px] leading-[1.7] whitespace-pre-line text-gray-600">
          {body}
        </div>
        <div className="border-t border-gray-100 px-5 py-4">
          <Button onClick={onAgree}>동의하고 닫기</Button>
        </div>
      </div>
    </div>
  );
}
