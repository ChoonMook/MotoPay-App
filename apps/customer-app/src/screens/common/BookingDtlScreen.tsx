// CU-RSVC-20: 예약 상세(진행현황) - 선정 업체·일정·항목·진행 상태 타임라인, 일정변경·예약취소 진입점
// 신차패키지·예약시공 공용 화면
import shopThumb from "../../assets/images/shop.png";
import CommonHeader from "./CommonHeader";
import Button from "../../components/ui/Button";
import { ChevronRightIcon, AlertCircleIcon } from "./commonIcons";
import { nfmt } from "../ncp/ncpFormat";
import type { PackageSelectionItemView } from "./commonTypes";

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
  /** 신차패키지(PKG)에서만 전달 — 시공 항목별 제품·가격(썬팅은 부위별 농도) 상세 카드. 없으면 표시하지 않음(예약시공 채널은 미사용) */
  items?: PackageSelectionItemView[];
  /** items와 함께 전달 — 시공 항목 카드 하단에 표시할 총액 */
  priceLabel?: string;
  /** priceLabel 행의 라벨 텍스트 — 신차패키지는 "업그레이드 차액", 예약시공은 "확정 견적" 등 채널마다 다름 */
  priceRowLabel?: string;
  timeline: BookingTimelineStep[];
  cancelled: boolean;
  cancelReasonLabel?: string;
  cancelRefundLabel?: string;
  cancellable: boolean;
  /** true면 업체명·시공항목 등 아직 확정되지 않은 값이 화면에 잠깐 보였다가 바뀌는 걸 막기 위해 스피너만 보여줌 */
  loading?: boolean;
  onOpenResched: () => void;
  onOpenCancel: () => void;
}

export default function BookingDtlScreen({
  onBack,
  shopName,
  shopMeta,
  onOpenProfile,
  bookingRows,
  items,
  priceLabel,
  priceRowLabel = "업그레이드 차액",
  timeline,
  cancelled,
  cancelReasonLabel,
  cancelRefundLabel,
  cancellable,
  loading = false,
  onOpenResched,
  onOpenCancel,
}: BookingDtlScreenProps) {
  if (loading) {
    return (
      <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
        <CommonHeader title="예약 상세" onBack={onBack} />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-brand" />
        </div>
      </div>
    );
  }

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

        {items && items.length > 0 && (
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white px-4 shadow-sm">
            <div className="pt-3.5 pb-1 text-xs font-bold text-gray-500">시공 항목</div>
            {items.map((it, i) => (
              <div key={`${it.category}-${it.product}-${i}`} className="border-b border-gray-100 py-3">
                <div className="flex items-center justify-between gap-2.5">
                  <div className="min-w-0">
                    {it.category && <div className="text-[11px] text-gray-500">{it.category}</div>}
                    <div className={`text-[13px] font-bold text-gray-900 ${it.category ? "mt-0.5" : ""}`}>{it.product}</div>
                  </div>
                  <span className="flex-none text-[13px] font-bold text-gray-900">
                    {it.price > 0 ? `+${nfmt(it.price)}원` : "기본 포함"}
                  </span>
                </div>
                {it.tintDetail && <div className="mt-1.5 text-[11px] text-gray-500">{it.tintDetail}</div>}
              </div>
            ))}
            {priceLabel && (
              <div className="flex items-center justify-between py-3.5">
                <span className="text-xs text-gray-500">{priceRowLabel}</span>
                <span className="text-right text-[13px] font-bold text-gray-900">{priceLabel}</span>
              </div>
            )}
          </div>
        )}

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
