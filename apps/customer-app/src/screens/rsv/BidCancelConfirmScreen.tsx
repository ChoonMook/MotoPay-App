// CU-RSVC-01 부속(팝업): 예약시공 요청 취소 확인 - 아직 입찰이 붙지 않은 요청만 취소 가능, 취소 후 재요청 방식
import Button from "../../components/ui/Button";
import BottomSheet from "../../components/ui/BottomSheet";

export interface BidCancelReasonDef {
  id: string;
  label: string;
}

// id는 백엔드 CommonCodeDetail(code='BID_CANCEL_REASON')의 상세코드값과 동일하게 맞춤
export const BID_CANCEL_REASONS: BidCancelReasonDef[] = [
  { id: "SIMPLE", label: "단순변심" },
  { id: "RE_REQUEST", label: "추후 재요청" },
  { id: "ETC", label: "기타" },
];

interface BidCancelConfirmScreenProps {
  cancelling: boolean;
  reason: string | null;
  etcText: string;
  onSelectReason: (id: string) => void;
  onEtcChange: (text: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function BidCancelConfirmScreen({
  cancelling,
  reason,
  etcText,
  onSelectReason,
  onEtcChange,
  onCancel,
  onConfirm,
}: BidCancelConfirmScreenProps) {
  const reasonOther = reason === "ETC";
  const ok = !!reason && (!reasonOther || !!etcText.trim());

  return (
    <BottomSheet onClose={onCancel} maxHeight="70%">
      <div className="text-center text-[17px] font-extrabold text-gray-900">이 요청을 취소하시겠어요?</div>
      <div className="mt-2 text-center text-[12.5px] text-gray-600">취소 후에는 다시 등록해야 해요.</div>

      <div className="mx-0.5 mt-5 mb-2.5 text-[13px] font-extrabold text-gray-900">취소 사유</div>
      <div className="flex flex-col gap-2">
        {BID_CANCEL_REASONS.map((r) => {
          const sel = reason === r.id;
          return (
            <div
              key={r.id}
              onClick={() => onSelectReason(r.id)}
              className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-[15px] py-3 ${
                sel ? "border-brand bg-brand-subtle" : "border-gray-200 bg-white"
              }`}
            >
              <span
                className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px] text-white ${
                  sel ? "bg-brand" : "border-2 border-gray-300"
                }`}
              >
                {sel ? "✓" : ""}
              </span>
              <span className="text-[13.5px] font-semibold text-gray-800">{r.label}</span>
            </div>
          );
        })}
      </div>
      {reasonOther && (
        <textarea
          value={etcText}
          onChange={(e) => onEtcChange(e.target.value)}
          placeholder="취소 사유를 입력해주세요"
          className="mt-2.5 min-h-[64px] w-full resize-none rounded-xl border border-gray-400 bg-white px-3.5 py-3 text-[13.5px] leading-relaxed text-gray-900 outline-none"
        />
      )}

      <div className="mt-[22px] flex gap-2.5">
        <div className="flex-1">
          <Button variant="outline" disabled={cancelling} onClick={onCancel}>
            아니요
          </Button>
        </div>
        <div className="flex-1">
          <Button variant="danger" disabled={!ok || cancelling} onClick={onConfirm}>
            {cancelling ? "취소하는 중..." : "요청 취소"}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
