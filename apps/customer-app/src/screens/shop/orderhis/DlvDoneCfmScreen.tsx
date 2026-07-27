// CU-SHOP-09: 배송완료 확인 - 배송완료 후 고객 확인(구매확정/취소·반품 선택), 3일 미확인 시 자동 확정
import Button from "../../../components/ui/Button";
import OrderTimeline from "../OrderTimeline";
import { PRODUCTS, ORDER_DEFS } from "../shopData";

interface DlvDoneCfmScreenProps {
  onBack: () => void;
  orderId: string;
  onConfirm: () => void;
  onOpenCancelReturn: () => void;
}

export default function DlvDoneCfmScreen({ onBack, orderId, onConfirm, onOpenCancelReturn }: DlvDoneCfmScreenProps) {
  const o = ORDER_DEFS[orderId];
  const prod = PRODUCTS[o.pid];

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex-none bg-white pt-[50px] pr-2.5 pl-2.5">
        <div className="flex items-center gap-1.5">
          <span onClick={onBack} className="flex h-9 w-9 cursor-pointer items-center justify-center text-gray-800">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </span>
          <span className="text-base font-bold text-gray-900">배송완료 확인</span>
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

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-status-success-bg px-[15px] py-3.5">
          <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-status-success">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <span className="text-[13px] font-bold text-green-600">상품이 배송완료됐어요. 받으신 상품을 확인해주세요.</span>
        </div>

        <div className="mx-0.5 mt-[22px] mb-3.5 text-[13px] font-extrabold text-gray-900">배송 현황</div>
        <OrderTimeline status={o.status} orderDate={o.date} />

        <div className="mt-1 rounded-xl bg-gray-50 px-[15px] py-3.5 text-xs leading-relaxed text-gray-600">
          구매확정 또는 취소·반품 신청이 없으면 <b>배송완료 후 3일이 지나면 자동으로 구매확정</b> 처리돼요.
        </div>
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-6">
        <div className="flex flex-col gap-2.5">
          <Button size="xl" onClick={onConfirm}>
            구매확정
          </Button>
          <Button variant="outline" size="xl" onClick={onOpenCancelReturn}>
            취소·반품 신청
          </Button>
        </div>
      </div>
    </div>
  );
}
