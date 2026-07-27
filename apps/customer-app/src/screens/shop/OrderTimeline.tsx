// 쇼핑몰 주문상세(CU-SHOP-11)·배송완료확인(CU-SHOP-09)이 공유하는 배송 현황 타임라인
import type { OrderStatus } from "./shopTypes";

const STAGES = ["결제완료", "상품준비중", "배송중", "배송완료"];
const STAGE_IDX: Record<OrderStatus, number> = { prep: 1, ship: 2, done: 3 };

interface OrderTimelineProps {
  status: OrderStatus;
  orderDate: string;
}

export default function OrderTimeline({ status, orderDate }: OrderTimelineProps) {
  const stageIdx = STAGE_IDX[status];

  return (
    <div className="flex flex-col">
      {STAGES.map((label, i) => {
        const done = i < stageIdx;
        const active = i === stageIdx;
        const hasLine = i < STAGES.length - 1;
        const dateText = i === 0 ? orderDate : active ? "진행중" : done ? "완료" : "";
        return (
          <div key={label} className="flex gap-3">
            <div className="flex w-5 flex-none flex-col items-center">
              <span className={`mt-0.5 h-3 w-3 rounded-full ${done || active ? "bg-brand" : "bg-gray-200"}`} />
              {hasLine && <span className={`w-0.5 min-h-[22px] flex-1 ${done ? "bg-brand" : "bg-gray-200"}`} />}
            </div>
            <div className="flex-1 pb-[22px]">
              <div className={`text-[13.5px] ${active ? "font-extrabold" : "font-semibold"} ${active ? "text-brand" : done ? "text-gray-800" : "text-gray-500"}`}>
                {label}
              </div>
              {(done || active) && <div className="mt-0.5 text-[11.5px] text-gray-500">{dateText}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
