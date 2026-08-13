// PT-NCPK-01: 신차패키지 시공관리 목록 - 상태별(착수대기/시공중/완료) 탭으로 배정된 시공 건 조회
import type { PackageJob } from "../../api/reservations";
import type { CommonCodeDetailApi } from "../../api/commonCodes";
import { NavHomeIcon, NavResvIcon, NavPayIcon, NavMyIcon } from "../home/homeIcons";
import { NCPK_TAB_META, formatScheduleLabel, statusChipClass, statusLabel, summarizeCategories, type NcpkTab } from "./ncpkData";
import { SearchIcon } from "./ncpkIcons";

const NAV_ITEMS = [
  { key: "home", label: "홈", Icon: NavHomeIcon, active: false },
  { key: "resv", label: "예약관리", Icon: NavResvIcon, active: true },
  { key: "pay", label: "정산", Icon: NavPayIcon, active: false },
  { key: "my", label: "마이", Icon: NavMyIcon, active: false },
];

interface NcpkListScreenProps {
  tab: NcpkTab;
  onChangeTab: (tab: NcpkTab) => void;
  jobs: PackageJob[];
  prodCatOptions: CommonCodeDetailApi[];
  tabCounts: Record<NcpkTab, number>;
  loading: boolean;
  onOpenJob: (job: PackageJob) => void;
  onOpenHome: () => void;
  onPlaceholder: (label: string) => void;
  onTapSearch: () => void;
}

export default function NcpkListScreen({
  tab,
  onChangeTab,
  jobs,
  prodCatOptions,
  tabCounts,
  loading,
  onOpenJob,
  onOpenHome,
  onPlaceholder,
  onTapSearch,
}: NcpkListScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex-none bg-white pt-[50px] px-[18px]">
        <div className="flex h-11 items-center gap-2">
          <span className="flex-1 text-[19px] font-extrabold tracking-tight text-gray-900">신차패키지 시공관리</span>
          <span onClick={onTapSearch} className="inline-flex cursor-pointer text-gray-700">
            <SearchIcon />
          </span>
        </div>
        <div className="mt-1.5 flex gap-1">
          {NCPK_TAB_META.map((t) => (
            <div
              key={t.key}
              onClick={() => onChangeTab(t.key)}
              className={`flex-1 cursor-pointer border-b-[2.5px] py-[11px] text-center text-[13.5px] font-semibold ${
                tab === t.key ? "border-brand font-extrabold text-brand" : "border-transparent text-gray-500"
              }`}
            >
              {t.label} <span className="text-xs font-extrabold tabular-nums">{tabCounts[t.key]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mp-scroll flex-1 overflow-y-auto px-[18px] py-4">
        {loading ? (
          <div className="py-10 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white py-10 text-center text-sm text-gray-400 shadow-sm">
            해당하는 시공 건이 없어요
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {jobs.map((j) => (
              <div
                key={j.reservationNo}
                onClick={() => onOpenJob(j)}
                className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="mb-[9px] flex items-center gap-2">
                  <span className="flex-1 text-[15px] font-extrabold tracking-tight text-gray-900">
                    {j.customerName}
                  </span>
                  <span className={`flex-none rounded-full px-2.5 py-1 text-[11.5px] font-extrabold ${statusChipClass(j.progressStatus)}`}>
                    {statusLabel(j.progressStatus)}
                  </span>
                </div>
                <div className="mb-[3px] text-[13.5px] text-gray-800">{j.car ?? "-"}</div>
                <div className="mb-[3px] font-mono text-[12.5px] tabular-nums text-gray-500">VIN {j.vin ?? "-"}</div>
                <div className="mb-2.5 text-[12.5px] text-gray-500">{formatScheduleLabel(j.date, j.time)}</div>
                <div className="rounded-[9px] bg-gray-100 px-[11px] py-[9px]">
                  <div className="text-[12.5px] font-semibold text-gray-700">{j.packageName ?? "-"}</div>
                  <div className="mt-0.5 text-[12.5px] text-gray-500">{summarizeCategories(j.categories, prodCatOptions)}</div>
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
            onClick={() => (active ? undefined : key === "home" ? onOpenHome() : onPlaceholder(`${label} 탭`))}
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
