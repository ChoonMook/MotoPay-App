// 예약시공현황 상세 팝업(AD-RSVC-02 부속) — 요청 원본 + 요청유형에 맞는 응찰(일반입찰)·추천안(전문가추천) 비교.
// 조회 전용(수정 없음) — CompanyDetailModal과 달리 탭 없이 스크롤 한 화면으로 구성
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getAdminBidRequestDetail, type AdminBidRequestDetail, type AdminBidOffer, type AdminBidPlan } from "../../api/bidRequests";

const REQ_TYPE_COLOR: Record<string, string> = {
  GENERAL: "text-blue-700",
  EXPERT: "text-purple-700",
};

const STATUS_COLOR: Record<string, string> = {
  OPEN: "text-amber-700",
  CLOSED: "text-gray-500",
  SELECTED: "text-green-700",
  CANCELLED: "text-red-600",
};

const TINT_POSITION_LABEL: Record<string, string> = {
  FRONT: "전면유리",
  SIDE_1: "측면 1열",
  SIDE_2: "측면 2열",
  REAR: "후면유리",
  SUNROOF: "선루프",
};

function nfmt(n: number): string {
  return n.toLocaleString("en-US");
}

function formatDateTime(value: string): string {
  return value.replace("T", " ").slice(0, 16);
}

interface RsvStatDetailModalProps {
  requestNo: string;
  carBrandLabel: (code: string) => string;
  carModelLabel: (code: string) => string;
  carInstLabel: (code: string) => string;
  reqTypeLabel: (code: string) => string;
  reqStatusLabel: (code: string) => string;
  onClose: () => void;
  onError: (message: string) => void;
}

function offerTotal(offer: AdminBidOffer): number {
  return offer.items.reduce((sum, it) => sum + it.price, 0);
}

function planTotal(plan: AdminBidPlan): number {
  return plan.items.reduce((sum, it) => sum + it.offerPrice, 0);
}

