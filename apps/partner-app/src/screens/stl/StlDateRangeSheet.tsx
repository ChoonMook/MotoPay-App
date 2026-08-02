// PT-STL-02 부속: 기간 직접입력 팝업 - 시작일·종료일을 입력해 정산 내역 조회 기간 필터를 직접 지정
import BottomSheet from "../../components/ui/BottomSheet";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

interface StlDateRangeSheetProps {
  dateFrom: string;
  onChangeDateFrom: (value: string) => void;
  dateTo: string;
  onChangeDateTo: (value: string) => void;
  onClose: () => void;
  onApply: () => void;
}

export default function StlDateRangeSheet({
  dateFrom,
  onChangeDateFrom,
  dateTo,
  onChangeDateTo,
  onClose,
  onApply,
}: StlDateRangeSheetProps) {
  return (
    <BottomSheet onClose={onClose} maxHeight="none">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-base font-extrabold text-gray-900">기간 직접입력</span>
        <span onClick={onClose} className="flex h-7 w-7 cursor-pointer items-center justify-center text-lg text-gray-500">
          ✕
        </span>
      </div>
      <div className="mb-[18px] flex items-center gap-2.5">
        <div className="min-w-0 flex-1">
          <Input label="시작일" placeholder="YYYY.MM.DD" value={dateFrom} onChange={(e) => onChangeDateFrom(e.target.value)} />
        </div>
        <span className="flex-none pt-[22px] text-[13px] text-gray-500">~</span>
        <div className="min-w-0 flex-1">
          <Input label="종료일" placeholder="YYYY.MM.DD" value={dateTo} onChange={(e) => onChangeDateTo(e.target.value)} />
        </div>
      </div>
      <Button size="lg" disabled={!dateFrom || !dateTo} onClick={onApply}>
        적용
      </Button>
    </BottomSheet>
  );
}
