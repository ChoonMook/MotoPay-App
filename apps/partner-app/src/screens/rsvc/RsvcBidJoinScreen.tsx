// PT-RSVC-06: 입찰 참여 (일반) - 견적가·시공 가능일을 입력해 입찰 제출 (건당 1회, 동시입찰 최대 10건)
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import { itemSummary } from "./rsvcData";
import type { BidReq } from "./rsvcTypes";

const BID_DATES = ["08.05 (수) 오전", "08.06 (목) 오후", "08.08 (토) 오전"];

interface RsvcBidJoinScreenProps {
  req: BidReq;
  activeGeneralCount: number;
  bidAmount: string;
  onChangeBidAmount: (v: string) => void;
  bidDate: string;
  onChangeBidDate: (v: string) => void;
  bidMemo: string;
  onChangeBidMemo: (v: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}

export default function RsvcBidJoinScreen({
  req,
  activeGeneralCount,
  bidAmount,
  onChangeBidAmount,
  bidDate,
  onChangeBidDate,
  bidMemo,
  onChangeBidMemo,
  onBack,
  onSubmit,
}: RsvcBidJoinScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex-none border-b border-gray-100 bg-white pt-[50px] px-3">
        <div className="flex h-[50px] items-center gap-1.5">
          <span onClick={onBack} className="flex h-9 w-9 cursor-pointer items-center justify-center text-[22px] text-gray-800">
            ‹
          </span>
          <span className="text-[17px] font-bold text-gray-900">입찰 참여</span>
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
          <Input
            label="견적가"
            type="number"
            placeholder="숫자만 입력"
            value={bidAmount}
            onChange={(e) => onChangeBidAmount(e.target.value)}
          />
          <div>
            <div className="mb-2 text-[13px] font-bold text-gray-800">시공 가능일</div>
            <div className="flex flex-wrap gap-2">
              {BID_DATES.map((label) => (
                <span
                  key={label}
                  onClick={() => onChangeBidDate(label)}
                  className={`cursor-pointer rounded-full px-3.5 py-[7px] text-[12.5px] font-bold ${
                    bidDate === label ? "bg-brand text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {label}
                </span>
              ))}
            </div>
            <div className="mt-2 text-[11.5px] text-gray-500">고객 희망일 중 시공 가능한 날짜를 선택해 주세요</div>
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
        <Button disabled={!bidAmount || !bidDate} onClick={onSubmit}>
          입찰 제출
        </Button>
      </div>
    </div>
  );
}
