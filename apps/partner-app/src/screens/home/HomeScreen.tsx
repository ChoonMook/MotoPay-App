// PT-HOME-01: 파트너(시공업체) 로그인 후 진입하는 업무 홈 - 확인 대기 알림 + 신차패키지 시공관리/예약시공 입찰 현황 + 오늘의 시공 일정 + 하단내비
// 확인 대기 알림 배너는 아직 연계할 백엔드(Notification 모델)가 없어 mock 유지, 나머지는 실 API 연동
import { useEffect, useState } from "react";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../components/ui/useToast";
import { getMyBidRequests } from "../../api/bidRequests";
import { getCommonCodeDetails, type CommonCodeDetailApi } from "../../api/commonCodes";
import { getMe, type PartnerUser } from "../../api/partnerAuth";
import {
  getBidJobs,
  getPackageStats,
  getTodayReservations,
  type PackageProgressStats,
  type TodayReservation,
} from "../../api/reservations";
import type { NcpkTab } from "../ncpk/ncpkData";
import { mapBidJob, mapBidRequest } from "../rsvc/rsvcData";
import type { BidTab } from "../rsvc/RsvcBidboxScreen";
import { getUnreadNotificationCount } from "../../api/notifications";
import { NavHomeIcon, NavResvIcon, NavPayIcon, NavMyIcon, BellIcon, AlertCircleIcon, PackageIcon, TagIcon } from "./homeIcons";

interface StatItem {
  value: number;
  label: string;
  colorClass: string;
}

interface PkgStatItem extends StatItem {
  tab: NcpkTab;
}

interface BidStatItem extends StatItem {
  target: { screen: "bidbox"; tab: BidTab } | { screen: "waitlist" };
}

interface BidStats {
  newCount: number;
  activeCount: number;
  waitCount: number;
}

const PROGRESS_CHIP: Record<string, { label: string; chipClass: string }> = {
  APPLIED: { label: "방문예정", chipClass: "text-brand bg-brand-subtle" },
  IN_PROGRESS: { label: "시공중", chipClass: "text-accent-strong bg-accent-subtle" },
  DONE: { label: "완료", chipClass: "text-status-success bg-status-success-bg" },
};

