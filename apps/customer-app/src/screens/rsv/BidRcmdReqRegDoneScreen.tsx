// CU-RSVC-09: 입찰/추천 요청 등록완료 - 마감시간 카운트다운, 대상 업체 알림 발송 안내, 응찰 0건 시 자동취소 고지
import Button from "../../components/ui/Button";
import { ClockIcon, BellIcon, WarnIcon } from "./rsvIcons";

interface BidRcmdReqRegDoneScreenProps {
  isExpert: boolean;
  regRows: Array<{ k: string; v: string }>;
  onConfirm: () => void;
}

export default function BidRcmdReqRegDoneScreen({ isExpert, regRows, onConfirm }: BidRcmdReqRegDoneScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="mp-scroll flex-1 overflow-y-auto">
        <div
          className="px-6 pt-[66px] pb-[34px] text-center text-white"
          style={{ background: "linear-gradient(160deg,var(--green-500),#0f9d63)" }}
        >
          <div className="mx-auto mb-4 flex h-[66px] w-[66px] items-center justify-center rounded-full bg-white/22">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="text-[22px] font-extrabold tracking-tight">요청이 등록됐어요</div>
          <div className="mt-1.5 text-[13.5px] text-white/90">
            {isExpert ? "전문가 추천 요청이 접수되었어요." : "입찰 요청이 접수되었어요."}
          </div>
        </div>

        <div className="px-5 pt-5 pb-6">
          <div className="flex items-center gap-3.5 rounded-2xl border border-brand bg-white p-4 shadow-sm">
            <span className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-xl bg-brand-subtle text-brand">
              <ClockIcon />
            </span>
            <div className="flex-1">
              <div className="text-xs text-gray-500">입찰 마감까지</div>
              <div className="text-[22px] font-extrabold tracking-tight text-brand tabular-nums">23시간 58분</div>
            </div>
          </div>

          <div className="mt-3.5 rounded-2xl border border-gray-200 bg-white px-[18px] shadow-sm">
            {regRows.map((r, i) => (
              <div key={r.k} className={`flex items-center justify-between gap-3 py-3.5 ${i < regRows.length - 1 ? "border-b border-gray-100" : ""}`}>
                <span className="text-xs text-gray-500">{r.k}</span>
                <span className="text-right text-[13.5px] font-bold text-gray-900">{r.v}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-brand-subtle p-3.5">
            <span className="mt-px flex-none text-brand">
              <BellIcon />
            </span>
            <div>
              <div className="text-[13px] font-bold text-gray-900">대상 업체에 알림을 보냈어요</div>
              <div className="mt-0.5 text-xs leading-relaxed text-gray-600">
                인근 업체가 견적을 보내면 알림으로 알려드려요. 마감 후 결과는 예약시공 탭에서 확인할 수 있어요.
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-start gap-[9px] rounded-xl border border-orange-100 bg-accent-subtle px-[15px] py-[13px]">
            <span className="mt-px flex-none text-accent-strong">
              <WarnIcon />
            </span>
            <div className="text-xs leading-relaxed text-gray-600">
              응찰이 <b>0건</b>이면 마감 후 자동 취소되며, 취소 사실을 미리 알려드려요.
            </div>
          </div>
        </div>
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-6">
        <Button size="xl" onClick={onConfirm}>
          확인
        </Button>
      </div>
    </div>
  );
}
