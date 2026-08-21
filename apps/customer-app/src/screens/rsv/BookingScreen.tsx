// CU-RSVC-01: 예약시공 주화면 - 진행중인 요청 카드 목록(실 API) + 새 견적 요청하기 CTA + 하단 내비게이션
import Button from "../../components/ui/Button";
import PullToRefresh from "../../components/ui/PullToRefresh";
import { NavHomeIcon, NavResvIcon, NavShopIcon, NavMyIcon } from "../home/homeIcons";
import type { BidRequestApi, BidRequestCarApi } from "../../api/bidRequests";
import { INST_CODE_LABELS } from "./rsvTypes";

const BidIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <rect x="7" y="10" width="3" height="7" />
    <rect x="12" y="6" width="3" height="11" />
    <rect x="17" y="13" width="3" height="4" />
  </svg>
);
const RecoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2 15 8l6 .9-4.5 4.3 1 6.1L12 16.6 6.5 19.3l1-6.1L3 8.9 9 8z" />
  </svg>
);

const NAV_ITEMS = [
  { key: "home", label: "홈", Icon: NavHomeIcon, active: false },
  { key: "resv", label: "예약시공", Icon: NavResvIcon, active: true },
  { key: "shop", label: "쇼핑몰", Icon: NavShopIcon, active: false },
  { key: "my", label: "내 정보", Icon: NavMyIcon, active: false },
];

