// PT-RSVC-06: 입찰 참여(수정) (일반) - 시공 항목별 견적가·시공 가능 시간을 입력해 입찰 제출 (동시입찰 최대 10건)
// 고객이 업체를 선택하기 전(status="active")까지는 이미 제출한 입찰도 재제출로 계속 수정 가능
// 항목별 가격을 투명하게 공개하는 고객앱 "입찰 내용 상세" 화면과 짝을 맞춤(합계는 자동 계산)
// 시공 가능 시간은 고객 희망일(req.desiredDate) 기준 내 업체의 실제 예약 가능 시간대(GET /shops/:shopCode/schedule)에서 선택
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import type { DailySlot } from "../../api/shopSchedule";
import { findRequestedProductPrice, formatDesiredDateLabel, itemSummary, won } from "./rsvcData";
import type { BidReq, RsvcProduct } from "./rsvcTypes";

interface RsvcBidJoinScreenProps {
  req: BidReq;
  activeGeneralCount: number;
  /** 고객이 요청한 제품의 참고 판매가 표시용 실 카탈로그(instCode -> GET /products 결과) */
  productsByInstCode: Record<string, RsvcProduct[]>;
  bidPrices: Record<string, string>;
  onChangePrice: (instCode: string, value: string) => void;
  schedDate: string; // "YYYY-MM-DD" — 시공 가능 시간 조회 기준 날짜(기본은 고객 희망일, 변경 시 다른 날짜)
  onChangeDate: () => void;
  daySlots: DailySlot[];
  loadingSlots: boolean;
  bidTime: string;
  onChangeBidTime: (v: string) => void;
  bidMemo: string;
  onChangeBidMemo: (v: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}

export default function RsvcBidJoinScreen({
  req,
  activeGeneralCount,
  productsByInstCode,
  bidPrices,
  onChangePrice,
  schedDate,
  onChangeDate,
  daySlots,
  loadingSlots,
  bidTime,
  onChangeBidTime,
  bidMemo,
  onChangeBidMemo,
  onBack,
  onSubmit,
}: RsvcBidJoinScreenProps) {
  const dateChanged = schedDate !== req.desiredDate;
  const isEdit = req.status === "active";
  const total = req.items.reduce((sum, it) => sum + (Number(bidPrices[it.instCode ?? ""]) || 0), 0);
  const allPriced = req.items.every((it) => Number(bidPrices[it.instCode ?? ""]) > 0);

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex-none border-b border-gray-100 bg-white pt-[50px] px-3">
        <div className="flex h-[50px] items-center gap-1.5">
          <span onClick={onBack} className="flex h-9 w-9 cursor-pointer items-center justify-center text-[22px] text-gray-800">
            ‹
          </span>
          <span className="text-[17px] font-bold text-gray-900">{isEdit ? "입찰 수정" : "입찰 참여"}</span>
        </div>
      </div>

      <div className="mp-scroll flex-1 overflow-y-auto px-5 py-[18px]">
        <div className="mb-[18px] flex items-center gap-2.5 rounded-xl bg-gray-100 px-3.5 py-[11px]">
          <span className="text-[12.5px] font-bold text-gray-800">
            동시 입찰 진행중 <span className="text-brand">{activeGeneralCount}/10건</span>
          </span>
        </div>
        <div className="mb-0.5 text-[15px] font-extrabold text-gray-900">
          {req.customer} · {req.car}
        </div>
        <div className="mb-4 text-[12.5px] text-gray-500">
          {itemSummary(req.items)} · {req.budgetLabel} · {req.deadlineLabel}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-2 text-[13px] font-bold text-gray-800">시공 항목별 견적가</div>
            <div className="flex flex-col gap-2.5">
              {req.items.map((it) => {
                const refPrice = findRequestedProductPrice(productsByInstCode, it.instCode, it.productName);
                return (
                  <div key={it.instCode} className="rounded-xl border border-gray-200 px-3.5 py-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[13px] font-bold text-gray-800">{it.name}</div>
                        {it.spec && <div className="mt-0.5 text-[11.5px] text-gray-500">{it.spec}</div>}
                      </div>
                      {refPrice != null && (
                        <div className="flex-none text-right">
                          <div className="text-[10.5px] text-gray-400">판매가</div>
                          <div className="text-[12px] font-bold text-gray-600">{won(refPrice)}</div>
                        </div>
                      )}
                    </div>
                    <Input
                      type="number"
                      placeholder="숫자만 입력"
                      value={bidPrices[it.instCode ?? ""] ?? ""}
                      onChange={(e) => onChangePrice(it.instCode ?? "", e.target.value)}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-2.5 flex items-center justify-between rounded-[10px] bg-brand-subtle px-3.5 py-3">
              <span className="text-[12.5px] font-bold text-brand">견적 합계</span>
              <span className="text-base font-extrabold text-brand">{won(total)}</span>
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13px] font-bold text-gray-800">
                시공 가능 시간 · {dateChanged ? "변경한 일자" : "고객 희망일"} {formatDesiredDateLabel(schedDate)}
              </span>
              <span onClick={onChangeDate} className="cursor-pointer text-[12px] font-bold text-brand">
                날짜 변경 ›
              </span>
            </div>
            {dateChanged && (
              <div className="mb-2 text-[11.5px] text-gray-500">고객 희망일은 {formatDesiredDateLabel(req.desiredDate)}이에요</div>
            )}
            {loadingSlots ? (
              <div className="py-6 text-center text-[12.5px] text-gray-400">불러오는 중...</div>
            ) : daySlots.length === 0 ? (
              <div className="py-6 text-center text-[12.5px] text-gray-400">
                등록된 예약 가능 시간이 없어요. 위 "날짜 변경"으로 다른 날짜를 선택해주세요.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {daySlots.map((s) => {
                  const full = s.capacity === null || s.isLocked || s.reservedCount >= s.capacity;
                  const sel = bidTime === s.time;
                  return (
                    <span
                      key={s.time}
                      onClick={() => !full && onChangeBidTime(s.time)}
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
            {daySlots.length > 0 && (
              <div className="mt-2 text-[11.5px] text-gray-500">
                {dateChanged ? "변경한 일자 기준" : "고객 희망일 기준"} 우리 업체의 예약 가능 시간이에요
              </div>
            )}
          </div>
          <Textarea
            label="메모 (선택)"
            placeholder="고객에게 전달할 시공 계획을 간단히 적어주세요"
            value={bidMemo}
            onChange={(e) => onChangeBidMemo(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-[22px]">
        <Button disabled={!allPriced || !bidTime} onClick={onSubmit}>
          {isEdit ? "입찰 수정" : "입찰 제출"}
        </Button>
      </div>
    </div>
  );
}
