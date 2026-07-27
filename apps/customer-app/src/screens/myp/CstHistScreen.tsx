// CU-MYPG-06: 시공내역 - 신차패키지/예약시공 등 시공 이용 이력 조회
import CommonHeader from "../common/CommonHeader";
import { CST_HIST, CST_STATUS_META } from "../myp/mypData";

interface CstHistScreenProps {
  onBack: () => void;
  onOpenItem: () => void;
}

export default function CstHistScreen({ onBack, onOpenItem }: CstHistScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <CommonHeader title="시공내역" onBack={onBack} />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-4 pb-6">
        <div className="flex flex-col gap-3">
          {CST_HIST.map((o) => {
            const sm = CST_STATUS_META[o.status];
            return (
              <div key={o.date + o.shop} onClick={onOpenItem} className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-[15px] shadow-sm">
                <div className="mb-[9px] flex items-center justify-between">
                  <span className="text-[11.5px] text-gray-500">{o.date}</span>
                  <span className="rounded-md px-[9px] py-[3px] text-[10.5px] font-extrabold" style={{ color: sm.color, background: sm.bg }}>
                    {sm.label}
                  </span>
                </div>
                <div className="text-sm font-bold text-gray-800">{o.shop}</div>
                <div className="mt-1 text-xs text-gray-500">{o.items}</div>
                <div className="mt-2 text-sm font-extrabold text-gray-900 tabular-nums">{o.price}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
