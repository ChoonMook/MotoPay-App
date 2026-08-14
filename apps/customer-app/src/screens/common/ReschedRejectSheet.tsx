// CU-RSVC-21 부속(팝업): 업체 일정변경 요청 거절 - 사유는 선택 입력, 확정해도 기존 예약 일정은 그대로 유지됨
import BottomSheet from "../../components/ui/BottomSheet";
import Button from "../../components/ui/Button";

interface ReschedRejectSheetProps {
  reason: string;
  onChangeReason: (reason: string) => void;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ReschedRejectSheet({ reason, onChangeReason, submitting, onClose, onConfirm }: ReschedRejectSheetProps) {
  return (
    <BottomSheet onClose={onClose}>
      <div className="mb-1 text-lg font-extrabold text-gray-900">일정 변경을 거절할까요?</div>
      <div className="mb-4 text-[13px] leading-relaxed text-gray-600">기존 예약 일정이 그대로 유지돼요. 거절 사유를 남기면 업체에게 전달돼요(선택).</div>
      <textarea
        value={reason}
        onChange={(e) => onChangeReason(e.target.value)}
        placeholder="거절 사유를 입력해주세요 (선택)"
        className="mb-5 min-h-[80px] w-full resize-none rounded-xl border border-gray-400 bg-white px-3.5 py-3 text-[13.5px] leading-relaxed text-gray-900 outline-none"
      />
      <Button variant="danger" size="lg" disabled={submitting} onClick={onConfirm}>
        {submitting ? "처리 중..." : "거절하기"}
      </Button>
    </BottomSheet>
  );
}
