// 고객앱 "예약시공" 20개 화면(CU-RSVC-01~20)을 엮는 상태 컨테이너 (NcpkFlow.tsx와 동일한 패턴)
import { useEffect, useState } from "react";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../components/ui/useToast";
import { pushBackAction } from "../../native/backHandler";

import BookingScreen, { displayStatus, type ReqStatusFilter } from "./BookingScreen";
import BidCancelConfirmScreen from "./BidCancelConfirmScreen";
import ReqTypeSelScreen from "./ReqTypeSelScreen";
import CstItemSelGenScreen from "./CstItemSelGenScreen";
import CstProdSelScreen from "./cstitems/CstProdSelScreen";
import ProdSearchSelScreen from "./cstitems/cstprods/ProdSearchSelScreen";
import CatBudgetInputExpertScreen from "./CatBudgetInputExpertScreen";
import SchedRadiusCondInputScreen, { RATING_LABEL_TO_VALUE } from "./SchedRadiusCondInputScreen";
import BidRcmdReqRegDoneScreen from "./BidRcmdReqRegDoneScreen";
import BidCoCmpGenScreen from "./BidCoCmpGenScreen";
import BidContDtlScreen from "./bidcocmp/BidContDtlScreen";
import PlanCmpExpertScreen from "./PlanCmpExpertScreen";
import PlanDtlScreen from "./plancmpe/PlanDtlScreen";
import CoPlanPickPayScreen from "./CoPlanPickPayScreen";
import PayDoneScreen from "./PayDoneScreen";
import ProdDtlScreen, { type ProdDtlInfo } from "./ProdDtlScreen";
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
  INST_CODE_BY_ITEM_KEY,
  INST_CODE_BY_CAT_NAME,
  TINT_POSITION_TO_CODE,
  INST_CODE_LABELS,
  type RsvScreen,
  type RsvSheet,
  type RsvFlowKind,
  type ItemKey,
  type ProdItemKey,
  type PayMethodKey,
  type Bidder,
  type RecoPlan,
} from "./rsvTypes";
import { selectedEntry } from "./rsvCalc";
import { nfmt } from "./rsvFormat";
import { TINT_POSITIONS, type TintLevel, type HandoverStatus } from "../common/commonTypes";
import {
  createBidRequest,
  listMyBidRequests,
  cancelBidRequest,
  type BidRequestApi,
  type BidRequestCarApi,
  type CreateBidRequestInput,
} from "../../api/bidRequests";
import { getBidOffers, selectBidOffer, type BidOfferApi } from "../../api/bidOffers";
import { getBidPlans, selectBidPlan, type BidPlanApi } from "../../api/bidPlans";
import { getCommonCodeDetails, type CommonCodeDetailApi } from "../../api/commonCodes";
import {
  listMyReservations,
  getHandoverDetail,
  confirmHandover,
  getReview,
  createReview,
  rescheduleReservation,
  cancelReservation,
  type ReservationApi,
  type HandoverDetail,
  type ReviewApi,
} from "../../api/reservations";
import { listShops } from "../../api/shops";
import { listShopHolidays, getDailySchedule, type DailyScheduleApi } from "../../api/shopSchedule";
import { API_BASE_URL } from "../../api/config";

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
  initialFilter?: ReqStatusFilter;
}

