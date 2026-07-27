// CU-RSVC-20: 예약 상세(진행현황) - 선정 업체·일정·항목·진행 상태 타임라인, 일정변경·예약취소 진입점
// 신차패키지·예약시공 공용 화면
import shopThumb from "../../assets/images/shop.png";
import CommonHeader from "./CommonHeader";
import Button from "../../components/ui/Button";
import { ChevronRightIcon, AlertCircleIcon } from "./commonIcons";

export interface BookingTimelineStep {
  label: string;
  date?: string;
  state: "done" | "active" | "pending" | "cancelled";
}

interface BookingDtlScreenProps {
  onBack: () => void;
  shopName: string;
  /** 업체 카드 부제 — 평점 라인("★ 4.9 · 후기 1,284 · 2.1km") 등 채널마다 다른 문구를 그대로 전달 */
  shopMeta: string;
  /** 없으면 업체 카드가 클릭 불가(프로필 화면 없는 채널용) */
  onOpenProfile?: () => void;
  bookingRows: Array<[string, string]>;
  timeline: BookingTimelineStep[];
  cancelled: boolean;
  cancelReasonLabel?: string;
  cancelRefundLabel?: string;
  cancellable: boolean;
  onOpenResched: () => void;
  onOpenCancel: () => void;
}

export default function BookingDtlScreen({
  onBack,
  shopName,
  shopMeta,
  onOpenProfile,
  bookingRows,
  timeline,
  cancelled,
  cancelReasonLabel,
  cancelRefundLabel,
  cancellable,
  onOpenResched,
  onOpenCancel,
}: BookingDtlScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <CommonHeader title="예약 상세" onBack={onBack} />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-[18px] pb-6">
        <div
          onClick={onOpenProfile}
          className={`flex items-center gap-3 rounded-[14px] border border-gray-200 bg-white p-3.5 shadow-sm ${onOpenProfile ? "cursor-pointer" : ""}`}
        >
          <span className="h-[52px] w-[52px] flex-none overflow-hidden rounded-xl bg-gray-100">
            <img src={shopThumb} alt="선정 업체" className="h-full w-full object-cover" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[14.5px] font-bold text-gray-900">{shopName}</div>
            <div className="mt-[3px] text-xs text-gray-500">{shopMeta}</div>
          </div>
          {onOpenProfile && (
            <span className="flex-none text-gray-500">
              <ChevronRightIcon />
            </span>
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white px-4 shadow-sm">
          {bookingRows.map(([k, v], i) => (
            <div key={k} className={`flex items-center justify-between py-3.5 ${i < bookingRows.length - 1 ? "border-b border-gray-100" : ""}`}>
              <span className="text-xs text-gray-500">{k}</span>
              <span className="text-right text-[13px] font-bold text-gray-900">{v}</span>
            </div>
          ))}
        </div>

        {cancelled && (
          <div className="mt-4 flex items-center gap-2.5 rounded-[14px] border border-status-danger bg-status-danger-bg px-4 py-3.5">
            <span className="flex-none text-status-danger">
              <AlertCircleIcon />
            </span>
            <div>
              <div className="text-sm font-extrabold text-status-danger">예약이 취소됐어요</div>
              <div className="mt-px text-[11.5px] text-gray-600">
                {cancelReasonLabel} · {cancelRefundLabel}
              </div>
            </div>
          </div>
        )}

        <div className="mx-0.5 mt-[22px] mb-3.5 text-[13px] font-extrabold text-gray-900">진행 상태</div>
        <div className="flex flex-col">
          {timeline.map((t, i) => {
            const dotColor =
              t.state === "cancelled" ? "bg-status-danger" : t.state === "done" || t.state === "active" ? "bg-brand" : "bg-gray-200";
            const lineColor = t.state === "done" ? "bg-brand" : "bg-gray-200";
            const textClass =
              t.state === "cancelled"
                ? "font-extrabold text-status-danger"
                : t.state === "active"
                  ? "font-extrabold text-brand"
                  : t.state === "done"
                    ? "font-semibold text-gray-800"
                    : "font-semibold text-gray-500";
            return (
              <div key={t.label} className="flex gap-3">
                <div className="flex w-5 flex-none flex-col items-center">
                  <span className={`h-3 w-3 rounded-full ${dotColor}`} />
                  {i < timeline.length - 1 && <span className={`min-h-[22px] w-0.5 flex-1 ${lineColor}`} />}
                </div>
                <div className="flex-1 pb-[22px]">
                  <div className={`text-[13.5px] ${textClass}`}>{t.label}</div>
                  {t.date && <div className="mt-0.5 text-[11.5px] text-gray-500">{t.date}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {cancellable && (
        <div className="flex flex-none gap-2.5 border-t border-gray-100 bg-white px-5 pt-3 pb-6">
          <div className="flex-1">
            <Button variant="secondary" size="lg" onClick={onOpenResched}>
              일정 변경
            </Button>
          </div>
          <div className="flex-1">
            <Button variant="outline" size="lg" onClick={onOpenCancel}>
              예약 취소
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
