// CU-NCPK-09: 예약 확정 - 차액 결제 완료 후 예약 요약 + 시공업체 해피콜 예정 안내
import Button from "../../components/ui/Button";
import { CheckIcon, PhoneIcon } from "./ncpIcons";

interface RsvCfmScreenProps {
  onConfirm: () => void;
  shopName: string;
  visitLabel: string;
  itemSummaryLabel: string;
  paidAmountLabel: string;
  reservationNo?: string;
}

export default function RsvCfmScreen({
  onConfirm,
  shopName,
  visitLabel,
  itemSummaryLabel,
  paidAmountLabel,
  reservationNo,
}: RsvCfmScreenProps) {
  const rows: Array<[string, string]> = [
    ...(reservationNo ? ([["예약번호", reservationNo]] as Array<[string, string]>) : []),
    ["시공업체", shopName],
    ["방문 일시", visitLabel],
    ["시공 항목", itemSummaryLabel],
    ["업그레이드 차액", paidAmountLabel],
  ];

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="mp-scroll flex-1 overflow-y-auto">
        <div
          className="px-6 pt-[66px] pb-[34px] text-center text-white"
          style={{ background: "linear-gradient(160deg,var(--green-500),#0f9d63)" }}
        >
          <div className="mx-auto mb-4 flex h-[66px] w-[66px] items-center justify-center rounded-full bg-white/22">
            <span className="[&>svg]:h-[34px] [&>svg]:w-[34px]">
              <CheckIcon />
            </span>
          </div>
          <div className="text-[22px] font-extrabold tracking-tight">예약이 확정됐어요</div>
          <div className="mt-1.5 text-[13.5px] text-white/90">신차패키지 시공 예약이 완료되었습니다.</div>
        </div>

        <div className="px-5 pt-5 pb-6">
          <div className="rounded-2xl border border-gray-200 bg-white px-[18px] shadow-sm">
            {rows.map(([k, v], i) => (
              <div
                key={k}
                className={`flex items-center justify-between py-[13px] ${i < rows.length - 1 ? "border-b border-gray-100" : ""}`}
              >
                <span className="text-[12.5px] text-gray-500">{k}</span>
                <span className="text-right text-[13.5px] font-bold text-gray-900">{v}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-brand-subtle px-[15px] py-3.5">
            <span className="mt-px flex-none text-brand">
              <PhoneIcon />
            </span>
            <div>
              <div className="text-[13px] font-bold text-gray-900">시공업체 해피콜 예정</div>
              <div className="mt-0.5 text-xs leading-relaxed text-gray-600">
                일정 조율을 위해 업체에서 곧 연락드릴 예정이에요. 확인 후 방문해 주세요.
              </div>
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
