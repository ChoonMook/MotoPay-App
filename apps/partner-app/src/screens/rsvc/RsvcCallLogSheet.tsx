// PT-RSVC-03: 해피콜 이력 저장 팝업 - 통화 종료 후 통화 결과와 메모를 저장 (PT-NCPK-03과 동일 컴포넌트 패턴, 대상 도메인만 예약시공)
import BottomSheet from "../../components/ui/BottomSheet";
import Button from "../../components/ui/Button";
import Textarea from "../../components/ui/Textarea";

const CALL_RESULT_META = [
  { key: "connected", label: "연결됨" },
  { key: "noanswer", label: "부재중" },
  { key: "retry", label: "재통화예정" },
] as const;

export type CallResult = (typeof CALL_RESULT_META)[number]["key"];

interface RsvcCallLogSheetProps {
  result: CallResult;
  onChangeResult: (result: CallResult) => void;
  memo: string;
  onChangeMemo: (memo: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export default function RsvcCallLogSheet({
  result,
  onChangeResult,
  memo,
  onChangeMemo,
  onClose,
  onSave,
}: RsvcCallLogSheetProps) {
  return (
    <BottomSheet onClose={onClose} maxHeight="none">
      <div className="mb-4 text-lg font-extrabold text-gray-900">해피콜 이력 저장</div>
      <div className="mb-2 text-[13px] font-bold text-gray-800">통화 결과</div>
      <div className="mb-[18px] flex gap-2">
        {CALL_RESULT_META.map((c) => (
          <span
            key={c.key}
            onClick={() => onChangeResult(c.key)}
            className={`cursor-pointer rounded-full px-3.5 py-[7px] text-[13px] font-bold ${
              result === c.key ? "bg-brand text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {c.label}
          </span>
        ))}
      </div>
      <div className="mb-5">
        <Textarea value={memo} onChange={(e) => onChangeMemo(e.target.value)} placeholder="통화 내용을 간단히 적어주세요" rows={3} />
      </div>
      <Button onClick={onSave}>저장</Button>
    </BottomSheet>
  );
}
