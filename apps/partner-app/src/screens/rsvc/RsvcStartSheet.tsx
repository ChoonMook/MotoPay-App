// PT-RSVC-09: 시공 착수 등록 팝업 - 착수 등록 시 고객 환불 불가 기준점 발생 (PT-NCPK-04와 동일 컴포넌트 패턴, 대상 도메인만 예약시공)
import BottomSheet from "../../components/ui/BottomSheet";
import Button from "../../components/ui/Button";
import type { RsvcItem } from "./rsvcTypes";

interface RsvcStartSheetProps {
  infoRows: { k: string; v: string }[];
  items: RsvcItem[];
  onCancel: () => void;
  onConfirm: () => void;
}

export default function RsvcStartSheet({ infoRows, items, onCancel, onConfirm }: RsvcStartSheetProps) {
  return (
    <BottomSheet onClose={onCancel} maxHeight="none">
      <div className="mb-1 text-xl font-extrabold text-gray-900">시공을 착수할까요?</div>
      <div className="mb-[18px] text-[13.5px] leading-[1.55] text-gray-600">
        착수하면 고객에게 <b>시공 시작 알림</b>이 발송되고, 이 시점부터 <b>고객 환불이 불가</b>해져요.
      </div>

      <div className="mb-4 rounded-lg bg-gray-100 px-4">
        {infoRows.map((r, i) => (
          <div key={r.k} className={`flex items-center justify-between py-[11px] ${i < infoRows.length - 1 ? "border-b border-gray-200" : ""}`}>
            <span className="text-[13px] text-gray-500">{r.k}</span>
            <span className="text-[13.5px] font-semibold text-gray-800">{r.v}</span>
          </div>
        ))}
      </div>

      <div className="mb-2.5 text-sm font-bold text-gray-800">시공 항목</div>
      <div className="mp-scroll mb-[22px] flex max-h-40 flex-col gap-2 overflow-y-auto">
        {items.map((it, i) => (
          <div key={`${it.name}-${i}`} className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3.5 py-3">
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-bold text-gray-800">{it.name}</div>
              <div className="mt-0.5 text-[11.5px] text-gray-500">{it.spec}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2.5">
        <div className="flex-1">
          <Button variant="outline" size="lg" onClick={onCancel}>
            취소
          </Button>
        </div>
        <div className="flex-[2]">
          <Button variant="primary" size="lg" onClick={onConfirm}>
            시공 착수
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
