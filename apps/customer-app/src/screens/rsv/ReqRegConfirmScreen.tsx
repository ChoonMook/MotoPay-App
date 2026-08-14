// CU-RSVC-08 부속(팝업): 요청 등록 확인 - 시공 항목을 신차패키지 예약확정 요약과 동일하게 상세히 보여준 뒤
// 명시적으로 확인해야 실제 등록(POST /bid-requests)이 진행된다(이전엔 확인 없이 바로 저장됐음)
import Button from "../../components/ui/Button";
import BottomSheet from "../../components/ui/BottomSheet";

export interface ReqCfmItem {
  name: string; // 시공항목명(일반입찰) 또는 관심 카테고리명(전문가추천)
  product: string | null; // 선택한 제품명(일반입찰만, 미지정이면 null)
  tintDetail?: string; // 썬팅일 때만 부위별 농도
}

interface ReqRegConfirmScreenProps {
  rows: Array<{ k: string; v: string }>;
  items: ReqCfmItem[];
  itemsLabel: string; // "시공 항목" 또는 "관심 카테고리"
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ReqRegConfirmScreen({ rows, items, itemsLabel, submitting, onCancel, onConfirm }: ReqRegConfirmScreenProps) {
  return (
    <BottomSheet onClose={onCancel} maxHeight="85%">
      <div className="text-center text-[17px] font-extrabold text-gray-900">이 내용으로 요청을 등록할까요?</div>
      <div className="mt-2 text-center text-[12.5px] text-gray-600">등록 후에는 입찰이 붙기 전까지만 취소할 수 있어요.</div>

      <div className="mt-5 rounded-2xl border border-gray-200 bg-white px-[15px] shadow-sm">
        {rows.map((r, i) => (
          <div key={r.k} className={`flex items-center justify-between gap-3 py-3 ${i < rows.length - 1 ? "border-b border-gray-100" : ""}`}>
            <span className="text-xs text-gray-500">{r.k}</span>
            <span className="text-right text-[13px] font-bold text-gray-900">{r.v}</span>
          </div>
        ))}
      </div>

      {items.length > 0 && (
        <div className="mt-3.5 rounded-2xl border border-gray-200 bg-white px-[15px] shadow-sm">
          <div className="pt-3 pb-1 text-xs font-bold text-gray-500">{itemsLabel}</div>
          {items.map((it, i) => (
            <div key={`${it.name}-${i}`} className={`py-3 ${i < items.length - 1 ? "border-b border-gray-100" : ""}`}>
              <div className="flex items-center justify-between gap-2.5">
                <span className="text-[13.5px] font-bold text-gray-900">{it.name}</span>
                <span className="flex-none text-[12.5px] text-gray-600">{it.product ?? "제품 미지정"}</span>
              </div>
              {it.tintDetail && <div className="mt-1.5 text-[11.5px] text-gray-500">{it.tintDetail}</div>}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex gap-2.5">
        <div className="flex-1">
          <Button variant="outline" disabled={submitting} onClick={onCancel}>
            아니요
          </Button>
        </div>
        <div className="flex-1">
          <Button disabled={submitting} onClick={onConfirm}>
            {submitting ? "등록하는 중..." : "등록하기"}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