function formatMonthDay(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, "0")}`;
}

function itemSummary(request: BidRequestApi): string {
  return request.items.map((it) => INST_CODE_LABELS[it.instCode] ?? it.instCode).join(" · ") || "-";
}

export type ReqStatusFilter = "ALL" | "OPEN" | "PENDING_PAYMENT" | "SELECTED" | "IN_PROGRESS" | "DONE" | "CANCELLED";

const FILTER_DEFS: { key: ReqStatusFilter; label: string }[] = [
  { key: "ALL", label: "전체" },
  { key: "OPEN", label: "입찰중" },
  { key: "PENDING_PAYMENT", label: "결제대기" },
  { key: "SELECTED", label: "선정완료" },
  { key: "IN_PROGRESS", label: "시공중" },
  { key: "DONE", label: "시공완료" },
  { key: "CANCELLED", label: "취소됨" },
];

// 선정완료(SELECTED) 요청은 이후 실제 시공건(Reservation)의 상태에 따라 결제대기(선정만 하고 결제 전)/
// 선정완료(착수전, 결제완료)/시공중/시공완료로 더 세분화해서 보여준다 — progressByRequest는 requestNo ->
// Reservation.status가 PENDING_PAYMENT면 그 값 그대로, 아니면 progressStatus(APPLIED/IN_PROGRESS/DONE)를 담은 맵
export function displayStatus(request: BidRequestApi, progressByRequest: Record<string, string>): ReqStatusFilter | "CLOSED" {
  if (request.status !== "SELECTED") return request.status as ReqStatusFilter | "CLOSED";
  const progress = progressByRequest[request.requestNo];
  if (progress === "PENDING_PAYMENT") return "PENDING_PAYMENT";
  if (progress === "IN_PROGRESS") return "IN_PROGRESS";
  if (progress === "DONE") return "DONE";
  return "SELECTED";
}

const STATUS_BADGE_META: Record<ReqStatusFilter | "CLOSED", { label: string; className: string }> = {
  ALL: { label: "", className: "" }, // displayStatus는 ALL을 반환하지 않음(타입 완전성용)
  OPEN: { label: "입찰중", className: "bg-status-warning-bg text-status-warning" },
  PENDING_PAYMENT: { label: "결제대기", className: "bg-status-warning-bg text-status-warning" },
  SELECTED: { label: "선정완료", className: "bg-status-success-bg text-status-success" },
  IN_PROGRESS: { label: "시공중", className: "bg-brand-subtle text-brand" },
  DONE: { label: "시공완료", className: "text-[#0E9A96] bg-[#0E9A9614]" },
  CANCELLED: { label: "취소됨", className: "bg-gray-100 text-gray-500" },
  CLOSED: { label: "마감", className: "bg-gray-100 text-gray-500" },
};

interface BookingScreenProps {
  requests: BidRequestApi[];
  loading: boolean;
  filter: ReqStatusFilter;
  onChangeFilter: (filter: ReqStatusFilter) => void;
  /** requestNo -> 실제 시공건(Reservation) progressStatus — 선정완료 요청의 시공중/시공완료 세분화에 사용 */
  progressByRequest: Record<string, string>;
  carLabel: (car: BidRequestCarApi | null) => string | null;
  onOpenRequest: (request: BidRequestApi) => void;
  onCancelRequest: (request: BidRequestApi) => void;
  onStartRequest: () => void;
  onExit: () => void;
  onOpenShop: () => void;
  onOpenMyPage: () => void;
  onNavToast: (label: string) => void;
  onRefresh: () => Promise<void>;
}

export default function BookingScreen({
  requests,
  loading,
  filter,
  onChangeFilter,
  progressByRequest,
  carLabel,
  onOpenRequest,
  onCancelRequest,
  onStartRequest,
  onExit,
  onOpenShop,
  onOpenMyPage,
  onNavToast,
  onRefresh,
}: BookingScreenProps) {
  const filtered =
    filter === "ALL" ? requests : requests.filter((r) => displayStatus(r, progressByRequest) === filter);

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex h-[98px] flex-none items-center bg-white px-[18px] pt-[46px]">
        <span className="text-[19px] font-extrabold tracking-tight text-gray-900">예약시공</span>
      </div>

      <PullToRefresh onRefresh={onRefresh} className="mp-scroll flex-1 overflow-y-auto px-5 pt-5 pb-[26px]">
        <div className="mx-0.5 mb-3 flex items-center justify-between">
          <span className="text-[15px] font-extrabold text-gray-900">진행중인 요청</span>
          <span className="text-xs font-bold text-gray-500">{filtered.length}건</span>
        </div>

        <div className="mp-scroll mb-3 flex gap-1.5 overflow-x-auto pb-0.5">
          {FILTER_DEFS.map((f) => {
            const on = filter === f.key;
            return (
              <span
                key={f.key}
                onClick={() => onChangeFilter(f.key)}
                className={`flex-none cursor-pointer rounded-full px-[15px] py-[7px] text-[12.5px] ${
                  on ? "bg-brand font-extrabold text-white" : "bg-gray-50 font-semibold text-gray-600"
                }`}
              >
                {f.label}
              </span>
            );
          })}
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white py-10 text-center text-sm text-gray-400 shadow-sm">
            {requests.length === 0 ? "아직 등록한 요청이 없어요" : "해당하는 요청이 없어요"}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((r) => {
              const daysLeft = Math.max(0, Math.ceil((new Date(r.bidDeadline).getTime() - Date.now()) / 86400000));
              const reqTypeLabel = r.reqType === "EXPERT" ? "전문가 추천" : "일반 입찰";
              const cancelled = r.status === "CANCELLED";
              const selected = r.status === "SELECTED";
              const closed = r.status === "CLOSED";
              const finalized = cancelled || selected || closed; // 취소·선정완료(시공중·시공완료 포함)·마감 — 더 이상 취소/재입찰 액션 불필요
              const badge = STATUS_BADGE_META[displayStatus(r, progressByRequest)];
              const car = carLabel(r.car);
              return (
                <div
                  key={r.requestNo}
                  onClick={cancelled ? undefined : () => onOpenRequest(r)}
                  className={`rounded-2xl border border-gray-200 bg-white p-4 shadow-sm ${cancelled ? "opacity-60" : "cursor-pointer"}`}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[11px] ${
                        cancelled ? "bg-gray-100 text-gray-400" : "bg-brand-subtle text-brand"
                      }`}
                    >
                      {r.reqType === "EXPERT" ? <RecoIcon /> : <BidIcon />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14.5px] font-bold text-gray-900">
                        {itemSummary(r)} · {reqTypeLabel}
                      </div>
                      <div className="mt-[3px] text-[11.5px] text-gray-500">
                        {!finalized
                          ? `요청 ${formatMonthDay(r.createdAt)} · 입찰 마감 D-${daysLeft}`
                          : `요청 ${formatMonthDay(r.createdAt)}`}
                      </div>
                    </div>
                    <span className={`flex-none rounded-md px-[9px] py-1 text-[10.5px] font-extrabold ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-2 border-t border-gray-100 pt-3">
                    <div className="flex flex-col gap-0.5 text-xs text-gray-600">
                      {car && <span>{car}</span>}
                      <span>희망 시공일 {r.desiredDate}</span>
                    </div>
                    {!finalized && (
                      <span className="flex flex-none items-center gap-3">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            onCancelRequest(r);
                          }}
                          className="text-xs font-bold text-gray-400"
                        >
                          요청 취소
                        </span>
                        <span className="text-xs font-bold text-brand">입찰 비교 ›</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-[18px] rounded-xl bg-gray-100 p-3.5 text-[12.5px] leading-relaxed text-gray-600">
          직접 항목·제품을 고르는 <b>일반 입찰</b>과, 예산만 알려주면 전문가가 추천하는 <b>전문가 추천</b> 중 선택할 수 있어요.
        </div>
      </PullToRefresh>

      <div className="flex-none border-t border-gray-100 bg-white px-5 py-3">
        <Button size="xl" onClick={onStartRequest}>
          새 견적 요청하기
        </Button>
      </div>

      <div className="flex h-[66px] flex-none border-t border-gray-100 bg-white pb-2">
        {NAV_ITEMS.map(({ key, label, Icon, active }) => (
          <div
            key={key}
            onClick={() =>
              active
                ? undefined
                : key === "home"
                  ? onExit()
                  : key === "shop"
                    ? onOpenShop()
                    : key === "my"
                      ? onOpenMyPage()
                      : onNavToast(label)
            }
            className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-1"
          >
            <Icon color={active ? "var(--color-brand)" : "var(--text-tertiary)"} />
            <span className={`text-[10.5px] ${active ? "font-bold text-brand" : "font-medium text-gray-500"}`}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
