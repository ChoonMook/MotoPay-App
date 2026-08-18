// 신차패키지 시공현황 상세 팝업(AD-NCPK-07 부속) — 고객·차량·패키지 구성상품·완료 정보를 한 화면으로 조회.
// 조회 전용(수정 없음)
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { API_BASE_URL } from "../../api/config";
import {
  getAdminPackageReservationDetail,
  type AdminPackageReservationDetail,
} from "../../api/ncpkReservations";

const STATUS_COLOR: Record<string, string> = {
  CONFIRMED: "text-blue-700",
  CANCELLED: "text-red-600",
};

const PROGRESS_COLOR: Record<string, string> = {
  APPLIED: "text-amber-700",
  IN_PROGRESS: "text-blue-700",
  DONE: "text-green-700",
};

const TINT_POSITION_LABEL: Record<string, string> = {
  FRONT: "전면유리",
  SIDE_1: "측면 1열",
  SIDE_2: "측면 2열",
  REAR: "후면유리",
  SUNROOF: "선루프",
};

const ITEM_TAG_LABEL: Record<string, string> = {
  BASIC: "기본",
  OPTION: "업그레이드",
};

function nfmt(n: number): string {
  return n.toLocaleString("en-US");
}

function formatDateTime(value: string): string {
  return value.replace("T", " ").slice(0, 16);
}

interface NcpkStatDetailModalProps {
  reservationNo: string;
  statusLabel: (code: string) => string;
  progressLabel: (code: string) => string;
  prodCatLabel: (code: string) => string;
  onClose: () => void;
  onError: (message: string) => void;
}

export default function NcpkStatDetailModal({
  reservationNo,
  statusLabel,
  progressLabel,
  prodCatLabel,
  onClose,
  onError,
}: NcpkStatDetailModalProps) {
  const [detail, setDetail] = useState<AdminPackageReservationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAdminPackageReservationDetail(reservationNo)
      .then(setDetail)
      .catch((err) => {
        onError(err instanceof Error ? err.message : "상세 정보를 불러오지 못했습니다.");
        onClose();
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationNo]);

  const positionsText = (() => {
    if (!detail || detail.tintPositions.length === 0) return null;
    return detail.tintPositions
      .map((p) => `${TINT_POSITION_LABEL[p.position] ?? p.position} ${p.level}%`)
      .join(" · ");
  })();

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
      <div className="flex h-full max-h-[88vh] w-full max-w-[820px] flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-outline-variant/60 px-6 py-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-secondary">예약번호 {reservationNo}</h3>
            {detail && (
              <>
                <span className={`text-xs font-bold ${STATUS_COLOR[detail.status] ?? "text-gray-600"}`}>
                  {statusLabel(detail.status)}
                </span>
                {detail.status === "CONFIRMED" && (
                  <span className={`text-xs font-bold ${PROGRESS_COLOR[detail.progressStatus] ?? "text-gray-600"}`}>
                    {progressLabel(detail.progressStatus)}
                  </span>
                )}
              </>
            )}
          </div>
          <button type="button" onClick={onClose} className="text-outline hover:text-on-surface">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loading || !detail ? (
            <div className="py-16 text-center text-xs text-on-surface-variant">불러오는 중...</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl border border-outline-variant/30 bg-surface-container-low p-4 text-xs">
                <div>
                  <span className="text-on-surface-variant">고객명</span>
                  <div className="mt-0.5 font-bold text-secondary">{detail.customerName}</div>
                </div>
                <div>
                  <span className="text-on-surface-variant">연락처</span>
                  <div className="mt-0.5 font-bold text-secondary">{detail.phoneMasked}</div>
                </div>
                <div>
                  <span className="text-on-surface-variant">차량</span>
                  <div className="mt-0.5 font-bold text-secondary">{detail.car ?? "-"}</div>
                </div>
                <div>
                  <span className="text-on-surface-variant">VIN</span>
                  <div className="mt-0.5 font-bold text-secondary">{detail.vin ?? "-"}</div>
                </div>
                <div>
                  <span className="text-on-surface-variant">딜러사</span>
                  <div className="mt-0.5 font-bold text-secondary">{detail.dealerName ?? "-"}</div>
                </div>
                <div>
                  <span className="text-on-surface-variant">시공업체</span>
                  <div className="mt-0.5 font-bold text-secondary">{detail.shopName}</div>
                </div>
                <div>
                  <span className="text-on-surface-variant">예약일시</span>
                  <div className="mt-0.5 font-bold text-secondary">
                    {detail.date} {detail.time}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-on-surface-variant">패키지</span>
                  <div className="mt-0.5 font-bold text-secondary">{detail.packageName ?? "-"}</div>
                </div>
                {detail.status === "CANCELLED" && (
                  <div className="col-span-2 rounded-lg bg-red-50 px-3 py-2 text-red-700">
                    <span className="font-bold">취소사유</span> {detail.cancelReason}
                    {detail.cancelReasonEtc ? ` — ${detail.cancelReasonEtc}` : ""}
                  </div>
                )}
              </div>

              <div className="mt-6 mb-2 text-xs font-bold text-secondary">시공 항목 ({detail.items.length}건)</div>
              {detail.items.length === 0 ? (
                <div className="rounded-xl border border-outline-variant/30 bg-white py-8 text-center text-xs text-on-surface-variant">
                  연결된 패키지 구성상품이 없습니다.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {detail.items.map((it, i) => (
                    <div
                      key={`${it.name}-${i}`}
                      className="flex items-center justify-between rounded-xl border border-outline-variant/30 bg-white p-4 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        {it.prodCat && <div className="text-on-surface-variant">{prodCatLabel(it.prodCat)}</div>}
                        <div className="mt-0.5 font-bold text-secondary">{it.name}</div>
                        {it.spec && <div className="mt-0.5 text-on-surface-variant">{it.spec}</div>}
                        {it.prodCat === "TINT" && positionsText && (
                          <div className="mt-0.5 text-on-surface-variant">{positionsText}</div>
                        )}
                      </div>
                      <div className="flex flex-none items-center gap-3">
                        <span className="font-bold text-secondary">{nfmt(it.price)}원</span>
                        <span className="text-on-surface-variant">{ITEM_TAG_LABEL[it.tag] ?? it.tag}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {detail.progressStatus === "DONE" && (
                <div className="mt-6 rounded-xl border border-outline-variant/30 bg-white p-4 text-xs">
                  <div className="mb-2 font-bold text-secondary">시공 완료 정보</div>
                  <div className="flex flex-col gap-1.5 text-on-surface-variant">
                    <div>완료일시: {detail.completedAt ? formatDateTime(detail.completedAt) : "-"}</div>
                    <div>인수확인: {detail.handoverConfirmedAt ? formatDateTime(detail.handoverConfirmedAt) : "대기중"}</div>
                    {detail.completionMemo && <div>작업메모: {detail.completionMemo}</div>}
                  </div>
                  {detail.photos.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {detail.photos.map((p) => (
                        <img
                          key={p}
                          src={`${API_BASE_URL}/uploads/${p}`}
                          alt="시공 사진"
                          className="h-20 w-20 rounded-lg border border-outline-variant/30 object-cover"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
