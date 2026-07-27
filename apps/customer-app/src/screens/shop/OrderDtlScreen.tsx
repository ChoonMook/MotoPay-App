// CU-SHOP-11: 주문 상세(배송조회) - 상품·수량·결제금액·배송지·배송상태 타임라인 확인, 배송완료 건은 리뷰 작성 진입점
import Button from "../../components/ui/Button";
import OrderTimeline from "./OrderTimeline";
import { PRODUCTS, ORDER_DEFS } from "./shopData";
import { nfmt } from "./shopFormat";

interface OrderDtlScreenProps {
  onBack: () => void;
  orderId: string;
  selAddrName: string;
  selAddrText: string;
  onTapAction: () => void;
}

export default function OrderDtlScreen({ onBack, orderId, selAddrName, selAddrText, onTapAction }: OrderDtlScreenProps) {
  const o = ORDER_DEFS[orderId];
  const prod = PRODUCTS[o.pid];
  const isDelivered = o.status === "done";
  const payRows: [string, string][] = [
    ["결제 금액", `${nfmt(prod.price * o.qty)}원`],
    ["결제 수단", "신용/체크카드"],
    ["주문 번호", o.no],
  ];

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex-none bg-white pt-[50px] pr-2.5 pl-2.5">
        <div className="flex items-center gap-1.5">
          <span onClick={onBack} className="flex h-9 w-9 cursor-pointer items-center justify-center text-gray-800">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </span>
          <span className="text-base font-bold text-gray-900">주문 상세</span>
        </div>
      </div>

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-[18px] pb-6">
        <div className="flex items-center gap-2.5 rounded-[14px] border border-gray-200 bg-white p-3.5 shadow-sm">
          <span className="h-[52px] w-[52px] flex-none overflow-hidden rounded-[10px] bg-gray-100">
            <img src={prod.img} alt={prod.name} className="h-full w-full object-cover" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-bold text-gray-900">{prod.name}</div>
            <div className="mt-0.5 text-[11.5px] text-gray-500">
              {o.qty}개 · {prod.opts[0]}
            </div>
          </div>
        </div>

        <div className="mx-0.5 mt-[22px] mb-3.5 text-[13px] font-extrabold text-gray-900">배송 현황</div>
        <OrderTimeline status={o.status} orderDate={o.date} />

        <div className="mx-0.5 mt-2 mb-2.5 text-[13px] font-extrabold text-gray-900">배송지</div>
        <div className="rounded-xl border border-gray-200 bg-white px-[15px] py-3.5 shadow-sm">
          <div className="text-[13.5px] font-bold text-gray-900">{selAddrName}</div>
          <div className="mt-1 text-[12.5px] leading-[1.4] text-gray-600">{selAddrText}</div>
        </div>

        <div className="mx-0.5 mt-5 mb-2.5 text-[13px] font-extrabold text-gray-900">결제 정보</div>
        <div className="rounded-2xl border border-gray-200 bg-white px-4 shadow-sm">
          {payRows.map(([k, v], i) => (
            <div key={k} className={`flex items-center justify-between py-3.5 ${i < payRows.length - 1 ? "border-b border-gray-100" : ""}`}>
              <span className="text-[12.5px] text-gray-500">{k}</span>
              <span className="text-right text-[13.5px] font-bold text-gray-800 tabular-nums">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-6">
        <Button variant={isDelivered ? "primary" : "outline"} size="xl" onClick={onTapAction}>
          {isDelivered ? "리뷰 작성하기" : "배송조회"}
        </Button>
      </div>
    </div>
  );
}
