// PT-RSVC-07: 추천안 작성 (전문가추천) - 항목별 제품 선택·제안가 입력·시공 가능 시간 선택, 소비자가 합계·추천 총액·할인율 자동 계산
// 시공 가능 시간은 RsvcBidJoinScreen(일반입찰)과 동일하게 고객 희망일(req.desiredDate) 기준 실제 예약 가능 시간대에서 선택
import Button from "../../components/ui/Button";
import Textarea from "../../components/ui/Textarea";
import type { DailySlot } from "../../api/shopSchedule";
import { POS_NAMES, formatDesiredDateLabel, hasPos, searchable, won } from "./rsvcData";
import type { BidReq, PlanLine, RsvcProduct } from "./rsvcTypes";
import { ChevronDownIcon } from "./rsvcIcons";

interface RsvcPlanWriteScreenProps {
  req: BidReq;
  draft: PlanLine[];
  productsByInstCode: Record<string, RsvcProduct[]>;
  dropOpenIndex: number | null;
  onToggleDropdown: (index: number) => void;
  onPickProduct: (index: number, productCode: string) => void;
  onOpenSearch: (index: number) => void;
  onOpenPos: (index: number) => void;
  onChangeOffer: (index: number, value: string) => void;
  daySlots: DailySlot[];
  loadingSlots: boolean;
  planTime: string;
  onChangePlanTime: (v: string) => void;
  planMemo: string;
  onChangePlanMemo: (value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}

function posSummary(line: PlanLine): string {
  const posOn = POS_NAMES.filter((n) => !line.posOff[n]);
  if (posOn.length === 0) return "부위 미선택";
  const sameLevel = posOn.every((n) => line.posLevels[n] === line.posLevels[posOn[0]]);
  return `${posOn.length}개 부위 · ${sameLevel ? `농도 ${line.posLevels[posOn[0]]}%` : "부위별 농도"}`;
}

export default function RsvcPlanWriteScreen({
  req,
  draft,
  productsByInstCode,
  dropOpenIndex,
  onToggleDropdown,
  onPickProduct,
  onOpenSearch,
  onOpenPos,
  onChangeOffer,
  daySlots,
  loadingSlots,
  planTime,
  onChangePlanTime,
  planMemo,
  onChangePlanMemo,
  onBack,
  onSubmit,
}: RsvcPlanWriteScreenProps) {
  const consumerTotal = draft.reduce((sum, ln) => {
    const ps = productsByInstCode[ln.instCode] ?? [];
    const sel = ps.find((p) => p.productCode === ln.productCode) ?? { price: ln.retailPrice };
    return sum + sel.price;
  }, 0);
  const offerTotal = draft.reduce((sum, ln) => sum + (Number(ln.offer) || 0), 0);
  const discountRate = consumerTotal ? Math.max(0, Math.round((1 - offerTotal / consumerTotal) * 100)) : 0;
  const planReady = draft.length > 0 && draft.every((ln) => Number(ln.offer) > 0) && !!planTime;
  const planSubmitLabel = req.status === "active" ? "추천안 수정 제출" : "추천안 제출";

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex-none border-b border-gray-100 bg-white pt-[50px] px-3">
        <div className="flex h-[50px] items-center gap-1.5">
          <span onClick={onBack} className="flex h-9 w-9 cursor-pointer items-center justify-center text-[22px] text-gray-800">
            ‹
          </span>
          <span className="text-[17px] font-bold text-gray-900">추천안 작성</span>
        </div>
      </div>

      <div className="mp-scroll flex-1 overflow-y-auto px-5 py-[18px]">
        <div className="mb-0.5 text-[15px] font-extrabold text-gray-900">
          {req.customer} · {req.car}
        </div>
        <div className="mb-3.5 text-[12.5px] text-gray-500">
          {req.category} · {req.budgetLabel} · {req.deadlineLabel}
        </div>
        <div className="mb-5 flex items-start gap-2 rounded-xl bg-brand-subtle px-3.5 py-3">
          <span className="text-[12.5px] leading-[1.5] font-semibold text-brand">
            소비자가는 고객 화면에서 취소선 비교로 그대로 노출돼요. 항목별 제품과 제안가를 정확히 입력해 주세요.
          </span>
        </div>

        <div className="mb-2 text-[13px] font-extrabold tracking-[.02em] text-gray-500">항목별 제품·금액</div>
        <div className="mb-3 rounded-[10px] bg-gray-100 px-[13px] py-[11px] text-[12.5px] leading-[1.45] text-gray-600">
          고객이 요청한 항목에 대해 <b>제품(브랜드·모델)</b>과 제안가를 입력하세요. 제품이 많은 항목은 눌러서 검색할 수 있어요.
        </div>

        <div className="mb-5 flex flex-col gap-3">
          {draft.map((ln, i) => {
            const ps = productsByInstCode[ln.instCode] ?? [];
            const sel = ps.find((p) => p.productCode === ln.productCode) ?? { productCode: ln.productCode, name: ln.productName, brand: null, price: ln.retailPrice };
            const isSearch = searchable(ps);
            const open = dropOpenIndex === i;
            return (
              <div key={`${ln.name}-${i}`} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="text-[14.5px] font-extrabold text-gray-900">{ln.name}</div>
                <div className="mt-0.5 mb-3 text-xs text-gray-500">고객 요청 · {ln.spec}</div>

                {isSearch ? (
                  <div
                    onClick={() => onOpenSearch(i)}
                    className="mb-2.5 flex cursor-pointer items-center justify-between rounded-xl border border-gray-400 bg-white px-3.5 py-[13px]"
                  >
                    <span className="text-[13.5px] font-bold text-gray-800">
                      {sel.brand} {sel.name}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-brand">검색·변경 ›</span>
                  </div>
                ) : (
                  <>
                    <div
                      onClick={() => onToggleDropdown(i)}
                      className="mb-2.5 flex cursor-pointer items-center justify-between rounded-xl border border-gray-400 bg-white px-3.5 py-[13px]"
                    >
                      <span className="text-[13.5px] font-bold text-gray-800">
                        {sel.brand} {sel.name}
                      </span>
                      <ChevronDownIcon />
                    </div>
                    {open && (
                      <div className="mb-2.5 -mt-1 rounded-xl border border-gray-200 bg-white p-[5px] shadow-sm">
                        {ps.map((p) => {
                          const picked = p.productCode === sel.productCode;
                          return (
                            <div
                              key={p.productCode}
                              onClick={() => onPickProduct(i, p.productCode)}
                              className={`flex cursor-pointer items-center justify-between gap-2.5 rounded-lg px-3 py-[11px] ${
                                picked ? "bg-brand-subtle" : ""
                              }`}
                            >
                              <span className={`text-[13px] ${picked ? "font-bold text-brand" : "font-semibold text-gray-800"}`}>
                                {p.brand} {p.name}
                              </span>
                              <span className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">{won(p.price)}</span>
                                <span className="w-3.5 text-center text-xs font-extrabold text-brand">{picked ? "✓" : ""}</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {hasPos(ln.instCode) && (
                  <div
                    onClick={() => onOpenPos(i)}
                    className="mb-2.5 flex cursor-pointer items-center justify-between rounded-xl bg-gray-100 px-3.5 py-3"
                  >
                    <span className="text-[12.5px] font-bold text-gray-800">부위·농도</span>
                    <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-brand">{posSummary(ln)} ›</span>
                  </div>
                )}

                <div className="flex items-center gap-2.5">
                  <div className="flex-none">
                    <div className="text-[11px] text-gray-500">소비자가</div>
                    <div className="text-[13px] font-bold text-gray-600 line-through">{won(sel.price)}</div>
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      value={ln.offer}
                      onChange={(e) => onChangeOffer(i, e.target.value)}
                      placeholder="제안가"
                      className="h-[52px] w-full rounded-lg border border-gray-300 px-3.5 text-base text-gray-900 outline-none placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mb-5 rounded-[14px] bg-gray-100 px-4 py-[15px]">
          <div className="mb-[7px] flex items-center justify-between">
            <span className="text-[12.5px] text-gray-500">소비자가 합계</span>
            <span className="text-[13px] font-semibold text-gray-600 line-through">{won(consumerTotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13.5px] font-extrabold text-gray-900">추천 총액</span>
            <span className="flex items-center gap-2">
              <span className="rounded-full bg-brand px-[7px] py-0.5 text-[11px] font-extrabold text-white">{discountRate}%</span>
              <span className="text-[17px] font-extrabold text-brand">{won(offerTotal)}</span>
            </span>
          </div>
        </div>

        <div className="mb-5">
          <div className="mb-2 text-[13px] font-bold text-gray-800">
            시공 가능 시간 · 고객 희망일 {formatDesiredDateLabel(req.desiredDate)}
          </div>
          {loadingSlots ? (
            <div className="py-6 text-center text-[12.5px] text-gray-400">불러오는 중...</div>
          ) : daySlots.length === 0 ? (
            <div className="py-6 text-center text-[12.5px] text-gray-400">등록된 예약 가능 시간이 없어요</div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {daySlots.map((s) => {
                const full = s.capacity === null || s.isLocked || s.reservedCount >= s.capacity;
                const sel = planTime === s.time;
                return (
                  <span
                    key={s.time}
                    onClick={() => !full && onChangePlanTime(s.time)}
                    className={`rounded-[10px] py-3 text-center text-[13px] font-semibold tabular-nums ${
                      full ? "cursor-default" : "cursor-pointer"
                    } ${
                      sel
                        ? "bg-brand font-extrabold text-white"
                        : full
                          ? "bg-gray-100 text-gray-300 line-through"
                          : "border border-gray-400 bg-white text-gray-800"
                    }`}
                  >
                    {s.time}
                  </span>
                );
              })}
            </div>
          )}
          <div className="mt-2 text-[11.5px] text-gray-500">고객 희망일 기준 우리 업체의 예약 가능 시간이에요</div>
        </div>

        <Textarea label="추천 사유" placeholder="이 구성을 추천하는 이유를 적어주세요" value={planMemo} onChange={(e) => onChangePlanMemo(e.target.value)} />
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-[22px]">
        <Button disabled={!planReady} onClick={onSubmit}>
          {planSubmitLabel}
        </Button>
      </div>
    </div>
  );
}
