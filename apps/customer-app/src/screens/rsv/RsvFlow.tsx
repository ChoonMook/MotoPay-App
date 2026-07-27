// 고객앱 "예약시공" 20개 화면(CU-RSVC-01~20)을 엮는 상태 컨테이너 (NcpkFlow.tsx와 동일한 패턴)
import { useEffect, useState } from "react";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../components/ui/useToast";
import { pushBackAction } from "../../native/backHandler";

import BookingScreen from "./BookingScreen";
import ReqTypeSelScreen from "./ReqTypeSelScreen";
import CstItemSelGenScreen from "./CstItemSelGenScreen";
import CstProdSelScreen from "./cstitems/CstProdSelScreen";
import ProdSearchSelScreen from "./cstitems/cstprods/ProdSearchSelScreen";
import CatBudgetInputExpertScreen from "./CatBudgetInputExpertScreen";
import SchedRadiusCondInputScreen from "./SchedRadiusCondInputScreen";
import BidRcmdReqRegDoneScreen from "./BidRcmdReqRegDoneScreen";
import BidCoCmpGenScreen from "./BidCoCmpGenScreen";
import BidContDtlScreen from "./bidcocmp/BidContDtlScreen";
import PlanCmpExpertScreen from "./PlanCmpExpertScreen";
import PlanDtlScreen from "./plancmpe/PlanDtlScreen";
import CoPlanPickPayScreen from "./CoPlanPickPayScreen";
import PayDoneScreen from "./PayDoneScreen";
import ProdDtlScreen from "./ProdDtlScreen";
import PosLvlSelScreen from "../common/PosLvlSelScreen";
import CstDoneHandoverScreen from "../common/CstDoneHandoverScreen";
import ReviewWriteScreen from "../common/ReviewWriteScreen";
import CoDtlProfScreen from "../common/CoDtlProfScreen";
import BookingDtlScreen, { type BookingTimelineStep } from "../common/BookingDtlScreen";
import BookingReschedScreen from "../common/BookingReschedScreen";
import BookingCancelScreen, { CANCEL_REASONS } from "../common/BookingCancelScreen";

import {
  ITEM_DEFS,
  COUPON_DEFS,
  type RsvScreen,
  type RsvSheet,
  type RsvFlowKind,
  type ItemKey,
  type ProdItemKey,
  type PayMethodKey,
  type SortBidKey,
} from "./rsvTypes";
import { selectedEntry } from "./rsvCalc";
import { nfmt } from "./rsvFormat";
import { TINT_POSITIONS, type TintLevel, type HandoverStatus } from "../common/commonTypes";

const INITIAL_ITEMS: Record<ItemKey, boolean> = { tint: true, blackbox: true, glass: false, under: false, ppf: false, detail: false };
const INITIAL_PROD: Record<ProdItemKey, string> = {
  blackbox: "아이나비 QXD3000",
  glass: "크리스탈 세라믹 2년",
  under: "방청 언더코팅",
  ppf: "프론트 풀",
  detail: "외장 광택",
};
const INITIAL_POS_LEVELS: Record<string, TintLevel> = Object.fromEntries(TINT_POSITIONS.map((p) => [p, "15"]));

interface RsvFlowProps {
  onExit: () => void;
  onOpenShop: () => void;
  onOpenMyPage: () => void;
  initialScreen?: RsvScreen;
}

