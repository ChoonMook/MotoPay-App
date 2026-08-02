// PT-RSVC-02: 시공 대기 목록 - 착수전·시공중 건 카드 목록. 카드 탭 시 착수전은 시공 착수 등록, 시공중은 완료 처리로 이동
import { NavHomeIcon, NavResvIcon, NavPayIcon, NavMyIcon } from "../home/homeIcons";
import { jobStatusChipClass, itemSummary } from "./rsvcData";
import type { RsvcJob } from "./rsvcTypes";
import { PhoneCallIcon } from "./rsvcIcons";

const NAV_ITEMS = [
  { key: "home", label: "홈", Icon: NavHomeIcon, active: false },
  { key: "resv", label: "예약관리", Icon: NavResvIcon, active: true },
  { key: "pay", label: "정산", Icon: NavPayIcon, active: false },
  { key: "my", label: "마이", Icon: NavMyIcon, active: false },
];

interface RsvcWaitlistScreenProps {
  jobs: RsvcJob[];
  onBack: () => void;
  onOpenJob: (job: RsvcJob) => void;
  onCall: (job: RsvcJob) => void;
  onResched: (job: RsvcJob) => void;
  onOpenHome: () => void;
  onOpenStl: () => void;
  onOpenMyPage: () => void;
  onPlaceholder: (label: string) => void;
}

export default function RsvcWaitlistScreen({
  jobs,
  onBack,
  onOpenJob,
  onCall,
  onResched,
  onOpenHome,
  onOpenStl,
  onOpenMyPage,
  onPlaceholder,
}: RsvcWaitlistScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex-none border-b border-gray-100 bg-white pt-[50px] px-3">
        <div className="flex h-[50px] items-center gap-1.5">
          <span onClick={onBack} className="flex h-9 w-9 cursor-pointer items-center justify-center text-[22px] text-gray-800">
            ‹
          </span>
          <span className="text-[17px] font-bold text-gray-900">시공 대기 목록</span>
        </div>
      </div>

      <div className="mp-scroll flex-1 overflow-y-auto px-[18px] py-4">
        {jobs.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white py-10 text-center text-sm text-gray-400 shadow-sm">
            시공 대기 중인 건이 없어요
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {jobs.map((j) => (
              <div key={j.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div onClick={() => onOpenJob(j)} className="cursor-pointer">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex-1 text-[15px] font-extrabold tracking-tight text-gray-900">{j.customer}</span>
                    <span className={`flex-none rounded-full px-2.5 py-1 text-[11px] font-bold ${jobStatusChipClass(j.status)}`}>
                      {j.status}
                    </span>
                  </div>
                  <div className="mb-[3px] text-[13.5px] text-gray-800">{j.car}</div>
                  <div className="mb-[3px] font-mono text-xs tabular-nums text-gray-500">VIN {j.vin}</div>
                  <div className="mb-[9px] text-[12.5px] text-gray-500">{j.schedule}</div>
                  <div className="rounded-[9px] bg-gray-100 px-[11px] py-[9px] text-[12.5px] text-gray-500">
                    {itemSummary(j.items)}
                  </div>
                </div>
                <div className="mt-2.5 flex gap-2">
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onCall(j);
                    }}
                    className="flex cursor-pointer items-center gap-1.5 rounded-[9px] bg-brand-subtle px-[11px] py-[7px] text-xs font-bold text-brand"
                  >
                    <PhoneCallIcon />
                    해피콜
                  </span>
                  {j.status === "착수전" && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onResched(j);
                      }}
                      className="cursor-pointer rounded-[9px] bg-gray-100 px-[11px] py-[7px] text-xs font-bold text-gray-600"
                    >
                      일정 변경 요청
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex h-[66px] flex-none border-t border-gray-100 bg-white pb-2">
        {NAV_ITEMS.map(({ key, label, Icon, active }) => (
          <div
            key={key}
            onClick={() =>
              active
                ? undefined
                : key === "home"
                  ? onOpenHome()
                  : key === "pay"
                    ? onOpenStl()
                    : key === "my"
                      ? onOpenMyPage()
                      : onPlaceholder(`${label} 탭`)
            }
            className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-1"
          >
            <Icon color={active ? "var(--color-brand)" : "var(--text-tertiary)"} />
            <span className={`text-[10.5px] ${active ? "font-bold text-brand" : "font-medium text-gray-500"}`}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