function todayLabel(): string {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

const NAV_ITEMS = [
  { key: "home", label: "홈", Icon: NavHomeIcon, active: true },
  { key: "resv", label: "예약관리", Icon: NavResvIcon, active: false },
  { key: "pay", label: "정산", Icon: NavPayIcon, active: false },
  { key: "my", label: "마이", Icon: NavMyIcon, active: false },
];

interface HomeScreenProps {
  onOpenMyPage: () => void;
  onOpenNcpk: (tab: NcpkTab) => void;
  onOpenRsvc: (target?: { screen: "bidbox"; tab: BidTab } | { screen: "waitlist" }) => void;
  onOpenStl: () => void;
  onOpenTodayJob: (reservation: TodayReservation) => void;
  onOpenNotiInbox: () => void;
}

export default function HomeScreen({ onOpenMyPage, onOpenNcpk, onOpenRsvc, onOpenStl, onOpenTodayJob, onOpenNotiInbox }: HomeScreenProps) {
  const { toast, showToast } = useToast();
  const [partnerUser, setPartnerUser] = useState<PartnerUser | null>(null);
  const [unreadNotiCount, setUnreadNotiCount] = useState(0);
  const [reservationTypes, setReservationTypes] = useState<CommonCodeDetailApi[]>([]);
  const [todayResv, setTodayResv] = useState<TodayReservation[]>([]);
  const [loadingToday, setLoadingToday] = useState(true);
  const [carBrandCodes, setCarBrandCodes] = useState<CommonCodeDetailApi[]>([]);
  const [carModelCodes, setCarModelCodes] = useState<CommonCodeDetailApi[]>([]);
  const [pkgStats, setPkgStats] = useState<PackageProgressStats | null>(null);
  const [bidStats, setBidStats] = useState<BidStats>({ newCount: 0, activeCount: 0, waitCount: 0 });

  useEffect(() => {
    getMe()
      .then(setPartnerUser)
      .catch((err) => showToast(err instanceof Error ? err.message : "계정 정보를 불러오지 못했어요", "danger"));
    getUnreadNotificationCount()
      .then(setUnreadNotiCount)
      .catch(() => {});
    getCommonCodeDetails("RESERVATION_TYPE")
      .then(setReservationTypes)
      .catch(() => {});
    getCommonCodeDetails("CAR_BRAND")
      .then(setCarBrandCodes)
      .catch(() => {});
    getCommonCodeDetails("CAR_MODEL")
      .then(setCarModelCodes)
      .catch(() => {});
    getTodayReservations()
      .then(setTodayResv)
      .catch((err) => showToast(err instanceof Error ? err.message : "오늘의 시공 일정을 불러오지 못했어요", "danger"))
      .finally(() => setLoadingToday(false));
    getPackageStats()
      .then(setPkgStats)
      .catch((err) => showToast(err instanceof Error ? err.message : "신차패키지 통계를 불러오지 못했어요", "danger"));
    // 신규요청·참여중은 입찰함(신규/진행중 상태) 기준, 시공현황은 착수전·시공중 상태의 실제 시공건(Reservation) 기준
    // — 별도 통계 API 없이 목록 응답을 그대로 집계(RsvcFlow.tsx와 동일 방식), car 라벨은 통계에 쓰이지 않아 조회 생략
    getMyBidRequests()
      .then((rows) => {
        const reqs = rows.map((r) => mapBidRequest(r, () => null));
        setBidStats((prev) => ({
          ...prev,
          newCount: reqs.filter((r) => r.status === "open").length,
          activeCount: reqs.filter((r) => r.status === "active").length,
        }));
      })
      .catch((err) => showToast(err instanceof Error ? err.message : "예약시공 입찰 현황을 불러오지 못했어요", "danger"));
    getBidJobs()
      .then((rows) => {
        const jobs = rows.map((j) => mapBidJob(j, () => null));
        setBidStats((prev) => ({ ...prev, waitCount: jobs.filter((j) => j.status !== "완료").length }));
      })
      .catch((err) => showToast(err instanceof Error ? err.message : "예약시공 시공 현황을 불러오지 못했어요", "danger"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reservationTypeLabel = (code: string) =>
    reservationTypes.find((t) => t.detailCode === code)?.detailName ?? code;
  const carBrandLabel = (code: string) => carBrandCodes.find((t) => t.detailCode === code)?.detailName ?? code;
  const carModelLabel = (code: string) => carModelCodes.find((t) => t.detailCode === code)?.detailName ?? code;

  const pkgStatItems: PkgStatItem[] = [
    { value: pkgStats?.applied ?? 0, label: "착수대기", colorClass: "text-accent-strong", tab: "wait" },
    { value: pkgStats?.inProgress ?? 0, label: "시공중", colorClass: "text-brand", tab: "ing" },
    { value: pkgStats?.done ?? 0, label: "완료", colorClass: "text-status-success", tab: "done" },
  ];

  const bidStatItems: BidStatItem[] = [
    { value: bidStats.newCount, label: "신규요청", colorClass: "text-accent-strong", target: { screen: "bidbox", tab: "new" } },
    { value: bidStats.activeCount, label: "참여중", colorClass: "text-brand", target: { screen: "bidbox", tab: "active" } },
    { value: bidStats.waitCount, label: "시공현황", colorClass: "text-[#0E9A96]", target: { screen: "waitlist" } },
  ];

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
        <span onClick={onOpenNotiInbox} className="relative inline-flex cursor-pointer text-gray-700">
          <BellIcon />
          {unreadNotiCount > 0 && (
            <span className="absolute top-[-1px] right-0 h-[7px] w-[7px] rounded-full border-[1.5px] border-white bg-status-danger" />
          )}
        </span>
      </div>

      {/* scroll body */}
      <div
        className="mp-scroll absolute inset-x-0 top-[98px] bottom-[66px] overflow-y-auto px-[18px] pt-4 pb-6"
        style={{ animation: "mp-screen .32s ease" }}
      >
        {/* greeting */}
        <div className="mx-0.5 mb-3.5">
          <div className="text-xl font-extrabold tracking-tight text-gray-900">
            {partnerUser ? `${partnerUser.shopName} ${partnerUser.name}님, 안녕하세요` : "안녕하세요"}
          </div>
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
            <span onClick={() => onOpenNcpk("wait")} className="cursor-pointer text-[13px] font-bold text-brand">
              바로가기
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {pkgStatItems.map((s) => (
              <div
                key={s.label}
                onClick={() => onOpenNcpk(s.tab)}
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
            <span onClick={() => onOpenRsvc()} className="cursor-pointer text-[13px] font-bold text-brand">
              바로가기
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {bidStatItems.map((s) => (
              <div
                key={s.label}
                onClick={() => onOpenRsvc(s.target)}
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
          <span className="text-[13px] text-gray-500 tabular-nums">{todayLabel()}</span>
        </div>
        <div className="flex flex-col gap-2">
          {loadingToday ? (
            <div className="py-10 text-center text-sm text-gray-400">불러오는 중...</div>
          ) : todayResv.length === 0 ? (
            <div className="rounded-[14px] border border-gray-200 bg-white p-4 text-center text-sm text-gray-400 shadow-sm">
              오늘 예정된 시공이 없어요
            </div>
          ) : (
            todayResv.map((r) => {
              const chip = PROGRESS_CHIP[r.progressStatus] ?? PROGRESS_CHIP.APPLIED;
              return (
                <div
                  key={r.reservationNo}
                  onClick={() => onOpenTodayJob(r)}
                  className="cursor-pointer rounded-[14px] border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-[15px] font-extrabold tracking-tight text-gray-900">
                      {r.time} · {reservationTypeLabel(r.reservationType)}
                    </span>
                    <span className={`flex-none rounded-full px-[11px] py-[5px] text-xs font-bold ${chip.chipClass}`}>
                      {chip.label}
                    </span>
                  </div>
                  <div className="mt-1.5 text-[13px] text-gray-500">
                    {[
                      r.customerName,
                      r.carBrandCode ? carBrandLabel(r.carBrandCode) : null,
                      r.carModelCode ? carModelLabel(r.carModelCode) : null,
                      r.trimName,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ===== bottom navigation ===== */}
      <div className="absolute inset-x-0 bottom-0 z-50 flex h-[66px] border-t border-gray-100 bg-white pb-2">
        {NAV_ITEMS.map(({ key, label, Icon, active }) => (
          <div
            key={key}
            onClick={() =>
              active
                ? undefined
                : key === "my"
                  ? onOpenMyPage()
                  : key === "resv"
                    ? onOpenRsvc()
                    : key === "pay"
                      ? onOpenStl()
                      : showToast(`${label} 탭으로 이동해요`)
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