export default function RsvFlow({ onExit, onOpenShop, onOpenMyPage, initialScreen = "main" }: RsvFlowProps) {
  const [screen, setScreen] = useState<RsvScreen>(initialScreen);
  const [sheet, setSheet] = useState<RsvSheet>(null);
  const [flow, setFlow] = useState<RsvFlowKind>("gen");

  const [items, setItems] = useState<Record<ItemKey, boolean>>(INITIAL_ITEMS);
  const [prodTint, setProdTint] = useState("루마 버텍스 300");
  const [prod, setProd] = useState<Record<ProdItemKey, string>>(INITIAL_PROD);
  const [prodDrop, setProdDrop] = useState<ProdItemKey | null>(null);
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("all");

  const [posLevels, setPosLevels] = useState<Record<string, TintLevel>>(INITIAL_POS_LEVELS);
  const [posBulk, setPosBulk] = useState(true);
  const [posOff, setPosOff] = useState<Record<string, boolean>>({});

  const [catCats, setCatCats] = useState<Record<string, boolean>>({ 외장수리: true });
  const [budget, setBudget] = useState(300000);
  const [catReq, setCatReq] = useState("");

  const [condDate, setCondDate] = useState<number | null>(null);
  const [condRadius, setCondRadius] = useState("10");
  const [condRating, setCondRating] = useState("전체");

  const [sortBid, setSortBid] = useState<SortBidKey>("rating");
  const [selId, setSelId] = useState("b1");
  const [returnTo, setReturnTo] = useState<RsvScreen>("bidcmp");
  const [prodReturn, setProdReturn] = useState<RsvScreen>("biddtl");
  const [payMethod, setPayMethod] = useState<PayMethodKey>("card");
  const [emptyDemo, setEmptyDemo] = useState(false);

  const [pointUse, setPointUse] = useState(0);
  const [couponSel, setCouponSel] = useState<string | null>(null);

  const [reviewStar, setReviewStar] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const [handover, setHandover] = useState<HandoverStatus>("pending");

  // CU-RSVC-20/21/22 예약 상세·일정변경·예약취소 (데모 데이터 — 이 플로우는 아직 실제 예약 API에 연동돼 있지 않음)
  const [bookingCancelled, setBookingCancelled] = useState(false);
  const [cancelReason, setCancelReason] = useState<string | null>(null);
  const [cancelEtc, setCancelEtc] = useState("");
  const reschedRef = new Date();
  const [reschedCalY, setReschedCalY] = useState(reschedRef.getFullYear());
  const [reschedCalM, setReschedCalM] = useState(reschedRef.getMonth() + 1);
  const [reschedDay, setReschedDay] = useState<number | null>(null);
  const [reschedTime, setReschedTime] = useState("");

  const { toast, showToast } = useToast();

  const goMain = () => {
    setScreen("main");
    setSheet(null);
  };
  const openReqType = () => {
    setScreen("main");
    setSheet("reqtype");
  };
  const isExpert = flow === "expert";
  const { isRec, name: selName, bidder: selBidder, reco: selReco } = selectedEntry(selId);
  const selRating = isRec ? selReco?.rating ?? "" : selBidder?.rating ?? "";
  const selDist = isRec ? selReco?.dist ?? "" : selBidder?.dist ?? "";

  // CU-RSVC-20 예약 상세 데모 데이터 — "시공중" 요청 카드(하부 언더코팅 · 강남 카프로) 기준 고정값
  const bookingShopName = "강남 카프로";
  const bookingItemLabel = "하부 언더코팅";
  const bookingPayAmount = 280000;
  const bookingBaseVisitLabel = "2026.03.20 (금) 10:00";
  const bookingVisitLabel = reschedDay
    ? `${reschedCalY}.${String(reschedCalM).padStart(2, "0")}.${String(reschedDay).padStart(2, "0")} ${reschedTime}`
    : bookingBaseVisitLabel;
  const bookingRows: Array<[string, string]> = [
    ["예약 일시", bookingVisitLabel],
    ["시공 항목", bookingItemLabel],
    ["결제 금액", `${nfmt(bookingPayAmount)}원`],
  ];
  const bookingStages = bookingCancelled ? ["선정완료", "시공예정", "취소됨"] : ["선정완료", "시공예정", "시공중", "시공완료"];
  const bookingCur = 1; // 0-indexed: 시공예정(취소·일정변경 가능 구간)
  const bookingTimeline: BookingTimelineStep[] = bookingStages.map((label, i) => {
    const cancelledStep = bookingCancelled && i === bookingStages.length - 1;
    const done = i < bookingCur;
    const active = i === bookingCur || cancelledStep;
    return {
      label,
      state: cancelledStep ? "cancelled" : active ? "active" : done ? "done" : "pending",
      date: cancelledStep ? "취소 처리됨" : i === 0 ? "03.15" : i === 1 ? bookingVisitLabel.slice(5) : undefined,
    };
  });
  const bookingCancellable = !bookingCancelled;
  const cancelReasonLabel = CANCEL_REASONS.find((r) => r.id === cancelReason)?.label ?? "사유 미기재";
  const cancelRefundLabel = "전액 환불 처리됨"; // 데모: 시공예정 단계·3일 이상 전 취소 가정 → 전액 환불

  // 하드웨어 백버튼: 각 화면 상단 '‹' 버튼의 onBack과 동일한 대상으로 이동. regdone/paydone처럼
  // 원래 뒤로가기 버튼이 없는 화면은 등록하지 않음(상위 스택으로 흘러가 홈으로 이동)
  useEffect(() => {
    if (sheet) {
      return pushBackAction(() => setSheet(null));
    }
    switch (screen) {
      case "itemsel":
        return pushBackAction(goMain);
      case "prodsel":
        return pushBackAction(() => setScreen("itemsel"));
      case "prodsearch":
        return pushBackAction(() => setScreen("prodsel"));
      case "catbudget":
        return pushBackAction(openReqType);
      case "condinput":
        return pushBackAction(() => setScreen(isExpert ? "catbudget" : "prodsel"));
      case "bidcmp":
        return pushBackAction(goMain);
      case "biddtl":
        return pushBackAction(() => setScreen("bidcmp"));
      case "plancmp":
        return pushBackAction(goMain);
      case "plandtl":
        return pushBackAction(() => setScreen("plancmp"));
      case "pay":
        return pushBackAction(() => setScreen(isRec ? "plandtl" : "biddtl"));
      case "handover":
        return pushBackAction(goMain);
      case "copro":
        return pushBackAction(() => setScreen(returnTo || "bidcmp"));
      case "proddtl":
        return pushBackAction(() => setScreen(prodReturn || "biddtl"));
      case "bookingdtl":
        return pushBackAction(goMain);
      case "resched":
      case "cancel":
        return pushBackAction(() => setScreen("bookingdtl"));
      default:
        return;
    }
  }, [screen, sheet, isExpert, isRec, returnTo, prodReturn]);

  const selectPosLevel = (position: string, level: TintLevel) => {
    if (posBulk) {
      setPosLevels(Object.fromEntries(TINT_POSITIONS.map((p) => [p, level])));
    } else {
      setPosLevels((cur) => ({ ...cur, [position]: level }));
    }
  };

  const condDateLabel = (() => {
    if (!condDate) return "";
    const wd = ["일", "월", "화", "수", "목", "금", "토"][new Date(2026, 6, condDate).getDay()];
    return `7월 ${condDate}일(${wd})`;
  })();

  const regRows = (() => {
    const catNames = Object.keys(catCats).filter((n) => catCats[n]);
    const genItemNames = ITEM_DEFS.filter((it) => items[it.key]).map((it) => it.name.replace(/ \(.*\)/, ""));
    const summaryItems = isExpert
      ? catNames.length
        ? catNames[0] + (catNames.length > 1 ? ` 외 ${catNames.length - 1}건` : "")
        : "-"
      : genItemNames.length
        ? genItemNames[0] + (genItemNames.length > 1 ? ` 외 ${genItemNames.length - 1}건` : "")
        : "-";
    const rows = [
      { k: "요청 유형", v: isExpert ? "전문가 추천" : "일반 입찰" },
      { k: isExpert ? "관심 카테고리" : "시공 항목", v: summaryItems },
      ...(isExpert ? [{ k: "희망 예산", v: `${nfmt(budget)}원` }] : []),
      { k: "검색 반경", v: `${condRadius}km · 평점 ${condRating}` },
      { k: "희망 일자", v: condDateLabel || "미선택" },
    ];
    return rows;
  })();

  return (
    <div className="absolute inset-0 overflow-hidden">
      {screen === "main" && (
        <BookingScreen
          onStartRequest={() => setSheet("reqtype")}
          onOpenBid={() => {
            setScreen("bidcmp");
            setFlow("gen");
          }}
          onOpenPlanCmp={() => {
            setScreen("plancmp");
            setFlow("expert");
          }}
          onOpenBookingDtl={() => {
            setScreen("bookingdtl");
            setFlow("gen");
            setSelId("b1");
          }}
          onOpenHandover={() => {
            setScreen("handover");
            setFlow("expert");
            setSelId("r1");
          }}
          onExit={onExit}
          onOpenShop={onOpenShop}
          onOpenMyPage={onOpenMyPage}
          onNavToast={(label) => showToast(`${label} 탭으로 이동해요`)}
        />
      )}

      {screen === "itemsel" && (
        <CstItemSelGenScreen
          items={items}
          onToggleItem={(key) => setItems((cur) => ({ ...cur, [key]: !cur[key] }))}
          onBack={goMain}
          onNext={() => setScreen("prodsel")}
        />
      )}

      {screen === "prodsel" && (
        <CstProdSelScreen
          items={items}
          prodTint={prodTint}
          prod={prod}
          prodDrop={prodDrop}
          onOpenSearch={() => setScreen("prodsearch")}
          onToggleDrop={(key) => setProdDrop((cur) => (cur === key ? null : key))}
          onSelectProd={(key, value) => {
            setProd((cur) => ({ ...cur, [key]: value }));
            setProdDrop(null);
          }}
          onBack={() => setScreen("itemsel")}
          onNext={() => (items.tint ? setSheet("poslvl") : setScreen("condinput"))}
        />
      )}

      {screen === "prodsearch" && (
        <ProdSearchSelScreen
          search={search}
          brand={brand}
          selectedName={prodTint}
          onSearchChange={setSearch}
          onBrandChange={setBrand}
          onSelect={(name) => {
            setProdTint(name);
            setScreen("prodsel");
            showToast(`${name} 선택됨`, "success");
          }}
          onBack={() => setScreen("prodsel")}
        />
      )}

      {screen === "catbudget" && (
        <CatBudgetInputExpertScreen
          catCats={catCats}
          budget={budget}
          catReq={catReq}
          onToggleCat={(name) => setCatCats((cur) => ({ ...cur, [name]: !cur[name] }))}
          onBudgetChange={setBudget}
          onCatReqChange={setCatReq}
          onBack={openReqType}
          onNext={() => setScreen("condinput")}
        />
      )}

      {screen === "condinput" && (
        <SchedRadiusCondInputScreen
          isExpert={isExpert}
          condDate={condDate}
          condRadius={condRadius}
          condRating={condRating}
          onSelectDate={setCondDate}
          onSelectRadius={setCondRadius}
          onSelectRating={setCondRating}
          onBack={() => setScreen(isExpert ? "catbudget" : "prodsel")}
          onNext={() => setScreen("regdone")}
        />
      )}

      {screen === "regdone" && (
        <BidRcmdReqRegDoneScreen
          isExpert={isExpert}
          regRows={regRows}
          onConfirm={() => {
            showToast("예약시공 메인으로 이동해요");
            setTimeout(() => setScreen("main"), 700);
          }}
        />
      )}

      {screen === "bidcmp" && (
        <BidCoCmpGenScreen
          emptyDemo={emptyDemo}
          onToggleEmpty={() => setEmptyDemo((v) => !v)}
          sortBid={sortBid}
          onSortChange={setSortBid}
          onSelectBid={(id) => {
            setScreen("biddtl");
            setSelId(id);
          }}
          onReRequest={() => {
            showToast("요청유형 선택으로 이동해요");
            setEmptyDemo(false);
            openReqType();
          }}
          onBack={goMain}
        />
      )}

      {screen === "biddtl" && (
        <BidContDtlScreen
          selId={selId}
          onBack={() => setScreen("bidcmp")}
          onOpenProfile={() => {
            setReturnTo("biddtl");
            setScreen("copro");
          }}
          onOpenProdDtl={() => {
            setProdReturn("biddtl");
            setScreen("proddtl");
          }}
          onPick={() => setScreen("pay")}
        />
      )}

      {screen === "plancmp" && (
        <PlanCmpExpertScreen
          emptyDemo={emptyDemo}
          onToggleEmpty={() => setEmptyDemo((v) => !v)}
          onSelectReco={(id) => {
            setScreen("plandtl");
            setSelId(id);
          }}
          onReRequest={() => {
            showToast("요청유형 선택으로 이동해요");
            setEmptyDemo(false);
            openReqType();
          }}
          onBack={goMain}
        />
      )}

      {screen === "plandtl" && (
        <PlanDtlScreen
          selId={selId}
          onBack={() => setScreen("plancmp")}
          onOpenProfile={() => {
            setReturnTo("plandtl");
            setScreen("copro");
          }}
          onOpenProdDtl={() => {
            setProdReturn("plandtl");
            setScreen("proddtl");
          }}
          onPick={() => setScreen("pay")}
        />
      )}

      {screen === "pay" && (
        <CoPlanPickPayScreen
          selId={selId}
          payMethod={payMethod}
          pointUse={pointUse}
          couponSel={couponSel}
          couponSheetOpen={sheet === "coupon"}
          onPointChange={setPointUse}
          onSelectPayMethod={setPayMethod}
          onOpenCouponSheet={() => setSheet("coupon")}
          onCloseCouponSheet={() => setSheet(null)}
          onSelectCoupon={setCouponSel}
          onConfirmCoupon={() => {
            setSheet(null);
            const c = COUPON_DEFS.find((d) => d.id === couponSel);
            showToast(c ? `${c.name} 쿠폰이 적용됐어요` : "쿠폰 적용이 해제됐어요", "success");
          }}
          onBack={() => setScreen(isRec ? "plandtl" : "biddtl")}
          onPay={() => setScreen("paydone")}
        />
      )}

      {screen === "paydone" && (
        <PayDoneScreen selId={selId} payMethod={payMethod} couponSel={couponSel} pointUse={pointUse} onConfirm={goMain} />
      )}

      {screen === "handover" && (
        <CstDoneHandoverScreen
          selName={selName}
          handover={handover}
          onBack={goMain}
          onConfirmHandover={() => {
            if (handover !== "done") {
              setHandover("done");
              showToast("인수가 확인되었어요. 감사합니다!", "success");
            } else {
              setSheet("review");
              setReviewStar(0);
              setReviewText("");
              setReviewPhotos([]);
            }
          }}
        />
      )}

      {screen === "copro" && (
        <CoDtlProfScreen name={selName} rating={selRating} dist={selDist} onBack={() => setScreen(returnTo || "bidcmp")} />
      )}

      {screen === "proddtl" && <ProdDtlScreen onBack={() => setScreen(prodReturn || "biddtl")} />}

      {screen === "bookingdtl" && (
        <BookingDtlScreen
          onBack={goMain}
          shopName={bookingShopName}
          shopMeta="★ 4.9 · 후기 1,284 · 2.1km"
          onOpenProfile={() => {
            setReturnTo("bookingdtl");
            setScreen("copro");
          }}
          bookingRows={bookingRows}
          timeline={bookingTimeline}
          cancelled={bookingCancelled}
          cancelReasonLabel={cancelReasonLabel}
          cancelRefundLabel={cancelRefundLabel}
          cancellable={bookingCancellable}
          onOpenResched={() => setScreen("resched")}
          onOpenCancel={() => setScreen("cancel")}
        />
      )}

      {screen === "resched" && (
        <BookingReschedScreen
          onBack={() => setScreen("bookingdtl")}
          onConfirm={() => {
            setScreen("bookingdtl");
            showToast("일정 변경이 요청됐어요. 업체 확인 후 확정돼요.", "success");
          }}
          submitting={false}
          shopName={bookingShopName}
          currentVisitLabel={bookingBaseVisitLabel}
          year={reschedCalY}
          month={reschedCalM}
          day={reschedDay}
          time={reschedTime}
          holidays={[]}
          daySlots={
            reschedDay
              ? [
                  { time: "09:00", disabled: false },
                  { time: "10:30", disabled: false },
                  { time: "13:00", disabled: true },
                  { time: "14:30", disabled: false },
                  { time: "16:00", disabled: false },
                  { time: "17:30", disabled: false },
                ]
              : []
          }
          scheduleLoading={false}
          onSelectDay={(d) => {
            setReschedDay(d);
            setReschedTime("");
          }}
          onSelectTime={setReschedTime}
          onPrevMonth={() => {
            setReschedDay(null);
            setReschedTime("");
            if (reschedCalM === 1) {
              setReschedCalY((y) => y - 1);
              setReschedCalM(12);
            } else {
              setReschedCalM((m) => m - 1);
            }
          }}
          onNextMonth={() => {
            setReschedDay(null);
            setReschedTime("");
            if (reschedCalM === 12) {
              setReschedCalY((y) => y + 1);
              setReschedCalM(1);
            } else {
              setReschedCalM((m) => m + 1);
            }
          }}
        />
      )}

      {screen === "cancel" && (
        <BookingCancelScreen
          onBack={() => setScreen("bookingdtl")}
          onConfirm={() => {
            setBookingCancelled(true);
            setScreen("bookingdtl");
            showToast("예약이 취소됐어요", "danger");
          }}
          submitting={false}
          shopName={bookingShopName}
          itemSummaryLabel={bookingItemLabel}
          visitDateLabel={bookingVisitLabel}
          priceLabel={`${nfmt(bookingPayAmount)}원`}
          reason={cancelReason}
          etcText={cancelEtc}
          refundAmount={bookingPayAmount}
          onSelectReason={setCancelReason}
          onEtcChange={setCancelEtc}
        />
      )}

      {sheet === "reqtype" && (
        <ReqTypeSelScreen
          onClose={() => setSheet(null)}
          onSelectGeneral={() => {
            setScreen("itemsel");
            setSheet(null);
            setFlow("gen");
          }}
          onSelectExpert={() => {
            setScreen("catbudget");
            setSheet(null);
            setFlow("expert");
          }}
        />
      )}

      {sheet === "poslvl" && (
        <PosLvlSelScreen
          onClose={() => setSheet(null)}
          onComplete={() => {
            setSheet(null);
            setScreen("condinput");
          }}
          posLevels={posLevels}
          posBulk={posBulk}
          posOff={posOff}
          onSelectLevel={selectPosLevel}
          onToggleBulk={() => setPosBulk((v) => !v)}
          onTogglePosition={(name) => setPosOff((cur) => ({ ...cur, [name]: !cur[name] }))}
        />
      )}

      {sheet === "review" && (
        <ReviewWriteScreen
          selName={selName}
          reviewStar={reviewStar}
          reviewText={reviewText}
          photos={reviewPhotos}
          onSelectStar={setReviewStar}
          onTextChange={setReviewText}
          onAddPhoto={(dataUri) => setReviewPhotos((prev) => [...prev, dataUri])}
          onRemovePhoto={(index) => setReviewPhotos((prev) => prev.filter((_, i) => i !== index))}
          onError={showToast}
          onClose={() => setSheet(null)}
          onSubmit={() => {
            if (reviewStar === 0) return;
            showToast("소중한 후기가 등록됐어요", "success");
            setTimeout(() => {
              setSheet(null);
              setScreen("main");
            }, 700);
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
