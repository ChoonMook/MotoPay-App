// PT-HOME-01: 파트너(시공업체) 로그인 후 진입하는 업무 홈 - 확인 대기 알림 + 신차패키지 시공관리/예약시공 입찰 현황 + 오늘의 시공 일정 + 하단내비
import Toast from "../../components/ui/Toast";
import { useToast } from "../../components/ui/useToast";
import { NavHomeIcon, NavResvIcon, NavPayIcon, NavMyIcon, BellIcon, AlertCircleIcon, PackageIcon, TagIcon } from "./homeIcons";

interface StatItem {
  value: number;
  label: string;
  colorClass: string;
}

const PKG_STATS: StatItem[] = [
  { value: 3, label: "착수대기", colorClass: "text-accent-strong" },
  { value: 2, label: "시공중", colorClass: "text-brand" },
  { value: 18, label: "완료", colorClass: "text-status-success" },
];

const BID_STATS: StatItem[] = [
  { value: 4, label: "신규요청", colorClass: "text-accent-strong" },
  { value: 2, label: "참여중", colorClass: "text-brand" },
  { value: 3, label: "시공대기", colorClass: "text-[#0E9A96]" },
];

type ResvStatus = "방문예정" | "시공중" | "완료";

const STATUS_CHIP: Record<ResvStatus, string> = {
  방문예정: "text-brand bg-brand-subtle",
  시공중: "text-accent-strong bg-accent-subtle",
  완료: "text-status-success bg-status-success-bg",
};

interface TodayReservation {
  time: string;
  service: string;
  customer: string;
  car: string;
  plate: string;
  status: ResvStatus;
}

const TODAY_RESV: TodayReservation[] = [
  { time: "오후 2:00", customer: "박지훈", service: "유리막코팅", car: "쏘렌토", plate: "78마 1234", status: "시공중" },
  { time: "오후 4:00", customer: "홍길동", service: "틴팅", car: "Benz E-Class", plate: "12가 3456", status: "방문예정" },
  { time: "오전 10:30", customer: "이서연", service: "블랙박스", car: "Kia K5", plate: "45나 7890", status: "완료" },
];

const NAV_ITEMS = [
  { key: "home", label: "홈", Icon: NavHomeIcon, active: true },
  { key: "resv", label: "예약관리", Icon: NavResvIcon, active: false },
  { key: "pay", label: "정산", Icon: NavPayIcon, active: false },
  { key: "my", label: "마이", Icon: NavMyIcon, active: false },
];

interface HomeScreenProps {
  onOpenMyPage: () => void;
}

