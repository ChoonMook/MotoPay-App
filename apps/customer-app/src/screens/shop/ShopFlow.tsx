// 고객앱 "쇼핑몰" 화면(CU-SHOP-01~12 + 찜 목록)을 엮는 상태 컨테이너 (RsvFlow.tsx와 동일한 패턴)
import { useEffect, useState } from "react";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../components/ui/useToast";
import { pushBackAction } from "../../native/backHandler";
import ReviewWriteScreen from "../common/ReviewWriteScreen";
import ShopScreen from "./ShopScreen";
import ProdSearchCatScreen from "./ProdSearchCatScreen";
import ProdDtlScreen from "./ProdDtlScreen";
import CartScreen from "./CartScreen";
import OrderPayScreen, { type CheckoutItem } from "./OrderPayScreen";
import AddrChgScreen from "./orderpay/AddrChgScreen";
import NewAddrInputScreen from "./orderpay/NewAddrInputScreen";
import OrderDoneScreen from "./OrderDoneScreen";
import OrderHistScreen from "./OrderHistScreen";
import OrderDtlScreen from "./OrderDtlScreen";
import DlvDoneCfmScreen from "./orderhis/DlvDoneCfmScreen";
import CancelReturnApplyScreen from "./orderhis/CancelReturnApplyScreen";
import WishScreen from "./WishScreen";
import { PRODUCTS, ADDRESS_DEFS, ORDER_DEFS, POINT_BAL } from "./shopData";
import { parseDigits } from "./shopFormat";
import type { Address, CartLine, PayMethodKey, ShopScreenId, ShopSheetId } from "./shopTypes";

interface ShopFlowProps {
  onExit: () => void;
  onOpenMyPage: () => void;
  onOpenRsv: () => void;
  onCancelReturnSubmitted: () => void;
}

