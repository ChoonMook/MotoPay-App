// CU-RSVC-16 / CU-NCPK-10: 시공완료·인수확인 - 업체 업로드 시공 사진 확인 후 인수확인, 3일 미확인 시 자동확정
// 신차패키지·예약시공 등 여러 채널에서 공통으로 쓰는 화면. 신차패키지는 시공 정보 요약 카드(차량·VIN·품목)를 함께 보여준다.
import { useState } from "react";
import Button from "../../components/ui/Button";
import PhotoLightbox from "../../components/ui/PhotoLightbox";
import CommonHeader from "./CommonHeader";
import { WarnIcon, StarIcon } from "./commonIcons";
import type { HandoverStatus } from "./commonTypes";

export interface WrittenReview {
  rating: number;
  content: string;
}

export interface VehicleSummaryItem {
  name: string;
  prod?: string;
  sub: string;
  tag: "기본" | "업그레이드";
  tintDetail?: string;
}

export interface VehicleSummary {
  car: string;
  vin: string;
  packageName?: string | null;
  items: VehicleSummaryItem[];
}

interface CstDoneHandoverScreenProps {
  selName: string;
  handover: HandoverStatus;
  vehicleSummary?: VehicleSummary;
  /** 파트너가 완료 등록 시 첨부한 시공 사진의 실제 URL 목록 */
  photos: string[];
  /** 이미 작성된 후기 — 있으면 후기 작성 버튼 대신 별점·내용을 그대로 보여줌 */
  review?: WrittenReview | null;
  loading?: boolean;
  confirming?: boolean;
  onBack: () => void;
  onConfirmHandover: () => void;
}

export default function CstDoneHandoverScreen({
  selName,
  handover,
  vehicleSummary,
  photos,
  review,
  loading = false,
  confirming = false,
  onBack,
  onConfirmHandover,
}: CstDoneHandoverScreenProps) {
  const done = handover === "done";
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <CommonHeader title="시공완료 · 인수확인" onBack={onBack} />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-[18px] pb-6">
        <div className="flex items-center gap-2 rounded-xl bg-status-success-bg px-[15px] py-3">
          <span className="flex-none text-green-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <span className="text-[13px] font-bold text-green-600">{selName} 시공이 완료됐어요</span>
        </div>

        {vehicleSummary && (
          <div className="mt-[18px] rounded-[14px] border border-gray-200 bg-white px-4 pt-4 pb-1.5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold text-gray-500">시공 차량</span>
                <span className="text-[15px] font-extrabold tracking-tight text-gray-900">{vehicleSummary.car}</span>
              </div>
              <span className="text-[11px] font-semibold text-gray-500 tabular-nums">VIN {vehicleSummary.vin}</span>
            </div>
            {vehicleSummary.packageName && (
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500">패키지</span>
                <span className="text-[13px] font-bold text-gray-800">{vehicleSummary.packageName}</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-0.5">
              {vehicleSummary.items.map((it, i) => (
                <div
                  key={it.name}
                  className={`flex items-center justify-between gap-2.5 py-3 ${i < vehicleSummary.items.length - 1 ? "border-b border-gray-100" : ""}`}
                >
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-bold text-gray-900">{it.name}</div>
                    {it.prod && <div className="mt-0.5 text-xs font-semibold text-gray-600">{it.prod}</div>}
                    <div className="mt-px text-[11.5px] text-gray-500">{it.sub}</div>
                    {it.tintDetail && <div className="mt-0.5 text-[11.5px] text-gray-500">{it.tintDetail}</div>}
                  </div>
                  <span
                    className={`flex-none rounded-md px-2 py-[3px] text-[10.5px] font-extrabold ${
                      it.tag === "업그레이드" ? "bg-brand-subtle text-brand" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {it.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mx-0.5 mt-5 mb-2.5 flex items-center justify-between">
          <span className="text-sm font-extrabold text-gray-900">시공 완료 사진</span>
          <span className="text-xs text-gray-500">업체 업로드 · {photos.length}장</span>
        </div>
        {loading ? (
          <div className="py-10 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {photos.map((url) => (
              <span
                key={url}
                onClick={() => setViewingPhotoUrl(url)}
                className="relative aspect-square cursor-pointer overflow-hidden rounded-[10px] bg-gray-100"
              >
                <img src={url} alt="시공 사진" className="h-full w-full object-cover object-center" />
              </span>
            ))}
          </div>
        )}

        <div className="mt-[18px] flex items-start gap-[9px] rounded-xl bg-gray-100 px-[15px] py-[13px]">
          <span className="mt-px flex-none text-gray-500">
            <WarnIcon />
          </span>
          <div className="text-xs leading-relaxed text-gray-600">
            <b>3일 이내 인수확인</b>하지 않으면 자동으로 확정 처리돼요. 착수 후 업체가 취소하는 경우 결제 금액은 전액 환불돼요.
          </div>
        </div>
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-6">
        {done && review ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5">
            <div className="mb-1.5 flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <StarIcon key={n} color={n <= review.rating ? "var(--color-accent)" : "var(--gray-200)"} />
              ))}
            </div>
            <div className="text-[13px] leading-relaxed whitespace-pre-wrap text-gray-700">
              {review.content || "작성된 후기 내용이 없어요"}
            </div>
          </div>
        ) : (
          <Button size="xl" disabled={confirming} onClick={onConfirmHandover}>
            {confirming ? "처리 중..." : done ? "후기 작성하기" : "인수 확인하기"}
          </Button>
        )}
      </div>

      <PhotoLightbox photoUrl={viewingPhotoUrl} onClose={() => setViewingPhotoUrl(null)} />
    </div>
  );
}