export default function RsvFlow({
  onExit,
  onOpenShop,
  onOpenMyPage,
  initialScreen = "main",
  initialFilter = "ALL",
}: RsvFlowProps) {
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
  const condRef = new Date();
  const [condCalY, setCondCalY] = useState(condRef.getFullYear());
  const [condCalM, setCondCalM] = useState(condRef.getMonth() + 1);

  // CU-RSVC-01/02/08/09 요청 생성·내 요청 목록 — 실 API 연동(그 외 비교·선정·결제·사후관리 화면은 여전히 데모 데이터)
  const [myRequests, setMyRequests] = useState<BidRequestApi[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [reqFilter, setReqFilter] = useState<ReqStatusFilter>(initialFilter);
  // requestNo -> 실제 시공건(Reservation) progressStatus — 선정완료 요청의 시공중/시공완료 세분화용(BookingScreen)
  const [reqProgress, setReqProgress] = useState<Record<string, string>>({});
  // requestNo -> 실제 시공건(Reservation) — 시공완료(DONE) 요청을 열 때 인수확인 화면(getHandoverDetail)에 필요한 id·shopCode 조회용
  const [reqReservation, setReqReservation] = useState<Record<string, ReservationApi>>({});
  // shopCode -> 업체명 — 인수확인 화면 타이틀 표시용
  const [shopNameByCode, setShopNameByCode] = useState<Record<string, string>>({});
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<BidRequestApi | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [bidCancelReason, setBidCancelReason] = useState<string | null>(null);
  const [bidCancelEtcText, setBidCancelEtcText] = useState("");
  // 요청 카드·등록완료 화면에 차종(브랜드+모델)을 라벨로 보여주기 위한 코드값 조회
  const [carBrandCodes, setCarBrandCodes] = useState<CommonCodeDetailApi[]>([]);
  const [carModelCodes, setCarModelCodes] = useState<CommonCodeDetailApi[]>([]);
  const [lastCreatedRequest, setLastCreatedRequest] = useState<BidRequestApi | null>(null);

  const [selId, setSelId] = useState("b1");
  // CU-RSVC-10/11/12/13 입찰 업체 비교·상세(GENERAL), 추천안 비교·상세(EXPERT) 모두 실 API 연동
  const [bidOffers, setBidOffers] = useState<Bidder[]>([]);
  const [recoPlans, setRecoPlans] = useState<RecoPlan[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  // 비교·상세 화면이 참조하는 원본 요청 — status/selectedOfferNo로 이미 선정완료된 요청인지 판단해 "선택" 버튼을 비활성화
  const [activeBidRequest, setActiveBidRequest] = useState<BidRequestApi | null>(null);
  // 입찰 내용 상세에서 "제품 상세"로 들어갈 때 보여줄 정보(고객이 요청한 제품명·부위별 농도) — GENERAL만 값 설정, EXPERT는 null 유지(기존 목업)
  const [activeProdInfo, setActiveProdInfo] = useState<ProdDtlInfo | null>(null);
  const [returnTo, setReturnTo] = useState<RsvScreen>("bidcmp");
  const [prodReturn, setProdReturn] = useState<RsvScreen>("biddtl");
  const [payMethod, setPayMethod] = useState<PayMethodKey>("card");

  const [pointUse, setPointUse] = useState(0);
  const [couponSel, setCouponSel] = useState<string | null>(null);

  const [reviewStar, setReviewStar] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  // CU-RSVC-16 시공완료·인수확인 — 실 API 연동(NcpkFlow.tsx와 동일 패턴)
  const [activeReservationId, setActiveReservationId] = useState<number | null>(null);
  const [handoverShopName, setHandoverShopName] = useState("");
  const [handoverDetail, setHandoverDetail] = useState<HandoverDetail | null>(null);
  const [loadingHandover, setLoadingHandover] = useState(false);
  const [confirmingHandover, setConfirmingHandover] = useState(false);
  const [review, setReview] = useState<ReviewApi | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  // CU-RSVC-20/21/22 예약 상세·일정변경·예약취소 — 실 API 연동(NcpkFlow.tsx와 동일 패턴)
  const [activeReservation, setActiveReservation] = useState<ReservationApi | null>(null);
  const [cancelReason, setCancelReason] = useState<string | null>(null);
  const [cancelEtc, setCancelEtc] = useState("");
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const reschedRef = new Date();
  const [reschedCalY, setReschedCalY] = useState(reschedRef.getFullYear());
  const [reschedCalM, setReschedCalM] = useState(reschedRef.getMonth() + 1);
  const [reschedDay, setReschedDay] = useState<number | null>(null);
  const [reschedTime, setReschedTime] = useState("");
  const [reschedSubmitting, setReschedSubmitting] = useState(false);
  const [reschedHolidays, setReschedHolidays] = useState<string[]>([]);
  const [reschedDaySchedule, setReschedDaySchedule] = useState<DailyScheduleApi | null>(null);
  const [reschedScheduleLoading, setReschedScheduleLoading] = useState(false);

  const { toast, showToast } = useToast();

  useEffect(() => {
    listMyBidRequests()
      .then(setMyRequests)
      .catch((err) => showToast(err instanceof Error ? err.message : "요청 목록을 불러오지 못했어요", "danger"))
      .finally(() => setLoadingRequests(false));
    listMyReservations()
      .then((reservations) => {
        const progress: Record<string, string> = {};
        const byRequest: Record<string, ReservationApi> = {};
        for (const r of reservations) {
          if (r.reservationType === "BID" && r.requestNo) {
            progress[r.requestNo] = r.progressStatus;
            byRequest[r.requestNo] = r;
          }
        }
        setReqProgress(progress);
        setReqReservation(byRequest);
      })
      .catch(() => {}); // 실패해도 선정완료로 폴백 표시되므로 별도 에러 토스트 불필요
    listShops()
      .then((shops) => setShopNameByCode(Object.fromEntries(shops.map((s) => [s.shopCode, s.name]))))
      .catch(() => {});
    getCommonCodeDetails("CAR_BRAND").then(setCarBrandCodes).catch(() => {});
    getCommonCodeDetails("CAR_MODEL").then(setCarModelCodes).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // CU-RSVC-21 일정 변경 — 캘린더에 표시할 선정 업체의 월별 휴무일
  useEffect(() => {
    const shopCode = activeReservation?.shopCode;
    if (!shopCode) {
      setReschedHolidays([]);
      return;
    }
    listShopHolidays(shopCode, reschedCalY, reschedCalM)
      .then(setReschedHolidays)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeReservation?.shopCode, reschedCalY, reschedCalM]);

  // CU-RSVC-21 일정 변경 — 새로 고른 날짜의 예약 가능 시간대 조회
  useEffect(() => {
    const shopCode = activeReservation?.shopCode;
    if (!shopCode || !reschedDay) {
      setReschedDaySchedule(null);
      return;
    }
    const dateKey = `${reschedCalY}-${String(reschedCalM).padStart(2, "0")}-${String(reschedDay).padStart(2, "0")}`;
    setReschedScheduleLoading(true);
    getDailySchedule(shopCode, dateKey)
      .then(setReschedDaySchedule)
      .catch((err) => showToast(err instanceof Error ? err.message : "예약 가능 시간을 불러오지 못했어요", "danger"))
      .finally(() => setReschedScheduleLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeReservation?.shopCode, reschedDay]);

  // 차종 코드 -> 한글 라벨(예: "현대 쏘렌토" 또는 세부차종명이 있으면 "벤츠 E-Class E 200"), 등록된 차량이 없으면 null
  const carLabel = (car: BidRequestCarApi | null): string | null => {
    if (!car) return null;
    const brand = carBrandCodes.find((d) => d.detailCode === car.carBrandCode)?.detailName ?? car.carBrandCode;
    const model = carModelCodes.find((d) => d.detailCode === car.carModelCode)?.detailName ?? car.carModelCode;
    return car.trimName ? `${brand} ${model} ${car.trimName}` : `${brand} ${model}`;
  };

  const goMain = () => {
    setScreen("main");
    setSheet(null);
  };
  const openReqType = () => {
    setScreen("main");
    setSheet("reqtype");
  };
  const isExpert = flow === "expert";
  const { isRec, name: selName, total: selTotal } = selectedEntry(selId, isExpert, bidOffers, recoPlans);
  // GENERAL 응찰·EXPERT 추천안 모두 DB에 리뷰/좌표 데이터가 없어 평점·거리 미제공
  const selRating = "";
  const selDist = "";

  const handoverStatus: HandoverStatus = handoverDetail?.handoverStatus === "confirmed" ? "done" : "pending";
  const handoverPhotoUrls = (handoverDetail?.photos ?? []).map((p) => `${API_BASE_URL}/uploads/${p}`);

  // CU-RSVC-20 예약 상세 — 선정완료(SELECTED)~시공중(IN_PROGRESS) 요청을 열 때의 실제 낙찰·예약 데이터
  const bookingItemLabel = activeBidRequest
    ? activeBidRequest.items.map((it) => INST_CODE_LABELS[it.instCode] ?? it.instCode).join(" · ") || "-"
    : "-";
  const bookingBaseVisitLabel = activeReservation ? `${activeReservation.date.replaceAll("-", ".")} ${activeReservation.time}` : "";
  const bookingVisitLabel = reschedDay
    ? `${reschedCalY}.${String(reschedCalM).padStart(2, "0")}.${String(reschedDay).padStart(2, "0")} ${reschedTime}`
    : bookingBaseVisitLabel;
  const bookingRows: Array<[string, string]> = [
    ["예약 일시", bookingVisitLabel],
    ["시공 항목", bookingItemLabel],
    ["확정 견적", `${nfmt(selTotal)}원`],
  ];
  const bookingProgress = activeReservation?.progressStatus ?? "APPLIED";
  // 취소 여부는 별도 로컬 플래그가 아니라 activeReservation.status를 그대로 반영 — 취소 후 화면을 나갔다 다시 들어와도
  // (openMyRequest가 서버에서 다시 조회한 실제 상태를 담아오므로) 취소 상태가 그대로 유지됨
  const bookingCancelled = activeReservation?.status === "CANCELLED";
  const bookingStages = bookingCancelled ? ["선정완료", "시공예정", "취소됨"] : ["선정완료", "시공예정", "시공중", "시공완료"];
  // 0-indexed: DONE은 인수확인 화면으로 별도 분기되어 이 화면까지 오지 않으므로 IN_PROGRESS/APPLIED만 반영
  const bookingCur = bookingCancelled ? 1 : bookingProgress === "IN_PROGRESS" ? 2 : 1;
  const bookingTimeline: BookingTimelineStep[] = bookingStages.map((label, i) => {
    const cancelledStep = bookingCancelled && i === bookingStages.length - 1;
    const done = i < bookingCur;
    const active = i === bookingCur || cancelledStep;
    return {
      label,
      state: cancelledStep ? "cancelled" : active ? "active" : done ? "done" : "pending",
      date: cancelledStep ? "취소 처리됨" : i === 1 ? bookingVisitLabel : undefined,
    };
  });
  const bookingCancellable = !!activeReservation && !bookingCancelled && bookingProgress === "APPLIED";
  const cancelReasonLabel = CANCEL_REASONS.find((r) => r.id === cancelReason)?.label ?? "사유 미기재";
  // 취소 정책(화면 안내 문구와 동일 기준): 시공 3일 전까지 전액, 1~2일 전 90%(위약금10%), 당일 환불 없음
  const refundDiffDays = activeReservation
    ? Math.round((new Date(`${activeReservation.date}T00:00:00`).getTime() - Date.now()) / 86400000)
    : 3;
  const refundRate = refundDiffDays >= 3 ? 1 : refundDiffDays >= 1 ? 0.9 : 0;
  const refundAmount = Math.round(selTotal * refundRate);
  const cancelRefundLabel =
    refundRate === 1 ? "전액 환불 처리됨" : refundRate === 0.9 ? "90% 환불(위약금 10%) 처리됨" : "환불 없음(당일 취소)";
  const reschedDaySlots = (reschedDaySchedule?.slots ?? []).map((s) => ({
    time: s.time,
    disabled: s.capacity === null || s.isLocked || s.reservedCount >= s.capacity,
  }));

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
    const wd = ["일", "월", "화", "수", "목", "금", "토"][new Date(condCalY, condCalM - 1, condDate).getDay()];
    return `${condCalM}월 ${condDate}일(${wd})`;
  })();

  // CU-RSVC-08→09 요청 등록 — 실 API로 BidRequest 생성(그 외 비교·선정·결제·사후관리는 여전히 데모)
  const submitBidRequest = async () => {
    if (!condDate || submittingRequest) return;
    setSubmittingRequest(true);
    try {
      const desiredDate = `${condCalY}-${String(condCalM).padStart(2, "0")}-${String(condDate).padStart(2, "0")}`;
      const reqItems = isExpert
        ? Object.keys(catCats)
            .filter((name) => catCats[name])
            .map((name) => ({ instCode: INST_CODE_BY_CAT_NAME[name] }))
        : (Object.keys(items) as ItemKey[])
            .filter((key) => items[key])
            .map((key) => ({
              instCode: INST_CODE_BY_ITEM_KEY[key],
              productName: key === "tint" ? prodTint : prod[key as ProdItemKey],
            }));
      // 틴팅 미선택 요청엔 부위·농도를 아예 싣지 않음 — posLevels/posOff는 화면 진입 시 이미 5부위로 채워져 있어 필터링 없이 그대로 보내면 안 됨
      const reqPositions =
        !isExpert && items.tint
          ? TINT_POSITIONS.filter((p) => !posOff[p]).map((p) => ({
              position: TINT_POSITION_TO_CODE[p],
              level: posLevels[p],
            }))
          : undefined;

      const input: CreateBidRequestInput = {
        reqType: isExpert ? "EXPERT" : "GENERAL",
        desiredDate,
        radiusKm: Number(condRadius) as 5 | 10 | 20,
        minRating: RATING_LABEL_TO_VALUE[condRating],
        budget: isExpert ? budget : undefined,
        note: isExpert ? catReq || undefined : undefined,
        items: reqItems,
        positions: reqPositions,
      };

      const created = await createBidRequest(input);
      setMyRequests((prev) => [created, ...prev]);
      setLastCreatedRequest(created);
      setScreen("regdone");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "요청 등록에 실패했습니다", "danger");
    } finally {
      setSubmittingRequest(false);
    }
  };

  // "YYYY-MM-DD" + "HH:mm" -> "8월 7일(금) 14:00"
  const formatWhenLabel = (desiredDate: string, time: string): string => {
    const d = new Date(`${desiredDate}T00:00:00`);
    const weekday = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
    return `${d.getMonth() + 1}월 ${d.getDate()}일(${weekday}) ${time}`;
  };

  // GET /bid-requests/:id/offers 응답을 화면 표시용 Bidder로 변환
  const mapOffer = (o: BidOfferApi, desiredDate: string): Bidder => ({
    id: o.offerNo,
    name: o.shopName,
    when: formatWhenLabel(desiredDate, o.scheduledTime),
    items: o.items.map((it): [string, number] => [INST_CODE_LABELS[it.instCode] ?? it.instCode, it.price]),
  });

  // GET /bid-requests/:id/plans 응답을 화면 표시용 RecoPlan으로 변환
  const mapPlan = (p: BidPlanApi, desiredDate: string): RecoPlan => {
    const names = p.items.map((it) => INST_CODE_LABELS[it.instCode] ?? it.instCode);
    return {
      id: p.planNo,
      name: p.shopName,
      itemSummary: names.length > 1 ? `${names[0]} 외 ${names.length - 1}건` : (names[0] ?? "-"),
      reason: p.reason,
      when: formatWhenLabel(desiredDate, p.scheduledTime),
      plans: p.items.map((it): [string, number, number] => [it.productName, it.retailPrice, it.offerPrice]),
    };
  };

  // CU-RSVC-01 내 요청 카드 탭 — 시공완료(DONE)는 인수확인·후기등록 화면으로, 선정완료~시공중(SELECTED/IN_PROGRESS)은
  // 예약상세(CU-RSVC-20)로, 그 외(입찰중 등)는 기존대로 GENERAL은 도착한 입찰을, EXPERT는 도착한 추천안을 조회해 비교 화면으로 이동
  const openMyRequest = (request: BidRequestApi) => {
    const status = displayStatus(request, reqProgress);
    if (status === "DONE") {
      const reservation = reqReservation[request.requestNo];
      if (!reservation) return;
      setActiveReservationId(reservation.id);
      setHandoverShopName(shopNameByCode[reservation.shopCode] ?? "선정 업체");
      setHandoverDetail(null);
      setReview(null);
      setLoadingHandover(true);
      getHandoverDetail(reservation.id)
        .then(setHandoverDetail)
        .catch((err) => showToast(err instanceof Error ? err.message : "인수확인 정보를 불러오지 못했어요", "danger"))
        .finally(() => setLoadingHandover(false));
      getReview(reservation.id)
        .then(setReview)
        .catch(() => {}); // 후기 조회 실패는 버튼 노출에만 영향 — 별도 에러 토스트 불필요
      setScreen("handover");
      return;
    }

    const isSelected = status === "SELECTED" || status === "IN_PROGRESS";
    setFlow(request.reqType === "EXPERT" ? "expert" : "gen");
    setActiveBidRequest(request);
    if (isSelected) {
      const reservation = reqReservation[request.requestNo];
      if (!reservation) return;
      setActiveReservation(reservation);
      setCancelReason(null);
      setCancelEtc("");
      setReschedDay(null);
      setReschedTime("");
      setSelId((request.reqType === "EXPERT" ? request.selectedPlanNo : request.selectedOfferNo) ?? "");
    }
    setLoadingOffers(true);
    if (request.reqType === "EXPERT") {
      getBidPlans(request.id)
        .then((plans) => setRecoPlans(plans.map((p) => mapPlan(p, request.desiredDate))))
        .catch((err) => showToast(err instanceof Error ? err.message : "추천안 목록을 불러오지 못했어요", "danger"))
        .finally(() => setLoadingOffers(false));
    } else {
      getBidOffers(request.id)
        .then((offers) => setBidOffers(offers.map((o) => mapOffer(o, request.desiredDate))))
        .catch((err) => showToast(err instanceof Error ? err.message : "입찰 목록을 불러오지 못했어요", "danger"))
        .finally(() => setLoadingOffers(false));
    }
    setScreen(isSelected ? "bookingdtl" : request.reqType === "EXPERT" ? "plancmp" : "bidcmp");
  };

  // 요청 취소 시트 열기 — 이전 요청에서 남은 취소사유 선택 상태를 초기화
  const openCancelSheet = (request: BidRequestApi) => {
    setCancelTarget(request);
    setBidCancelReason(null);
    setBidCancelEtcText("");
  };

  // 요청 취소 — 수정 대신 취소 후 재요청 방식(OPEN 상태만 가능), 취소사유 필수
  const confirmCancelRequest = async () => {
    if (!cancelTarget || cancelling || !bidCancelReason) return;
    if (bidCancelReason === "ETC" && !bidCancelEtcText.trim()) return;
    setCancelling(true);
    try {
      const updated = await cancelBidRequest(cancelTarget.id, {
        cancelReason: bidCancelReason as "SIMPLE" | "RE_REQUEST" | "ETC",
        cancelReasonNote: bidCancelReason === "ETC" ? bidCancelEtcText.trim() : undefined,
      });
      setMyRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setCancelTarget(null);
      showToast("요청이 취소됐어요", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "요청 취소에 실패했습니다", "danger");
    } finally {
      setCancelling(false);
    }
  };

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
    const carRowLabel = carLabel(lastCreatedRequest?.car ?? null);
    const rows = [
      { k: "요청 유형", v: isExpert ? "전문가 추천" : "일반 입찰" },
      ...(carRowLabel ? [{ k: "차종", v: carRowLabel }] : []),
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
          requests={myRequests}
          loading={loadingRequests}
          filter={reqFilter}
          onChangeFilter={setReqFilter}
          progressByRequest={reqProgress}
          carLabel={carLabel}
          onOpenRequest={openMyRequest}
          onCancelRequest={openCancelSheet}
          onStartRequest={() => setSheet("reqtype")}
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
          year={condCalY}
          month={condCalM}
          condDate={condDate}
          condRadius={condRadius}
          condRating={condRating}
          onSelectDate={setCondDate}
          onSelectRadius={setCondRadius}
          onSelectRating={setCondRating}
          onPrevMonth={() => {
            setCondDate(null);
            if (condCalM === 1) {
              setCondCalY((y) => y - 1);
              setCondCalM(12);
            } else {
              setCondCalM((m) => m - 1);
            }
          }}
          onNextMonth={() => {
            setCondDate(null);
            if (condCalM === 12) {
              setCondCalY((y) => y + 1);
              setCondCalM(1);
            } else {
              setCondCalM((m) => m + 1);
            }
          }}
          onBack={() => setScreen(isExpert ? "catbudget" : "prodsel")}
          onNext={submitBidRequest}
          submitting={submittingRequest}
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
          bidders={bidOffers}
          loading={loadingOffers}
          onSelectBid={(id) => {
            setScreen("biddtl");
            setSelId(id);
          }}
          onReRequest={() => {
            showToast("요청유형 선택으로 이동해요");
            openReqType();
          }}
          onBack={goMain}
        />
      )}

      {screen === "biddtl" && (
        <BidContDtlScreen
          selId={selId}
          bidders={bidOffers}
          requestItems={activeBidRequest?.items ?? []}
          requestPositions={activeBidRequest?.positions ?? []}
          decided={!!activeBidRequest && activeBidRequest.status !== "OPEN"}
          selectedOfferNo={activeBidRequest?.selectedOfferNo ?? null}
          onBack={() => setScreen("bidcmp")}
          onOpenProfile={() => {
            setReturnTo("biddtl");
            setScreen("copro");
          }}
          onOpenProdDtl={(info) => {
            setActiveProdInfo(info);
            setProdReturn("biddtl");
            setScreen("proddtl");
          }}
          onPick={async () => {
            if (!activeBidRequest) return;
            try {
              const updated = await selectBidOffer(activeBidRequest.id, selId);
              setActiveBidRequest(updated);
              setMyRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
              setScreen("pay");
            } catch (err) {
              showToast(err instanceof Error ? err.message : "업체 선택에 실패했어요", "danger");
            }
          }}
        />
      )}

      {screen === "plancmp" && (
        <PlanCmpExpertScreen
          recos={recoPlans}
          loading={loadingOffers}
          budgetLabel={`${nfmt(activeBidRequest?.budget ?? 0)}원`}
          onSelectReco={(id) => {
            setScreen("plandtl");
            setSelId(id);
          }}
          onReRequest={() => {
            showToast("요청유형 선택으로 이동해요");
            openReqType();
          }}
          onBack={goMain}
        />
      )}

      {screen === "plandtl" && (
        <PlanDtlScreen
          reco={recoPlans.find((r) => r.id === selId) ?? recoPlans[0]}
          onBack={() => setScreen("plancmp")}
          onOpenProfile={() => {
            setReturnTo("plandtl");
            setScreen("copro");
          }}
          onOpenProdDtl={() => {
            setActiveProdInfo(null); // EXPERT는 상품 상세 데이터가 없어 ProdDtlScreen의 기존 목업 표시로 되돌림
            setProdReturn("plandtl");
            setScreen("proddtl");
          }}
          onPick={async () => {
            if (!activeBidRequest) return;
            try {
              const updated = await selectBidPlan(activeBidRequest.id, selId);
              setActiveBidRequest(updated);
              setMyRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
              setScreen("pay");
            } catch (err) {
              showToast(err instanceof Error ? err.message : "추천안 선택에 실패했어요", "danger");
            }
          }}
        />
      )}

      {screen === "pay" && (
        <CoPlanPickPayScreen
          selId={selId}
          isExpert={isExpert}
          bidders={bidOffers}
          recos={recoPlans}
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
        <PayDoneScreen
          selId={selId}
          isExpert={isExpert}
          bidders={bidOffers}
          recos={recoPlans}
          payMethod={payMethod}
          couponSel={couponSel}
          pointUse={pointUse}
          onConfirm={goMain}
        />
      )}

      {screen === "handover" && (
        <CstDoneHandoverScreen
          selName={handoverShopName}
          handover={handoverStatus}
          photos={handoverPhotoUrls}
          review={review}
          loading={loadingHandover}
          confirming={confirmingHandover}
          onBack={goMain}
          onConfirmHandover={async () => {
            if (activeReservationId === null) return;
            if (handoverStatus !== "done") {
              setConfirmingHandover(true);
              try {
                await confirmHandover(activeReservationId);
                setHandoverDetail(await getHandoverDetail(activeReservationId));
                showToast("인수가 확인되었어요. 감사합니다!", "success");
              } catch (err) {
                showToast(err instanceof Error ? err.message : "인수확인에 실패했어요", "danger");
              } finally {
                setConfirmingHandover(false);
              }
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

      {screen === "proddtl" && <ProdDtlScreen info={activeProdInfo} onBack={() => setScreen(prodReturn || "biddtl")} />}

      {screen === "bookingdtl" && (
        <BookingDtlScreen
          onBack={goMain}
          shopName={selName}
          shopMeta={isExpert ? "전문가 추천 · 선정 업체" : "일반 입찰 · 선정 업체"}
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
          onConfirm={async () => {
            if (!activeReservation || !reschedDay || !reschedTime) return;
            const dateKey = `${reschedCalY}-${String(reschedCalM).padStart(2, "0")}-${String(reschedDay).padStart(2, "0")}`;
            setReschedSubmitting(true);
            try {
              const updated = await rescheduleReservation(activeReservation.id, dateKey, reschedTime);
              setActiveReservation(updated);
              setReschedDay(null);
              setReschedTime("");
              setScreen("bookingdtl");
              showToast("일정이 변경됐어요", "success");
            } catch (err) {
              showToast(err instanceof Error ? err.message : "일정 변경에 실패했어요", "danger");
            } finally {
              setReschedSubmitting(false);
            }
          }}
          submitting={reschedSubmitting}
          shopName={selName}
          currentVisitLabel={bookingBaseVisitLabel}
          year={reschedCalY}
          month={reschedCalM}
          day={reschedDay}
          time={reschedTime}
          holidays={reschedHolidays}
          daySlots={reschedDaySlots}
          scheduleLoading={reschedScheduleLoading}
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
          onConfirm={async () => {
            if (!activeReservation || !cancelReason) return;
            setCancelSubmitting(true);
            try {
              const updated = await cancelReservation(activeReservation.id, cancelReason, cancelReason === "ETC" ? cancelEtc : undefined);
              setActiveReservation(updated);
              setScreen("bookingdtl");
              showToast("예약이 취소됐어요", "danger");
            } catch (err) {
              showToast(err instanceof Error ? err.message : "예약 취소에 실패했어요", "danger");
            } finally {
              setCancelSubmitting(false);
            }
          }}
          submitting={cancelSubmitting}
          shopName={selName}
          itemSummaryLabel={bookingItemLabel}
          visitDateLabel={bookingVisitLabel}
          priceLabel={`${nfmt(selTotal)}원`}
          reason={cancelReason}
          etcText={cancelEtc}
          refundAmount={refundAmount}
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
          selName={handoverShopName}
          reviewStar={reviewStar}
          reviewText={reviewText}
          photos={reviewPhotos}
          onSelectStar={setReviewStar}
          onTextChange={setReviewText}
          onAddPhoto={(dataUri) => setReviewPhotos((prev) => [...prev, dataUri])}
          onRemovePhoto={(index) => setReviewPhotos((prev) => prev.filter((_, i) => i !== index))}
          onError={showToast}
          onClose={() => setSheet(null)}
          onSubmit={async () => {
            if (reviewStar === 0 || submittingReview || activeReservationId === null) return;
            setSubmittingReview(true);
            try {
              const created = await createReview(activeReservationId, {
                rating: reviewStar,
                content: reviewText,
                photos: reviewPhotos,
              });
              setReview(created);
              showToast("소중한 후기가 등록됐어요", "success");
              setSheet(null);
            } catch (err) {
              showToast(err instanceof Error ? err.message : "후기 등록에 실패했어요", "danger");
            } finally {
              setSubmittingReview(false);
            }
          }}
        />
      )}

      {cancelTarget && (
        <BidCancelConfirmScreen
          cancelling={cancelling}
          reason={bidCancelReason}
          etcText={bidCancelEtcText}
          onSelectReason={setBidCancelReason}
          onEtcChange={setBidCancelEtcText}
          onCancel={() => setCancelTarget(null)}
          onConfirm={confirmCancelRequest}
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
