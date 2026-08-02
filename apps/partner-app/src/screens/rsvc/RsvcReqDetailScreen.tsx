// PT-RSVC-05: 요청 상세 - 항목·옵션·일정·마감시간 확인 후 입찰 참여 또는 추천안 작성으로 분기
import Button from "../../components/ui/Button";
import { reqInfoRows, reqTypeChipClass, reqTypeLabel, won } from "./rsvcData";
import type { BidReq } from "./rsvcTypes";

interface RsvcReqDetailScreenProps {
  req: BidReq;
  onBack: () => void;
  onGoResult: () => void;
  onGoBidJoin: () => void;
  onGoPlanWrite: () => void;
}

export default function RsvcReqDetailScreen({ req, onBack, onGoResult, onGoBidJoin, onGoPlanWrite }: RsvcReqDetailScreenProps) {
  const mySubmitAmount = req.type === "general" ? (req.myBid ? won(req.myBid) : "") : req.myPlan ? won(req.myPlan.price) : "";
  const mySubmitLabel = req.type === "general" ? "제출한 견적가" : "제출한 추천 총액";
  const itemsTitle = req.type === "general" ? "시공 항목" : "고객 요청 항목";
  const rows = reqInfoRows(req);

  let ctaLabel: string;
  let ctaVariant: "primary" | "secondary" = "primary";
  let ctaDisabled = false;
  let onCta: () => void;
  if (req.status === "closed") {
    ctaLabel = "결과 확인하기";
    onCta = onGoResult;
  } else if (req.type === "general") {
    if (req.status === "open") {
      ctaLabel = "입찰 참여하기";
      onCta = onGoBidJoin;
    } else {
      ctaLabel = "입찰 제출 완료 · 마감 후 결과 확인";
      ctaVariant = "secondary";
      ctaDisabled = true;
      onCta = () => {};
    }
  } else {
    ctaLabel = req.status === "open" ? "추천안 작성하기" : "추천안 수정하기";
    onCta = onGoPlanWrite;
  }

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex-none border-b border-gray-100 bg-white pt-[50px] px-3">
        <div className="flex h-[50px] items-center gap-1.5">
          <span onClick={onBack} className="flex h-9 w-9 cursor-pointer items-center justify-center text-[22px] text-gray-800">
            ‹
          </span>
          <span className="text-[17px] font-bold text-gray-900">요청 상세</span>
        </div>
      </div>

      <div className="mp-scroll flex-1 overflow-y-auto px-5 py-[18px]">
        <div className="mb-2.5 flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-[3px] text-[11px] font-bold ${reqTypeChipClass(req.type)}`}>
            {reqTypeLabel(req.type)}
          </span>
          <span className="rounded-md bg-gray-100 px-[9px] py-1 text-[11.5px] font-bold text-gray-600">{req.deadlineLabel}</span>
        </div>
        <div className="mb-0.5 text-[17px] font-extrabold text-gray-900">{req.customer}</div>
        <div className="mb-4 text-[13.5px] text-gray-800">
          {req.car} · {req.distance}
        </div>

        <div className="mb-4 rounded-2xl border border-gray-200 bg-white px-4 shadow-sm">
          {rows.map((r, i) => (
            <div key={r.k} className={`flex items-center justify-between py-[11px] ${i < rows.length - 1 ? "border-b border-gray-100" : ""}`}>
              <span className="text-[13px] text-gray-500">{r.k}</span>
              <span className="text-[13.5px] font-semibold text-gray-800">{r.v}</span>
            </div>
          ))}
        </div>

        {mySubmitAmount && (
          <div className="mb-4 flex items-center justify-between rounded-[14px] bg-brand-subtle px-4 py-3.5">
            <span className="text-[13px] font-bold text-brand">{mySubmitLabel}</span>
            <span className="text-base font-extrabold text-brand">{mySubmitAmount}</span>
          </div>
        )}

        <div className="mb-2.5 text-[15px] font-extrabold text-gray-900">{itemsTitle}</div>
        <div className="flex flex-col gap-2">
          {req.items.map((it, i) => (
            <div key={`${it.name}-${i}`} className="flex items-center gap-2.5 rounded-[14px] border border-gray-200 bg-white px-[15px] py-3.5">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-gray-800">{it.name}</div>
                <div className="mt-0.5 text-[11.5px] text-gray-500">{it.spec}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-[22px]">
        <Button variant={ctaVariant} disabled={ctaDisabled} onClick={onCta}>
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
}