export default function HomeScreen({ onOpenMyPage }: HomeScreenProps) {
  const { toast, showToast } = useToast();

  return (
    <div className="absolute inset-0 bg-gray-50">
      {/* top app bar (상태바 46px 아래부터 시작) */}
      <div className="absolute inset-x-0 top-[46px] z-50 flex h-[52px] items-center gap-2 border-b border-gray-100 bg-white px-[18px]">
        <span className="text-[21px] font-extrabold tracking-tight text-gray-900">
          Moto<span className="text-brand">Pay</span>
        </span>
        <span className="rounded-[5px] bg-brand-subtle px-[7px] py-[2.5px] text-[10.5px] font-extrabold text-brand">
          파트너
        </span>
        <span className="flex-1" />
        <span
          onClick={() => showToast("알림함으로 이동해요")}
          className="relative inline-flex cursor-pointer text-gray-700"
        >
          <BellIcon />
          <span className="absolute top-[-1px] right-0 h-[7px] w-[7px] rounded-full border-[1.5px] border-white bg-status-danger" />
        </span>
      </div>

      {/* scroll body */}
      <div
        className="mp-scroll absolute inset-x-0 top-[98px] bottom-[66px] overflow-y-auto px-[18px] pt-4 pb-6"
        style={{ animation: "mp-screen .32s ease" }}
      >
        {/* greeting */}
        <div className="mx-0.5 mb-3.5">
          <div className="text-xl font-extrabold tracking-tight text-gray-900">강남 오토바디 김철수님, 안녕하세요</div>
          <div className="mt-[3px] text-[13.5px] text-gray-600">오늘 처리할 시공과 입찰을 확인해 보세요.</div>
        </div>

        {/* 확인 대기 알림 배너 */}
        <div
          onClick={() => showToast("확인 대기 건 목록으로 이동해요")}
          className="mb-4 flex cursor-pointer items-start gap-3 rounded-[14px] bg-brand-subtle p-4"
        >
          <span className="mt-px flex-none">
            <AlertCircleIcon />
          </span>
          <div className="text-sm leading-[1.5] font-bold text-brand">신규 예약 2건, 마감임박 입찰 1건이 확인을 기다리고 있어요</div>
        </div>

        {/* 신차패키지 시공관리 */}
        <div className="mb-3 rounded-2xl border border-gray-200 bg-white p-[18px] shadow-sm">
          <div className="mb-3.5 flex items-center gap-2">
            <PackageIcon />
            <span className="flex-1 text-base font-extrabold tracking-tight text-gray-900">신차패키지 시공관리</span>
            <span
              onClick={() => showToast("신차패키지 시공관리로 이동해요")}
              className="cursor-pointer text-[13px] font-bold text-brand"
            >
              바로가기
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {PKG_STATS.map((s) => (
              <div
                key={s.label}
                onClick={() => showToast(`신차패키지 ${s.label} ${s.value}건 목록으로 이동해요`)}
                className="cursor-pointer rounded-xl bg-gray-100 px-3 py-3.5"
              >
                <div className={`text-[22px] font-extrabold tracking-tight tabular-nums ${s.colorClass}`}>{s.value}</div>
                <div className="mt-[3px] text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 예약시공 입찰 */}
        <div className="mb-[22px] rounded-2xl border border-gray-200 bg-white p-[18px] shadow-sm">
          <div className="mb-3.5 flex items-center gap-2">
            <TagIcon />
            <span className="flex-1 text-base font-extrabold tracking-tight text-gray-900">예약시공 입찰</span>
            <span
              onClick={() => showToast("예약시공 입찰 목록으로 이동해요")}
              className="cursor-pointer text-[13px] font-bold text-brand"
            >
              바로가기
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {BID_STATS.map((s) => (
              <div
                key={s.label}
                onClick={() => showToast(`예약시공 ${s.label} ${s.value}건 목록으로 이동해요`)}
                className="cursor-pointer rounded-xl bg-gray-100 px-3 py-3.5"
              >
                <div className={`text-[22px] font-extrabold tracking-tight tabular-nums ${s.colorClass}`}>{s.value}</div>
                <div className="mt-[3px] text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 오늘의 시공 일정 */}
        <div className="mx-0.5 mb-2.5 flex items-baseline justify-between">
          <span className="text-base font-extrabold tracking-tight text-gray-900">오늘의 시공 일정</span>
          <span className="text-[13px] text-gray-500 tabular-nums">2026.07.02</span>
        </div>
        <div className="flex flex-col gap-2">
          {TODAY_RESV.map((r) => (
            <div
              key={r.time + r.customer}
              onClick={() => showToast(`${r.customer}님 시공 상세로 이동해요`)}
              className="cursor-pointer rounded-[14px] border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <span className="flex-1 text-[15px] font-extrabold tracking-tight text-gray-900">
                  {r.time} · {r.service}
                </span>
                <span className={`flex-none rounded-full px-[11px] py-[5px] text-xs font-bold ${STATUS_CHIP[r.status]}`}>
                  {r.status}
                </span>
              </div>
              <div className="mt-1.5 text-[13px] text-gray-500">
                {r.customer} · {r.car} · {r.plate}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== bottom navigation ===== */}
      <div className="absolute inset-x-0 bottom-0 z-50 flex h-[66px] border-t border-gray-100 bg-white pb-2">
        {NAV_ITEMS.map(({ key, label, Icon, active }) => (
          <div
            key={key}
            onClick={() =>
              active ? undefined : key === "my" ? onOpenMyPage() : showToast(`${label} 탭으로 이동해요`)
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

      {/* toast */}
      {toast && (
        <div className="absolute inset-x-0 bottom-[82px] z-[90] flex justify-center px-6">
          <Toast tone={toast.tone}>{toast.message}</Toast>
        </div>
      )}
    </div>
  );
}