export default function RsvStatDetailModal({
  requestNo,
  carBrandLabel,
  carModelLabel,
  carInstLabel,
  reqTypeLabel,
  reqStatusLabel,
  onClose,
  onError,
}: RsvStatDetailModalProps) {
  const [detail, setDetail] = useState<AdminBidRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAdminBidRequestDetail(requestNo)
      .then(setDetail)
      .catch((err) => {
        onError(err instanceof Error ? err.message : "상세 정보를 불러오지 못했습니다.");
        onClose();
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestNo]);

  const carText = (() => {
    if (!detail?.car) return "-";
    const label = `${carBrandLabel(detail.car.carBrandCode)} ${carModelLabel(detail.car.carModelCode)}`;
    return detail.car.trimName ? `${label} ${detail.car.trimName}` : label;
  })();

  const itemsText = (() => {
    if (!detail) return "-";
    return detail.items
      .map((it) => (it.productName ? `${carInstLabel(it.instCode)}(${it.productName})` : carInstLabel(it.instCode)))
      .join(", ");
  })();

  const positionsText = (() => {
    if (!detail || detail.positions.length === 0) return null;
    return detail.positions.map((p) => `${TINT_POSITION_LABEL[p.position] ?? p.position} ${p.level}%`).join(" · ");
  })();

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
      <div className="flex h-full max-h-[88vh] w-full max-w-[900px] flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-outline-variant/60 px-6 py-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-secondary">요청번호 {requestNo}</h3>
            {detail && (
              <>
                <span className={`text-xs font-bold ${REQ_TYPE_COLOR[detail.reqType] ?? "text-gray-600"}`}>
                  {reqTypeLabel(detail.reqType)}
                </span>
                <span className={`text-xs font-bold ${STATUS_COLOR[detail.status] ?? "text-gray-600"}`}>
                  {reqStatusLabel(detail.status)}
                </span>
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
                  <span className="text-on-surface-variant">차종</span>
                  <div className="mt-0.5 font-bold text-secondary">{carText}</div>
                </div>
                <div className="col-span-2">
                  <span className="text-on-surface-variant">시공 항목</span>
                  <div className="mt-0.5 font-bold text-secondary">{itemsText}</div>
                  {positionsText && <div className="mt-0.5 text-on-surface-variant">{positionsText}</div>}
                </div>
                <div>
                  <span className="text-on-surface-variant">희망 시공일</span>
                  <div className="mt-0.5 font-bold text-secondary">{detail.desiredDate}</div>
                </div>
                <div>
                  <span className="text-on-surface-variant">입찰 마감일시</span>
                  <div className="mt-0.5 font-bold text-secondary">{formatDateTime(detail.bidDeadline)}</div>
                </div>
                {detail.reqType === "GENERAL" ? (
                  <>
                    <div>
                      <span className="text-on-surface-variant">검색 반경</span>
                      <div className="mt-0.5 font-bold text-secondary">{detail.radiusKm}km</div>
                    </div>
                    <div>
                      <span className="text-on-surface-variant">업체 평점 조건</span>
                      <div className="mt-0.5 font-bold text-secondary">
                        {detail.minRating ? `${detail.minRating.toFixed(1)}★ 이상` : "전체"}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-on-surface-variant">희망 예산</span>
                      <div className="mt-0.5 font-bold text-secondary">{detail.budget != null ? `${nfmt(detail.budget)}원 이하` : "-"}</div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-on-surface-variant">요청사항</span>
                      <div className="mt-0.5 font-bold text-secondary">{detail.note || "-"}</div>
                    </div>
                  </>
                )}
                {detail.status === "CANCELLED" && (
                  <div className="col-span-2 rounded-lg bg-red-50 px-3 py-2 text-red-700">
                    <span className="font-bold">취소사유</span> {detail.cancelReason}
                    {detail.cancelReasonNote ? ` — ${detail.cancelReasonNote}` : ""}
                  </div>
                )}
              </div>

              {detail.reqType === "GENERAL" ? (
                <>
                  <div className="mt-6 mb-2 text-xs font-bold text-secondary">응찰 목록 ({detail.offers.length}건)</div>
                  {detail.offers.length === 0 ? (
                    <div className="rounded-xl border border-outline-variant/30 bg-white py-8 text-center text-xs text-on-surface-variant">
                      도착한 응찰이 없습니다.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {detail.offers.map((offer) => {
                        const selected = offer.offerNo === detail.selectedOfferNo;
                        return (
                          <div
                            key={offer.offerNo}
                            className={`rounded-xl border p-4 text-xs ${selected ? "border-primary bg-primary/5" : "border-outline-variant/30 bg-white"}`}
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-secondary">{offer.shopName}</span>
                                {selected && <span className="rounded-md bg-primary px-2 py-0.5 text-[10.5px] font-bold text-white">낙찰</span>}
                              </div>
                              <span className="text-on-surface-variant">{formatDateTime(offer.createdAt)} 제출</span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-on-surface-variant">
                              {offer.items.map((it) => (
                                <span key={it.instCode}>
                                  {carInstLabel(it.instCode)} {nfmt(it.price)}원
                                </span>
                              ))}
                            </div>
                            <div className="mt-2 flex items-center justify-between border-t border-outline-variant/30 pt-2">
                              <span className="text-on-surface-variant">
                                시공 예정 {offer.scheduledDate} {offer.scheduledTime}
                              </span>
                              <span className="font-bold text-secondary">합계 {nfmt(offerTotal(offer))}원</span>
                            </div>
                            {offer.memo && <div className="mt-1.5 text-on-surface-variant">메모: {offer.memo}</div>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="mt-6 mb-2 text-xs font-bold text-secondary">추천안 목록 ({detail.plans.length}건)</div>
                  {detail.plans.length === 0 ? (
                    <div className="rounded-xl border border-outline-variant/30 bg-white py-8 text-center text-xs text-on-surface-variant">
                      도착한 추천안이 없습니다.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {detail.plans.map((plan) => {
                        const selected = plan.planNo === detail.selectedPlanNo;
                        return (
                          <div
                            key={plan.planNo}
                            className={`rounded-xl border p-4 text-xs ${selected ? "border-primary bg-primary/5" : "border-outline-variant/30 bg-white"}`}
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-secondary">{plan.shopName}</span>
                                {selected && <span className="rounded-md bg-primary px-2 py-0.5 text-[10.5px] font-bold text-white">낙찰</span>}
                              </div>
                              <span className="text-on-surface-variant">{formatDateTime(plan.createdAt)} 제출</span>
                            </div>
                            <div className="flex flex-col gap-1 text-on-surface-variant">
                              {plan.items.map((it) => (
                                <div key={it.instCode} className="flex items-center justify-between">
                                  <span>
                                    {carInstLabel(it.instCode)} · {it.productName}
                                  </span>
                                  <span>
                                    <span className="line-through">{nfmt(it.retailPrice)}원</span> → {nfmt(it.offerPrice)}원
                                  </span>
                                </div>
                              ))}
                            </div>
                            {plan.positions.length > 0 && (
                              <div className="mt-1.5 text-on-surface-variant">
                                {plan.positions.map((p) => `${TINT_POSITION_LABEL[p.position] ?? p.position} ${p.level}%`).join(" · ")}
                              </div>
                            )}
                            <div className="mt-2 flex items-center justify-between border-t border-outline-variant/30 pt-2">
                              <span className="text-on-surface-variant">
                                시공 예정 {plan.scheduledDate} {plan.scheduledTime}
                              </span>
                              <span className="font-bold text-secondary">제안 합계 {nfmt(planTotal(plan))}원</span>
                            </div>
                            <div className="mt-1.5 text-on-surface-variant">추천사유: {plan.reason}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
