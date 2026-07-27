// CU-RSVC-22: 예약 취소 - 취소 사유 선택 + 취소·환불 정책 안내 + 예상 환불액 확인 후 취소 확정
// 신차패키지·예약시공 공용 화면
import CommonHeader from "./CommonHeader";
import Button from "../../components/ui/Button";

const nfmt = (n: number) => n.toLocaleString("en-US");

export interface CancelReasonDef {
  id: string;
  label: string;
}

// id는 백엔드 CommonCodeDetail(code='CANCEL_REASON')의 상세코드값과 동일하게 맞춤
export const CANCEL_REASONS: CancelReasonDef[] = [
  { id: "SCHED", label: "일정 변경이 필요해요" },
  { id: "OTHER_SHOP", label: "다른 업체를 이용하고 싶어요" },
  { id: "COST", label: "비용이 부담돼요" },
  { id: "CHANGE_MIND", label: "단순 변심" },
  { id: "ETC", label: "기타" },
];

interface BookingCancelScreenProps {
  onBack: () => void;
  onConfirm: () => void;
  submitting: boolean;
  shopName: string;
  itemSummaryLabel: string;
  visitDateLabel: string;
  priceLabel: string; // 이미 "원"까지 포맷된 문자열, 예: "300,000원"
  reason: string | null;
  etcText: string;
  refundAmount: number;
  onSelectReason: (id: string) => void;
  onEtcChange: (text: string) => void;
}

export default function BookingCancelScreen({
  onBack,
  onConfirm,
  submitting,
  shopName,
  itemSummaryLabel,
  visitDateLabel,
  priceLabel,
  reason,
  etcText,
  refundAmount,
  onSelectReason,
  onEtcChange,
}: BookingCancelScreenProps) {
  const reasonOther = reason === "ETC";
  const ok = !!reason && (!reasonOther || !!etcText.trim());

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <CommonHeader title="예약 취소" onBack={onBack} />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-[18px] pb-6">
        <div className="rounded-[14px] border border-gray-200 bg-white px-4 py-3.5 shadow-sm">
          <div className="text-sm font-extrabold text-gray-900">
            {shopName} · {itemSummaryLabel}
          </div>
          <div className="mt-[3px] text-xs text-gray-500">
            {visitDateLabel} · {priceLabel}
          </div>
        </div>

        <div className="mx-0.5 mt-5 mb-2.5 text-sm font-extrabold text-gray-900">취소 사유</div>
        <div className="flex flex-col gap-2">
          {CANCEL_REASONS.map((r) => {
            const sel = reason === r.id;
            return (
              <div
                key={r.id}
                onClick={() => onSelectReason(r.id)}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-[15px] py-3.5 ${
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
            className="mt-2.5 min-h-[72px] w-full resize-none rounded-xl border border-gray-400 bg-white px-3.5 py-3 text-[13.5px] leading-relaxed text-gray-900 outline-none"
          />
        )}

        <div className="mx-0.5 mt-[22px] mb-2.5 text-sm font-extrabold text-gray-900">취소 정책 안내</div>
        <div className="rounded-xl bg-gray-100 px-[15px] py-3.5 text-[12.5px] leading-[1.6] text-gray-600">
          시공 <b>3일 전까지</b> 취소 시 결제금액 전액 환불돼요.
          <br />
          시공 <b>1~2일 전</b> 취소 시 결제금액의 10%가 위약금으로 차감돼요.
          <br />
          시공 <b>당일</b> 취소 시 환불되지 않아요.
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
          <span className="text-[13px] text-gray-600">예상 환불 금액</span>
          <span className="text-lg font-extrabold text-brand tabular-nums">{nfmt(refundAmount)}원</span>
        </div>
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-6">
        <Button variant="danger" size="xl" disabled={!ok || submitting} onClick={onConfirm}>
          {submitting ? "취소 처리 중..." : ok ? "예약 취소하기" : "취소 사유를 선택해주세요"}
        </Button>
      </div>
    </div>
  );
}
