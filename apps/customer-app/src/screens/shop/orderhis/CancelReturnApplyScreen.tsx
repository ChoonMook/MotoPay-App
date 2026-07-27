// CU-SHOP-10: 취소·반품 신청(팝업) - 사유 선택·상세 사유 입력 후 신청 (부분취소 불가, 전체취소 후 재주문)
import Button from "../../../components/ui/Button";
import BottomSheet from "../../../components/ui/BottomSheet";
import { CloseIcon } from "../../common/commonIcons";
import { CANCEL_REASONS } from "../shopData";

interface CancelReturnApplyScreenProps {
  onClose: () => void;
  reason: string;
  onSelectReason: (r: string) => void;
  detail: string;
  onChangeDetail: (v: string) => void;
  onSubmit: () => void;
}

export default function CancelReturnApplyScreen({ onClose, reason, onSelectReason, detail, onChangeDetail, onSubmit }: CancelReturnApplyScreenProps) {
  const canSubmit = !!reason;

  return (
    <BottomSheet onClose={onClose} maxHeight="88%">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-lg font-extrabold text-gray-900">취소·반품 신청</span>
        <span onClick={onClose} className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center text-gray-500">
          <CloseIcon />
        </span>
      </div>
      <div className="mt-1 mb-3.5 text-[12.5px] text-gray-600">부분취소는 불가하며, 전체 취소 후 재주문할 수 있어요.</div>

      <div className="mb-1.5 text-[13px] font-extrabold text-gray-900">취소·반품 사유</div>
      <div className="mb-4 flex flex-col gap-2.5">
        {CANCEL_REASONS.map((r) => {
          const on = reason === r;
          return (
            <div
              key={r}
              onClick={() => onSelectReason(r)}
              className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-[15px] py-3 ${on ? "border-brand bg-brand-subtle" : "border-gray-200 bg-white"}`}
            >
              <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px] text-white ${on ? "bg-brand" : "border-2 border-gray-300"}`}>
                {on ? "✓" : ""}
              </span>
              <span className="text-[13.5px] font-bold text-gray-900">{r}</span>
            </div>
          );
        })}
      </div>

      <div className="mb-1.5 text-[13px] font-extrabold text-gray-900">상세 사유</div>
      <textarea
        value={detail}
        onChange={(e) => onChangeDetail(e.target.value)}
        placeholder="상세 사유를 입력해주세요 (선택)"
        className="min-h-24 w-full resize-none rounded-xl border border-gray-400 bg-white px-3.5 py-[13px] text-[13.5px] leading-relaxed text-gray-900 outline-none placeholder:text-gray-400"
      />

      <div className="mt-4">
        <Button disabled={!canSubmit} onClick={onSubmit}>
          {canSubmit ? "신청하기" : "사유를 선택하세요"}
        </Button>
      </div>
    </BottomSheet>
  );
}
