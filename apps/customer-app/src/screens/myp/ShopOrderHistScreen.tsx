// CU-MYPG-10: 쇼핑몰 주문내역 - 쇼핑몰 모듈에서의 주문 이력 조회
// 프로그램목록표 v1.37에 이 행이 누락돼 있으나(01~09,11~15만 존재) 원본 dc.html 캔버스에는 정의돼 있고, 다른 화면들의 URL 패턴
// (/myp/cancel-return-hist → CancelReturnHistScreen.tsx)과 동일하게 /myp/shop-order-hist → ShopOrderHistScreen.tsx로 추론해 구현함
import CommonHeader from "../common/CommonHeader";
import { SHOP_ORDER_HIST, SHOP_ORDER_STATUS_META } from "./mypData";

interface ShopOrderHistScreenProps {
  onBack: () => void;
  onOpenItem: () => void;
}

export default function ShopOrderHistScreen({ onBack, onOpenItem }: ShopOrderHistScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <CommonHeader title="쇼핑몰 주문내역" onBack={onBack} />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-4 pb-6">
        <div className="flex flex-col gap-3">
          {SHOP_ORDER_HIST.map((o) => {
            const sm = SHOP_ORDER_STATUS_META[o.status];
            return (
              <div key={o.no} onClick={onOpenItem} className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-[15px] shadow-sm">
                <div className="mb-[9px] flex items-center justify-between">
                  <span className="text-[11.5px] text-gray-500">
                    {o.date} · {o.no}
                  </span>
                  <span className="rounded-md px-[9px] py-[3px] text-[10.5px] font-extrabold" style={{ color: sm.color, background: sm.bg }}>
                    {sm.label}
                  </span>
                </div>
                <div className="text-sm font-bold text-gray-800">{o.name}</div>
                <div className="mt-1 text-xs text-gray-500">{o.itemsLabel}</div>
                <div className="mt-2 text-sm font-extrabold text-gray-900 tabular-nums">{o.total}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