export default function ShopFlow({ onExit, onOpenMyPage, onOpenRsv, onCancelReturnSubmitted }: ShopFlowProps) {
  const [screen, setScreen] = useState<ShopScreenId>("main");
  const [sheet, setSheet] = useState<ShopSheetId>(null);

  const [cat, setCat] = useState("all");
  const [sortList, setSortList] = useState("pop");
  const [search, setSearch] = useState("");
  const [recent, setRecent] = useState(["엔진오일", "블랙박스", "썬팅필름"]);

  const [detailId, setDetailId] = useState("p1");
  const [qty, setQty] = useState(1);
  const [optSel, setOptSel] = useState<Record<string, number>>({});

  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [cartSel, setCartSel] = useState<Record<string, boolean>>({});
  const [buyNow, setBuyNow] = useState<CartLine | null>(null);

  const [wish, setWish] = useState<Record<string, boolean>>({});

  const [selectedAddr, setSelectedAddr] = useState("a1");
  const [addrExtra, setAddrExtra] = useState<Address[]>([]);
  const [newAddrName, setNewAddrName] = useState("");
  const [newAddrPhone, setNewAddrPhone] = useState("");
  const [newAddrAddr, setNewAddrAddr] = useState("");

  const [couponSel, setCouponSel] = useState<string | null>(null);
  const [pointUse, setPointUse] = useState(0);
  const [payMethod, setPayMethod] = useState<PayMethodKey>("card");
  const [lastPayAmount, setLastPayAmount] = useState(0);
  const [lastOrderName, setLastOrderName] = useState("");

  const [orderDetailId, setOrderDetailId] = useState("o1");
  const [orderConfirmed, setOrderConfirmed] = useState<Record<string, boolean>>({});
  const [reviewStar, setReviewStar] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);

  const [cancelReason, setCancelReason] = useState("");
  const [cancelDetail, setCancelDetail] = useState("");

  const { toast, showToast } = useToast();

  const addresses = ADDRESS_DEFS.concat(addrExtra);
  const curAddr = addresses.find((a) => a.id === selectedAddr) || addresses[0];
  const selAddrName = curAddr.name;
  const selAddrText = `${curAddr.phone} · ${curAddr.addr}`;

  const closeSheet = () => setSheet(null);
  const goMain = () => {
    setScreen("main");
    setSheet(null);
  };
  const goList = (nextCat: string) => {
    setCat(nextCat);
    setScreen("list");
    setSheet(null);
  };
  const goDetail = (pid: string) => {
    setDetailId(pid);
    setQty(1);
    setScreen("detail");
    setSheet(null);
  };
  const goCart = () => {
    setScreen("cart");
    setSheet(null);
  };
  const goOrders = () => {
    setScreen("orders");
    setSheet(null);
  };

  // 하드웨어 백버튼: 각 화면 상단 '‹' 버튼의 onBack과 동일한 대상으로 이동. paydone처럼 원래
  // 뒤로가기 버튼이 없는 화면은 등록하지 않음(상위 스택으로 흘러가 홈으로 이동)
  useEffect(() => {
    if (sheet) {
      return pushBackAction(closeSheet);
    }
    switch (screen) {
      case "list":
      case "detail":
      case "cart":
      case "orders":
      case "wish":
        return pushBackAction(goMain);
      case "checkout":
        return pushBackAction(goCart);
      case "newaddr":
        return pushBackAction(() => {
          setScreen("checkout");
          setSheet("addrchg");
        });
      case "dlvdonecfm":
      case "orderdtl":
        return pushBackAction(goOrders);
      default:
        return;
    }
  }, [screen, sheet]);

  const cartCount = Object.values(cart).reduce((s, c) => s + c.qty, 0);

  const toggleWish = (pid: string) => {
    const wasOn = !!wish[pid];
    setWish((prev) => ({ ...prev, [pid]: !prev[pid] }));
    showToast(wasOn ? "찜을 해제했어요" : "찜 목록에 담았어요");
  };

  const addToCart = (pid: string, opt: number, addQty: number) => {
    const key = `${pid}-${opt}`;
    setCart((prev) => ({ ...prev, [key]: { pid, opt, qty: (prev[key]?.qty ?? 0) + addQty } }));
    setCartSel((prev) => ({ ...prev, [key]: true }));
    showToast("장바구니에 담았어요", "success");
  };

  const checkoutSource: CartLine[] = buyNow
    ? [buyNow]
    : Object.entries(cart)
        .filter(([key]) => cartSel[key])
        .map(([, c]) => c);
  const checkoutItems: CheckoutItem[] = checkoutSource.map((c) => {
    const prod = PRODUCTS[c.pid];
    return { name: prod.name, img: prod.img, opt: prod.opts[c.opt], qty: c.qty, price: prod.price };
  });

  return (
    <div className="absolute inset-0 overflow-hidden">
      {screen === "main" && (
        <ShopScreen
          onExit={onExit}
          onOpenRsv={onOpenRsv}
          onOpenSearch={() => goList("all")}
          onOpenCart={goCart}
          onOpenWish={() => {
            setScreen("wish");
            setSheet(null);
          }}
          onOpenCategory={(c) => goList(c)}
          onOpenListAll={() => goList("all")}
          onOpenDetail={goDetail}
          onOpenMyPage={onOpenMyPage}
          cartCount={cartCount}
          wish={wish}
          onToggleWish={toggleWish}
          onToast={(label) => showToast(`${label} 탭으로 이동해요`)}
        />
      )}

      {screen === "list" && (
        <ProdSearchCatScreen
          onBack={goMain}
          cat={cat}
          onSelectCat={setCat}
          sort={sortList}
          onSelectSort={setSortList}
          search={search}
          onChangeSearch={setSearch}
          recent={recent}
          onRemoveRecent={(label) => setRecent((prev) => prev.filter((r) => r !== label))}
          wish={wish}
          onToggleWish={toggleWish}
          onOpenDetail={goDetail}
        />
      )}

      {screen === "detail" && (
        <ProdDtlScreen
          onBack={goMain}
          pid={detailId}
          qty={qty}
          onQtyInc={() => setQty((q) => q + 1)}
          onQtyDec={() => setQty((q) => Math.max(1, q - 1))}
          optSel={optSel[detailId] ?? 0}
          optionSheetOpen={sheet === "option"}
          onOpenOptionSheet={() => setSheet("option")}
          onCloseOptionSheet={closeSheet}
          onSelectOption={(idx) => {
            setOptSel((prev) => ({ ...prev, [detailId]: idx }));
            setSheet(null);
          }}
          wished={!!wish[detailId]}
          onToggleWish={() => toggleWish(detailId)}
          onAddCart={() => addToCart(detailId, optSel[detailId] ?? 0, qty)}
          onBuyNow={() => {
            setBuyNow({ pid: detailId, opt: optSel[detailId] ?? 0, qty });
            setScreen("checkout");
          }}
        />
      )}

      {screen === "cart" && (
        <CartScreen
          onBack={goMain}
          cart={cart}
          cartSel={cartSel}
          onToggleSelectAll={() =>
            setCartSel(() => {
              const allSelected = Object.keys(cart).length > 0 && Object.keys(cart).every((k) => cartSel[k]);
              const next: Record<string, boolean> = {};
              Object.keys(cart).forEach((k) => (next[k] = !allSelected));
              return next;
            })
          }
          onToggleSelect={(key) => setCartSel((prev) => ({ ...prev, [key]: !prev[key] }))}
          onInc={(key) => setCart((prev) => ({ ...prev, [key]: { ...prev[key], qty: prev[key].qty + 1 } }))}
          onDec={(key) =>
            setCart((prev) => {
              if (prev[key].qty <= 1) return prev;
              return { ...prev, [key]: { ...prev[key], qty: prev[key].qty - 1 } };
            })
          }
          onRemove={(key) =>
            setCart((prev) => {
              const next = { ...prev };
              delete next[key];
              return next;
            })
          }
          onGoShop={goMain}
          onOrder={() => {
            setBuyNow(null);
            setScreen("checkout");
          }}
        />
      )}

      {screen === "checkout" && (
        <OrderPayScreen
          onBack={goCart}
          checkoutItems={checkoutItems}
          selAddrName={selAddrName}
          selAddrText={selAddrText}
          onOpenAddrChg={() => setSheet("addrchg")}
          pointUse={pointUse}
          onPointInput={(raw) => setPointUse(Math.min(parseDigits(raw), POINT_BAL))}
          onUseAllPoint={() => setPointUse(POINT_BAL)}
          couponSel={couponSel}
          couponSheetOpen={sheet === "coupon"}
          onOpenCouponSheet={() => setSheet("coupon")}
          onCloseCouponSheet={closeSheet}
          onSelectCoupon={setCouponSel}
          onConfirmCoupon={() => {
            closeSheet();
            const name = couponSel ? "선택한 쿠폰이" : "쿠폰 적용이 해제됐어요";
            showToast(couponSel ? `${name} 적용됐어요` : name, "success");
          }}
          payMethod={payMethod}
          onSelectPay={setPayMethod}
          onPay={() => {
            const total = checkoutItems.reduce((s, c) => s + c.price * c.qty, 0);
            const firstName = checkoutItems[0]?.name ?? "-";
            setLastOrderName(checkoutItems.length > 1 ? `${firstName} 외 ${checkoutItems.length - 1}건` : firstName);
            setLastPayAmount(total);
            if (!buyNow) {
              setCart((prev) => {
                const next = { ...prev };
                Object.keys(cartSel).forEach((k) => {
                  if (cartSel[k]) delete next[k];
                });
                return next;
              });
              setCartSel({});
            }
            setBuyNow(null);
            setPointUse(0);
            setCouponSel(null);
            setScreen("paydone");
          }}
        />
      )}

      {screen === "newaddr" && (
        <NewAddrInputScreen
          onBack={() => {
            setScreen("checkout");
            setSheet("addrchg");
          }}
          name={newAddrName}
          phone={newAddrPhone}
          addr={newAddrAddr}
          onChangeName={setNewAddrName}
          onChangePhone={setNewAddrPhone}
          onChangeAddr={setNewAddrAddr}
          onSave={() => {
            if (!newAddrName || !newAddrPhone || !newAddrAddr) {
              showToast("배송지 정보를 모두 입력하세요");
              return;
            }
            const id = `a${Date.now()}`;
            setAddrExtra((prev) => [...prev, { id, name: newAddrName, phone: newAddrPhone, addr: newAddrAddr, isDefault: false }]);
            setSelectedAddr(id);
            setNewAddrName("");
            setNewAddrPhone("");
            setNewAddrAddr("");
            setScreen("checkout");
            setSheet("addrchg");
            showToast("새 배송지가 저장됐어요", "success");
          }}
        />
      )}

      {screen === "paydone" && (
        <OrderDoneScreen
          orderName={lastOrderName}
          payAmount={lastPayAmount}
          payLabel={payMethod === "bank" ? "무통장 입금" : "신용/체크카드"}
          orderNo="SHOP-240718"
          onGoOrders={goOrders}
        />
      )}

      {screen === "orders" && (
        <OrderHistScreen
          onBack={goMain}
          onOpenOrder={(id) => {
            setOrderDetailId(id);
            const o = ORDER_DEFS[id];
            if (o.status === "done" && !orderConfirmed[id]) {
              setScreen("dlvdonecfm");
            } else {
              setScreen("orderdtl");
            }
          }}
        />
      )}

      {screen === "dlvdonecfm" && (
        <DlvDoneCfmScreen
          onBack={goOrders}
          orderId={orderDetailId}
          onConfirm={() => {
            setOrderConfirmed((prev) => ({ ...prev, [orderDetailId]: true }));
            showToast("구매가 확정됐어요", "success");
            setScreen("orderdtl");
            setReviewStar(0);
            setReviewText("");
            setReviewPhotos([]);
            setSheet("review");
          }}
          onOpenCancelReturn={() => {
            setCancelReason("");
            setCancelDetail("");
            setSheet("cancelreturn");
          }}
        />
      )}

      {screen === "orderdtl" && (
        <OrderDtlScreen
          onBack={goOrders}
          orderId={orderDetailId}
          selAddrName={selAddrName}
          selAddrText={selAddrText}
          onTapAction={() => {
            const o = ORDER_DEFS[orderDetailId];
            if (o.status === "done") {
              setReviewStar(0);
              setReviewText("");
              setReviewPhotos([]);
              setSheet("review");
            } else {
              showToast("실시간 배송 위치를 조회해요");
            }
          }}
        />
      )}

      {screen === "wish" && <WishScreen onBack={goMain} wish={wish} onToggleWish={toggleWish} onOpenDetail={goDetail} />}

      {sheet === "addrchg" && (
        <AddrChgScreen
          onClose={closeSheet}
          addresses={addresses}
          selectedAddr={selectedAddr}
          onSelectAddr={setSelectedAddr}
          onOpenNewAddr={() => {
            setNewAddrName("");
            setNewAddrPhone("");
            setNewAddrAddr("");
            setSheet(null);
            setScreen("newaddr");
          }}
          onConfirm={closeSheet}
        />
      )}

      {sheet === "cancelreturn" && (
        <CancelReturnApplyScreen
          onClose={closeSheet}
          reason={cancelReason}
          onSelectReason={setCancelReason}
          detail={cancelDetail}
          onChangeDetail={setCancelDetail}
          onSubmit={() => {
            closeSheet();
            showToast("취소·반품 신청이 접수됐어요", "success");
            onCancelReturnSubmitted();
          }}
        />
      )}

      {sheet === "review" && (
        <ReviewWriteScreen
          selName={PRODUCTS[ORDER_DEFS[orderDetailId].pid].name}
          title="리뷰 작성"
          question={`${PRODUCTS[ORDER_DEFS[orderDetailId].pid].name}, 사용해 보니 어떠셨나요?`}
          placeholder="상품 품질, 배송 등 경험을 남겨주세요"
          ctaLabel="리뷰 등록하기"
          reviewStar={reviewStar}
          reviewText={reviewText}
          photos={reviewPhotos}
          onSelectStar={setReviewStar}
          onTextChange={setReviewText}
          onAddPhoto={(dataUri) => setReviewPhotos((prev) => [...prev, dataUri])}
          onRemovePhoto={(index) => setReviewPhotos((prev) => prev.filter((_, i) => i !== index))}
          onError={showToast}
          onClose={closeSheet}
          onSubmit={() => {
            if (reviewStar === 0) return;
            showToast("소중한 리뷰가 등록됐어요", "success");
            setTimeout(() => setSheet(null), 700);
          }}
        />
      )}

      {toast && (
        <div className="absolute inset-x-0 bottom-10 z-[90] flex justify-center px-6">
          <Toast tone={toast.tone}>{toast.message}</Toast>
        </div>
      )}
    </div>
  );
}
