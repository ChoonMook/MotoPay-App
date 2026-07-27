// CU-SHOP-12: 결제완료 - 결제 완료 안내와 주문 요약, 주문내역 보기로 이동
import Button from "../../components/ui/Button";
import { TruckIcon } from "./shopIcons";
import { nfmt } from "./shopFormat";

interface OrderDoneScreenProps {
  orderName: string;
  payAmount: number;
  payLabel: string;
  orderNo: string;
  onGoOrders: () => void;
}

export default function OrderDoneScreen({ orderName, payAmount, payLabel, orderNo, onGoOrders }: OrderDoneScreenProps) {
  const rows: [string, string][] = [
    ["주문 상품", orderName],
    ["결제 금액", `${nfmt(payAmount)}원`],
    ["결제 수단", payLabel],
    ["주문 번호", orderNo],
  ];

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="mp-scroll flex-1 overflow-y-auto">
        <div className="bg-gradient-to-b from-green-500 to-[#0f9d63] px-6 pt-[66px] pb-[34px] text-center text-white">
          <div className="mx-auto mb-4 flex h-[66px] w-[66px] items-center justify-center rounded-full bg-white/22">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="text-[22px] font-extrabold tracking-tight">결제가 완료됐어요</div>
          <div className="mt-1.5 text-[13.5px] text-white/90">주문이 정상 접수됐어요</div>
        </div>

        <div className="px-5 pt-5 pb-6">
          <div className="rounded-2xl border border-gray-200 bg-white px-4.5 shadow-sm">
            {rows.map(([k, v], i) => (
              <div key={k} className={`flex items-center justify-between gap-3 py-3.5 ${i < rows.length - 1 ? "border-b border-gray-100" : ""}`}>
                <span className="text-[12.5px] text-gray-500">{k}</span>
                <span className="text-right text-[13.5px] font-bold text-gray-800 tabular-nums">{v}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-brand-subtle px-[15px] py-3.5">
            <span className="mt-px flex-none text-brand">
              <TruckIcon />
            </span>
            <div>
              <div className="text-[13px] font-bold text-gray-900">상품을 준비하고 있어요</div>
              <div className="mt-0.5 text-xs leading-relaxed text-gray-600">출고 후 배송 현황을 주문내역에서 실시간으로 확인할 수 있어요.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-6">
        <Button size="xl" onClick={onGoOrders}>
          주문내역 보기
        </Button>
      </div>
    </div>
  );
}
