// CU-SHOP-08: 주문내역 - 쇼핑몰 주문·배송·취소 내역 조회, 상태 뱃지(상품준비중·배송중·배송완료)
import { PRODUCTS, ORDER_DEFS, ORDER_IDS } from "./shopData";
import { nfmt } from "./shopFormat";
import type { OrderStatus } from "./shopTypes";

const STATUS_META: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  prep: { label: "상품준비중", color: "var(--color-accent-strong)", bg: "var(--color-accent-subtle)" },
  ship: { label: "배송중", color: "var(--color-brand)", bg: "var(--surface-brand-subtle)" },
  done: { label: "배송완료", color: "var(--green-600)", bg: "var(--status-success-bg)" },
};

interface OrderHistScreenProps {
  onBack: () => void;
  onOpenOrder: (id: string) => void;
}

export default function OrderHistScreen({ onBack, onOpenOrder }: OrderHistScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex-none bg-white pt-[50px] pr-2.5 pl-2.5">
        <div className="flex items-center gap-1.5">
          <span onClick={onBack} className="flex h-9 w-9 cursor-pointer items-center justify-center text-gray-800">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </span>
          <span className="text-base font-bold text-gray-900">주문내역</span>
        </div>
      </div>

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-4 pb-6">
        <div className="flex flex-col gap-3">
          {ORDER_IDS.map((id) => {
            const o = ORDER_DEFS[id];
            const prod = PRODUCTS[o.pid];
            const sm = STATUS_META[o.status];
            return (
              <div
                key={id}
                onClick={() => onOpenOrder(id)}
                className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-[15px] shadow-sm"
              >
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-[11.5px] text-gray-500">
                    {o.date} · {o.no}
                  </span>
                  <span className="rounded-md px-[9px] py-[3px] text-[10.5px] font-extrabold" style={{ color: sm.color, background: sm.bg }}>
                    {sm.label}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="h-[52px] w-[52px] flex-none overflow-hidden rounded-[10px] bg-gray-100">
                    <img src={prod.img} alt={prod.name} className="h-full w-full object-cover" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-bold text-gray-900">{prod.name}</div>
                    <div className="mt-0.5 text-[11.5px] text-gray-500">
                      {o.qty}개 · {prod.opts[0]}
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-gray-900 tabular-nums">{nfmt(prod.price * o.qty)}원</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
