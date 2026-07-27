// CU-SHOP-04: 장바구니 - 상품 담기·수량 변경·삭제, 선택 상품만 주문
import Button from "../../components/ui/Button";
import { CartIcon } from "./shopIcons";
import { PRODUCTS } from "./shopData";
import { nfmt } from "./shopFormat";
import type { CartLine } from "./shopTypes";

interface CartScreenProps {
  onBack: () => void;
  cart: Record<string, CartLine>;
  cartSel: Record<string, boolean>;
  onToggleSelectAll: () => void;
  onToggleSelect: (key: string) => void;
  onInc: (key: string) => void;
  onDec: (key: string) => void;
  onRemove: (key: string) => void;
  onGoShop: () => void;
  onOrder: () => void;
}

export default function CartScreen({
  onBack,
  cart,
  cartSel,
  onToggleSelectAll,
  onToggleSelect,
  onInc,
  onDec,
  onRemove,
  onGoShop,
  onOrder,
}: CartScreenProps) {
  const keys = Object.keys(cart);
  const cartCount = keys.reduce((s, k) => s + cart[k].qty, 0);
  const allSelected = keys.length > 0 && keys.every((k) => cartSel[k]);
  const selectedKeys = keys.filter((k) => cartSel[k]);
  const subtotal = selectedKeys.reduce((s, k) => s + PRODUCTS[cart[k].pid].price * cart[k].qty, 0);
  const shipFee = selectedKeys.length > 0 && subtotal < 50000 ? 3000 : 0;
  const total = subtotal + shipFee;

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex-none bg-white pt-[50px] pr-2.5 pl-2.5">
        <div className="flex items-center gap-1.5">
          <span onClick={onBack} className="flex h-9 w-9 cursor-pointer items-center justify-center text-gray-800">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </span>
          <span className="text-base font-bold text-gray-900">장바구니 {cartCount}</span>
        </div>
      </div>

      {keys.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <CartIcon size={30} />
          </span>
          <div className="text-[15px] font-extrabold text-gray-900">장바구니가 비어있어요</div>
          <div className="mt-1.5 w-full">
            <Button onClick={onGoShop}>쇼핑 계속하기</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-none items-center gap-2.5 border-b border-gray-100 px-5 py-3">
            <span
              onClick={onToggleSelectAll}
              className={`flex h-5 w-5 cursor-pointer items-center justify-center rounded-md text-[11px] text-white ${
                allSelected ? "bg-brand" : "border-[1.5px] border-gray-300"
              }`}
            >
              {allSelected ? "✓" : ""}
            </span>
            <span className="text-[13px] font-bold text-gray-800">전체선택</span>
          </div>

          <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-3.5 pb-6">
            <div className="flex flex-col gap-3.5">
              {keys.map((k) => {
                const c = cart[k];
                const prod = PRODUCTS[c.pid];
                const sel = !!cartSel[k];
                return (
                  <div key={k} className="flex items-start gap-2.5">
                    <span
                      onClick={() => onToggleSelect(k)}
                      className={`mt-6.5 flex h-[22px] w-[22px] flex-none cursor-pointer items-center justify-center rounded-md text-xs text-white ${
                        sel ? "bg-brand" : "border-[1.5px] border-gray-300"
                      }`}
                    >
                      {sel ? "✓" : ""}
                    </span>
                    <span className="h-[68px] w-[68px] flex-none overflow-hidden rounded-[11px] bg-gray-100">
                      <img src={prod.img} alt={prod.name} className="h-full w-full object-cover" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] leading-[1.3] font-bold text-gray-900">{prod.name}</div>
                      <div className="mt-0.5 text-[11.5px] text-gray-500">옵션 · {prod.opts[c.opt]}</div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span
                            onClick={() => onDec(k)}
                            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md bg-gray-100 text-[13px] font-bold"
                          >
                            −
                          </span>
                          <span className="min-w-[14px] text-center text-[13px] font-extrabold">{c.qty}</span>
                          <span
                            onClick={() => onInc(k)}
                            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md bg-gray-100 text-[13px] font-bold"
                          >
                            ＋
                          </span>
                        </div>
                        <span className="text-sm font-extrabold text-gray-900 tabular-nums">{nfmt(prod.price * c.qty)}원</span>
                      </div>
                    </div>
                    <span onClick={() => onRemove(k)} className="mt-6 flex-none cursor-pointer text-gray-500">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5">
            <div className="flex flex-col gap-0.5 py-0.5 pb-2">
              <div className="flex items-center justify-between border-b border-gray-100 py-[11px]">
                <span className="text-[12.5px] text-gray-500">상품금액</span>
                <span className="text-[13.5px] font-semibold text-gray-800 tabular-nums">{nfmt(subtotal)}원</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 py-[11px]">
                <span className="text-[12.5px] text-gray-500">배송비</span>
                <span className="text-[13.5px] font-semibold text-gray-800 tabular-nums">{shipFee ? `${nfmt(shipFee)}원` : "무료"}</span>
              </div>
              <div className="flex items-center justify-between py-[11px]">
                <span className="text-[12.5px] text-gray-500">총 결제예정금액</span>
                <span className="text-[13.5px] font-extrabold text-brand tabular-nums">{nfmt(total)}원</span>
              </div>
            </div>
            <div className="pt-1.5 pb-6">
              <Button size="xl" disabled={selectedKeys.length === 0} onClick={onOrder}>
                {selectedKeys.length ? `선택상품 주문하기 (${selectedKeys.length})` : "상품을 선택하세요"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
