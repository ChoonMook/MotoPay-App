// CU-MYPG-07: 알림 설정 - 전체 알림 및 항목별(이벤트혜택·예약시공·주문배송·야간) 수신 여부 토글
import CommonHeader from "../common/CommonHeader";

export interface NotiSettings {
  all: boolean;
  event: boolean;
  resv: boolean;
  order: boolean;
  night: boolean;
}

const ROW_DEFS: { key: keyof NotiSettings; label: string; desc: string }[] = [
  { key: "all", label: "전체 알림", desc: "" },
  { key: "event", label: "이벤트 · 혜택 알림", desc: "쿠폰·포인트 지급 등" },
  { key: "resv", label: "예약시공 알림", desc: "예약 확정·시공 진행 안내" },
  { key: "order", label: "주문 · 배송 알림", desc: "쇼핑몰 주문·배송 현황" },
  { key: "night", label: "야간 알림 수신", desc: "21:00 ~ 08:00" },
];

interface NotiCfgScreenProps {
  onBack: () => void;
  settings: NotiSettings;
  onToggle: (key: keyof NotiSettings) => void;
}

export default function NotiCfgScreen({ onBack, settings, onToggle }: NotiCfgScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <CommonHeader title="알림 설정" onBack={onBack} />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-2 pb-6">
        <div className="flex flex-col">
          {ROW_DEFS.map((r, i) => {
            const on = settings[r.key];
            return (
              <div
                key={r.key}
                className={`flex items-center justify-between py-[15px] ${i < ROW_DEFS.length - 1 ? "border-b border-gray-100" : ""}`}
              >
                <div>
                  <div className="text-sm font-bold text-gray-800">{r.label}</div>
                  {r.desc && <div className="mt-0.5 text-[11.5px] text-gray-500">{r.desc}</div>}
                </div>
                <span
                  onClick={() => onToggle(r.key)}
                  className={`flex h-[26px] w-[46px] flex-none cursor-pointer rounded-full p-[3px] transition-colors ${
                    on ? "justify-end bg-brand" : "justify-start bg-gray-200"
                  }`}
                >
                  <span className="h-5 w-5 rounded-full bg-white shadow" />
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
