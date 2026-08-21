// PT-RSVC-01: 예약시공관리 메인 허브 - 신규 요청 배너, 입찰함·시공 현황 진입 카드, 진행 중인 시공 미리보기
import { NavHomeIcon, NavResvIcon, NavPayIcon, NavMyIcon, BellIcon } from "../home/homeIcons";
import { jobStatusChipClass } from "./rsvcData";
import type { RsvcJob } from "./rsvcTypes";
import { BidIcon, WaitIcon } from "./rsvcIcons";

const NAV_ITEMS = [
  { key: "home", label: "홈", Icon: NavHomeIcon, active: false },
  { key: "resv", label: "예약관리", Icon: NavResvIcon, active: true },
  { key: "pay", label: "정산", Icon: NavPayIcon, active: false },
  { key: "my", label: "마이", Icon: NavMyIcon, active: false },
];

interface RsvcMainScreenProps {
  newReqCount: number;
  bidTotalCount: number;
  jobTotalCount: number;
  jobPreview: RsvcJob[];
  onOpenBidbox: () => void;
  onOpenWaitlist: () => void;
  onOpenJob: (job: RsvcJob) => void;
  onOpenHome: () => void;
  onOpenStl: () => void;
  onOpenMyPage: () => void;
  onPlaceholder: (label: string) => void;
}

export default function RsvcMainScreen({
  newReqCount,
  bidTotalCount,
  jobTotalCount,
  jobPreview,
  onOpenBidbox,
  onOpenWaitlist,
  onOpenJob,
  onOpenHome,
  onOpenStl,
  onOpenMyPage,
  onPlaceholder,
}: RsvcMainScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex-none border-b border-gray-100 bg-white pt-[50px] px-[18px] pb-3.5">
        <span className="text-[19px] font-extrabold tracking-tight text-gray-900">예약시공관리</span>
      </div>

      <div className="mp-scroll flex-1 overflow-y-auto px-[18px] py-[18px]">
        {newReqCount > 0 && (
          <div className="mb-4 flex items-center gap-2.5 rounded-[14px] bg-brand-subtle px-4 py-3.5">
            <span className="flex-none text-brand">
              <BellIcon />
            </span>
            <span className="text-[13.5px] font-bold text-brand">신규 입찰 요청이 {newReqCount}건 있어요</span>
          </div>
        )}

        <div className="mb-[18px] grid grid-cols-2 gap-2.5">
          <div
            onClick={onOpenBidbox}
            className="cursor-pointer rounded-[14px] border border-gray-200 bg-white p-[18px_14px] shadow-sm"
          >
            <span className="mb-3 inline-flex text-brand">
              <BidIcon />
            </span>
            <div className="text-[22px] font-extrabold tabular-nums text-gray-900">{bidTotalCount}</div>
            <div className="mt-0.5 text-[13.5px] font-bold text-gray-900">입찰함</div>
            <div className="mt-0.5 text-[11.5px] text-gray-500">신규·진행·마감 요청</div>
          </div>
          <div
            onClick={onOpenWaitlist}
            className="cursor-pointer rounded-[14px] border border-gray-200 bg-white p-[18px_14px] shadow-sm"
          >
            <span className="mb-3 inline-flex text-brand">
              <WaitIcon />
            </span>
            <div className="text-[22px] font-extrabold tabular-nums text-gray-900">{jobTotalCount}</div>
            <div className="mt-0.5 text-[13.5px] font-bold text-gray-900">시공 현황</div>
            <div className="mt-0.5 text-[11.5px] text-gray-500">착수전·시공중 건</div>
          </div>
        </div>

        <div className="mb-2 text-[13px] font-extrabold tracking-[.02em] text-gray-500">진행 중인 시공</div>
        <div className="flex flex-col gap-2">
          {jobPreview.map((j) => (
            <div
              key={j.id}
              onClick={() => onOpenJob(j)}
              className="flex cursor-pointer items-center gap-2.5 rounded-[14px] border border-gray-200 bg-white px-3.5 py-3.5"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-bold text-gray-900">
                  {j.customer} · {j.car}
                </div>
                <div className="mt-0.5 text-[11.5px] text-gray-500">{j.schedule}</div>
              </div>
              <span className={`flex-none rounded-full px-2.5 py-1 text-[11px] font-bold ${jobStatusChipClass(j.status)}`}>
                {j.status}
              </span>
            </div>
          ))}
        </div>
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
