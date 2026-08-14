// PT-RSVC-06 부속(팝업): 입찰 제출(수정) 확인 - 항목별 견적가·합계·시공 가능 시간·메모를 다시 보여주고 확정
// 고객이 업체를 선택하기 전(status="active")까지는 재제출로 계속 수정 가능
import BottomSheet from "../../components/ui/BottomSheet";
import Button from "../../components/ui/Button";
import { formatDesiredDateLabel, won } from "./rsvcData";
import type { BidReq } from "./rsvcTypes";

interface RsvcBidSubmitConfirmSheetProps {
  req: BidReq;
  bidPrices: Record<string, string>;
  bidDate: string; // "YYYY-MM-DD" — 고객 희망일과 다른 날짜로 응찰했을 수 있어 실제 선택한 날짜를 표시
  bidTime: string;
  bidMemo: string;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function RsvcBidSubmitConfirmSheet({ req, bidPrices, bidDate, bidTime, bidMemo, submitting, onCancel, onConfirm }: RsvcBidSubmitConfirmSheetProps) {
  const isEdit = req.status === "active";
  const priceRows = req.items.map((it) => ({ k: it.name, v: won(bidPrices[it.instCode ?? ""] ?? 0) }));
  const total = req.items.reduce((sum, it) => sum + (Number(bidPrices[it.instCode ?? ""]) || 0), 0);

  return (
    <BottomSheet onClose={onCancel} maxHeight="none">
      <div className="mb-1 text-xl font-extrabold text-gray-900">
        이 조건으로 입찰을 {isEdit ? "수정" : "제출"}할까요?
      </div>
      <div className="mb-[18px] text-[13.5px] leading-[1.55] text-gray-600">
        고객이 업체를 선택하면 더 이상 수정할 수 없어요.
      </div>

      <div className="mb-2.5 text-[13px] font-bold text-gray-800">시공 항목별 견적가</div>
      <div className="mb-[18px] rounded-lg bg-gray-100 px-4">
        {priceRows.map((r) => (
          <div key={r.k} className="flex items-center justify-between border-b border-gray-200 py-[11px]">
            <span className="text-[13px] text-gray-500">{r.k}</span>
            <span className="text-[13.5px] font-semibold text-gray-800">{r.v}</span>
          </div>
        ))}
        <div className="flex items-center justify-between py-[11px]">
          <span className="text-[13px] font-bold text-gray-800">견적 합계</span>
          <span className="text-base font-extrabold text-brand">{won(total)}</span>
        </div>
      </div>

      <div className="mb-[22px] rounded-lg bg-gray-100 px-4">
        <div className={`flex items-center justify-between py-[11px] ${bidMemo.trim() ? "border-b border-gray-200" : ""}`}>
          <span className="text-[13px] text-gray-500">시공 가능 시간</span>
          <span className="text-[13.5px] font-semibold text-gray-800">
            {formatDesiredDateLabel(bidDate)} {bidTime}
          </span>
        </div>
        {bidMemo.trim() && (
          <div className="flex items-center justify-between py-[11px]">
            <span className="text-[13px] text-gray-500">메모</span>
            <span className="text-[13.5px] font-semibold text-gray-800">{bidMemo.trim()}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2.5">
        <div className="flex-1">
          <Button variant="outline" size="lg" disabled={submitting} onClick={onCancel}>
            취소
          </Button>
        </div>
        <div className="flex-[2]">
          <Button variant="primary" size="lg" disabled={submitting} onClick={onConfirm}>
            {submitting ? "제출하는 중..." : isEdit ? "입찰 수정" : "입찰 제출"}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
