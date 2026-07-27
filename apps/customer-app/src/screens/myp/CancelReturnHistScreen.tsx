// CU-MYPG-11: 취소·반품 내역 - 쇼핑몰 주문의 취소·반품 신청 이력 조회 (CU-SHOP-10 신청 완료 시에도 이 화면으로 진입)
import CommonHeader from "../common/CommonHeader";
import { CANCEL_HIST, CANCEL_STATUS_META } from "./mypData";

interface CancelReturnHistScreenProps {
  onBack: () => void;
}

export default function CancelReturnHistScreen({ onBack }: CancelReturnHistScreenProps) {
  const empty = CANCEL_HIST.length === 0;

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <CommonHeader title="취소·반품 내역" onBack={onBack} />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-4 pb-6">
        {empty ? (
          <div className="flex flex-col items-center gap-2 py-[60px] text-center">
            <div className="text-sm font-bold text-gray-600">취소·반품 내역이 없어요</div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {CANCEL_HIST.map((c) => {
              const sm = CANCEL_STATUS_META[c.status];
              return (
                <div key={c.date + c.name} className="rounded-2xl border border-gray-200 bg-white p-[15px] shadow-sm">
                  <div className="mb-[9px] flex items-center justify-between">
                    <span className="text-[11.5px] text-gray-500">
                      {c.date} · {c.type}
                    </span>
                    <span className="rounded-md px-[9px] py-[3px] text-[10.5px] font-extrabold" style={{ color: sm.color, background: sm.bg }}>
                      {sm.label}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-gray-800">{c.name}</div>
                  <div className="mt-1 text-xs text-gray-500">{c.reason}</div>
                  <div className="mt-2 text-sm font-extrabold text-gray-900 tabular-nums">{c.amount}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
