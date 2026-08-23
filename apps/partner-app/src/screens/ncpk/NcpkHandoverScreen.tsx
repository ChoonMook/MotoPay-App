// PT-NCPK-05: 인수확인 현황 - 고객의 실제 인수확인 상태 조회(직접 확인 또는 완료일로부터 3일 경과 시 자동확정), 인수확인 알림 재발송
import { useState } from "react";
import { API_BASE_URL } from "../../api/config";
import Button from "../../components/ui/Button";
import PhotoLightbox from "../../components/ui/PhotoLightbox";
import { CheckBadgeIcon } from "./ncpkIcons";
import type { PackageJobDetail } from "../../api/reservations";

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];
const HANDOVER_AUTO_CONFIRM_DAYS = 3;

function formatDateTimeLabel(iso: string): string {
  const d = new Date(iso);
  const wd = WEEKDAY_KO[d.getDay()];
  const hh = d.getHours();
  const ampm = hh < 12 ? "오전" : "오후";
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}(${wd}) ${ampm} ${hour12}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// 업체 기본 정산일(Shop.settlementDay, 관리자가 AD-CO-02에서 설정)을 그대로 문구로 노출 —
// 이전엔 "익월 10일"로 고정 문구였는데 실제 업체별 정산일과 다를 수 있어 동적으로 바꿈(2026-08-23)
function formatSettlementLabel(settlementDay: number | null): string {
  return settlementDay ? `인수 확정 후 익월 ${settlementDay}일` : "정산일 미설정";
}

interface NcpkHandoverScreenProps {
  job: PackageJobDetail;
  settlementDay: number | null;
  onBack: () => void;
  onRemind: () => void;
}

export default function NcpkHandoverScreen({ job, settlementDay, onBack, onRemind }: NcpkHandoverScreenProps) {
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);
  const hoPending = !job.handoverConfirmedAt;
  const photos = job.photos.map((p) => `${API_BASE_URL}/uploads/${p}`);

  const hoRows = [
    { k: "시공 완료", v: job.completedAt ? formatDateTimeLabel(job.completedAt) : "-" },
    { k: "인수확인 요청", v: job.completedAt ? formatDateTimeLabel(job.completedAt) : "-" },
    hoPending
      ? {
          k: "자동 확정 예정",
          v: job.completedAt
            ? formatDateTimeLabel(
                new Date(
                  new Date(job.completedAt).getTime() + HANDOVER_AUTO_CONFIRM_DAYS * 24 * 60 * 60 * 1000,
                ).toISOString(),
              )
            : "-",
        }
      : { k: "인수확인일", v: formatDateTimeLabel(job.handoverConfirmedAt!) },
    { k: "정산 예정", v: formatSettlementLabel(settlementDay) },
  ];

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex-none border-b border-gray-100 bg-white pt-[50px] px-3">
        <div className="flex h-[50px] items-center gap-1.5">
          <span onClick={onBack} className="flex h-9 w-9 cursor-pointer items-center justify-center text-[22px] text-gray-800">
            ‹
          </span>
          <span className="text-[17px] font-bold text-gray-900">인수확인 현황</span>
        </div>
      </div>

      <div className="mp-scroll flex-1 overflow-y-auto px-5 py-[18px]">
        <div
          className={`flex items-start gap-3 rounded-2xl p-4 ${
            hoPending ? "bg-brand-subtle" : "border border-green-500 bg-status-success-bg"
          }`}
        >
          <span
            className={`flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full ${
              hoPending ? "bg-brand" : "bg-status-success"
            }`}
          >
            <CheckBadgeIcon />
          </span>
          <div>
            <div className={`text-[14.5px] font-extrabold ${hoPending ? "text-brand" : "text-green-600"}`}>
              {hoPending ? "고객 인수확인을 기다리고 있어요" : "인수가 확정됐어요"}
            </div>
            <div className="mt-[3px] text-[12.5px] text-gray-600">
              {hoPending ? "3일 내 미확인 시 자동으로 인수 확정돼요." : "정산 대상에 포함되었어요."}
            </div>
          </div>
        </div>

        <div className="my-4 rounded-2xl border border-gray-200 bg-white px-4 shadow-sm">
          {hoRows.map((r, i) => (
            <div
              key={r.k}
              className={`flex items-center justify-between py-[13px] ${i < hoRows.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <span className="text-[13px] text-gray-500">{r.k}</span>
              <span className="text-[13.5px] font-semibold text-gray-800">{r.v}</span>
            </div>
          ))}
        </div>

        {job.completionMemo && (
          <>
            <div className="mx-0.5 mb-2.5 text-[15px] font-extrabold text-gray-900">작업 메모</div>
            <div className="mb-[18px] rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-[13.5px] leading-relaxed text-gray-700">
              {job.completionMemo}
            </div>
          </>
        )}

        <div className="mx-0.5 mb-2.5 text-[15px] font-extrabold text-gray-900">
          고객에게 전달된 시공 사진
        </div>
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, i) => (
            <div
              key={i}
              onClick={() => setViewingPhotoUrl(photo)}
              className="flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-gray-100"
            >
              <img src={photo} alt="시공 사진" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>

        <div className="mt-[18px] rounded-xl bg-gray-100 px-[15px] py-[13px] text-[12.5px] leading-[1.55] text-gray-600">
          고객이 3일 내 확인하지 않으면 자동 인수 확정되며, 확정 시점부터 정산 대상에 포함돼요.
        </div>
      </div>

      {hoPending && (
        <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-[22px]">
          <Button variant="outline" onClick={onRemind}>
            인수확인 알림 재발송
          </Button>
        </div>
      )}

      <PhotoLightbox photoUrl={viewingPhotoUrl} onClose={() => setViewingPhotoUrl(null)} />
    </div>
  );
}
