// 고객앱 "예약시공" 20개 화면(CU-RSVC-01~20)을 엮는 상태 컨테이너 (NcpkFlow.tsx와 동일한 패턴)
import { useEffect, useRef, useState } from "react";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../components/ui/useToast";
import { pushBackAction } from "../../native/backHandler";

import BookingScreen, { displayStatus, type ReqStatusFilter } from "./BookingScreen";
import BidCancelConfirmScreen from "./BidCancelConfirmScreen";
import ReqTypeSelScreen from "./ReqTypeSelScreen";
import CstItemSelGenScreen from "./CstItemSelGenScreen";
import CstProdSelScreen from "./cstitems/CstProdSelScreen";
import ProdSearchSelScreen from "./cstitems/cstprods/ProdSearchSelScreen";
import CatBudgetInputExpertScreen, { type CatDef } from "./CatBudgetInputExpertScreen";
import SchedRadiusCondInputScreen, { RATING_LABEL_TO_VALUE } from "./SchedRadiusCondInputScreen";
import BidRcmdReqRegDoneScreen from "./BidRcmdReqRegDoneScreen";
import ReqRegConfirmScreen from "./ReqRegConfirmScreen";
import BidCoCmpGenScreen from "./BidCoCmpGenScreen";
import BidContDtlScreen from "./bidcocmp/BidContDtlScreen";
import RsvMyReqDtlScreen from "./RsvMyReqDtlScreen";
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
import ReschedRejectSheet from "../common/ReschedRejectSheet";

import {
  ITEM_KEYS,
  COUPON_DEFS,
  INST_CODE_BY_ITEM_KEY,
  PROD_CAT_BY_ITEM_KEY,
  PROD_CAT_BY_INST_CODE,
  TINT_POSITION_TO_CODE,
  INST_CODE_LABELS,
  type RsvScreen,
  type RsvSheet,
  type RsvFlowKind,
  type ItemDef,
  type ItemKey,
  type ProdItemKey,
  type PayMethodKey,
  type Bidder,
  type RecoPlan,
} from "./rsvTypes";
import { selectedEntry, computePayBreakdown } from "./rsvCalc";
import { nfmt, formatDateOnlyLabel } from "./rsvFormat";
import {
  TINT_POSITIONS,
  TINT_POSITION_LABELS,
  type TintLevel,
  type HandoverStatus,
  type PackageSelectionItemView,
} from "../common/commonTypes";
import {
  createBidRequest,
  listMyBidRequests,
  cancelBidRequest,
  cancelBidSelection,
  type BidRequestApi,
  type BidRequestCarApi,
  type CreateBidRequestInput,
} from "../../api/bidRequests";
import { getBidOffers, selectBidOffer, type BidOfferApi } from "../../api/bidOffers";
import { getBidPlans, selectBidPlan, type BidPlanApi } from "../../api/bidPlans";
import { getCommonCodeDetails, type CommonCodeDetailApi } from "../../api/commonCodes";
import { getMyPointsSummary } from "../../api/points";
import {
  listMyReservations,
  getHandoverDetail,
  confirmHandover,
  getReview,
  createReview,
  rescheduleReservation,
  cancelReservation,
  confirmReservationPayment,
  acceptReservationResched,
  rejectReservationResched,
  type ReservationApi,
  type HandoverDetail,
  type ReviewApi,
} from "../../api/reservations";
import { listShops, listShopReviews, type ShopListItemApi, type ShopReviewApi } from "../../api/shops";
import { listShopHolidays, getDailySchedule, type DailyScheduleApi } from "../../api/shopSchedule";
import { listBidProducts, type ProductApi } from "../../api/products";
import { API_BASE_URL } from "../../api/config";

// 기본 선택 없음 — 사용자가 직접 골라야 함(2026-08-14 사용자 확정)
const INITIAL_ITEMS: Record<ItemKey, boolean> = { tint: false, blackbox: false, glass: false, under: false, ppf: false, detail: false };
// 제품명은 이제 실제 카탈로그 조회 결과로 채워짐(RsvFlow의 제품 목록 fetch 참고) — 로딩 전까지는 빈 값
const INITIAL_PROD: Record<ProdItemKey, string> = { blackbox: "", glass: "", under: "", ppf: "", detail: "" };
const INITIAL_POS_LEVELS: Record<string, TintLevel> = Object.fromEntries(TINT_POSITIONS.map((p) => [p, "15"]));

// reqProgress 맵에 저장할 값 — 결제 전(PENDING_PAYMENT)이면 그 자체를, 아니면 시공 진행상태(progressStatus)를 사용.
// displayStatus(BookingScreen.tsx)가 이 값으로 "결제대기"와 "선정완료(결제완료)"를 구분해 배지·라우팅을 나눈다
function effectiveReservationStatus(reservation: { status: string; progressStatus: string }): string {
  return reservation.status === "PENDING_PAYMENT" ? "PENDING_PAYMENT" : reservation.progressStatus;
}

interface RsvFlowProps {
  onExit: () => void;
  onOpenShop: () => void;
  onOpenMyPage: () => void;
  initialScreen?: RsvScreen;
  initialFilter?: ReqStatusFilter;
  // 푸시 알림 탭 등 외부 진입점에서 특정 요청을 바로 열 때만 값이 설정됨(App.tsx 참고)
  targetRequestNo?: string;
}

export default function RsvFlow({
  onExit,
  onOpenShop,
  onOpenMyPage,
  initialScreen = "main",
  initialFilter = "ALL",
  targetRequestNo,
}: RsvFlowProps) {
  const [screen, setScreen] = useState<RsvScreen>(initialScreen);
  const targetRequestConsumedRef = useRef(false);
  const [sheet, setSheet] = useState<RsvSheet>(null);
  const [flow, setFlow] = useState<RsvFlowKind>("gen");

  const [items, setItems] = useState<Record<ItemKey, boolean>>(INITIAL_ITEMS);
  const [prodTint, setProdTint] = useState("");
  const [prod, setProd] = useState<Record<ProdItemKey, string>>(INITIAL_PROD);
  // CU-RSVC-04→05 — 어떤 항목의 제품 검색 팝업이 열려있는지(모든 항목이 동일한 검색 팝업을 공유, null이면 닫힘)
  const [searchKey, setSearchKey] = useState<ItemKey | null>(null);
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("all");
  // CU-RSVC-04/05 제품 선택·검색 — 실제 카탈로그(Product, bidApplicable=true)에서 조회. admin 수정사항이 바로
  // 반영돼야 해서 캐시하지 않고 prodsel 화면 진입마다 재조회함(loadingProducts가 이 재조회 상태를 나타냄)
  const [tintProducts, setTintProducts] = useState<ProductApi[]>([]);
  const [otherProducts, setOtherProducts] = useState<Partial<Record<ProdItemKey, ProductApi[]>>>({});
  const [prodBrandCodes, setProdBrandCodes] = useState<CommonCodeDetailApi[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [posLevels, setPosLevels] = useState<Record<string, TintLevel>>(INITIAL_POS_LEVELS);
  const [posBulk, setPosBulk] = useState(false); // 기본값: 전체 일괄 적용 꺼짐(NcpkFlow.tsx의 tintBulk와 동일 컨벤션, 2026-08-14 사용자 확인)
  const [posOff, setPosOff] = useState<Record<string, boolean>>({});

  // 기본 선택 없음 — 사용자가 직접 골라야 함(일반입찰 시공항목과 동일 컨벤션, 2026-08-14 사용자 확정)
  const [catCats, setCatCats] = useState<Record<string, boolean>>({});
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
  // 입찰/추천 카드·상세·프로필(CU-RSVC-10~13/18)에서 실제 업체 사진·주소·위경도·평점을 보여주기 위한 원본 목록
  const [shopsApi, setShopsApi] = useState<ShopListItemApi[]>([]);
  // CU-RSVC-18 업체 프로필의 후기 목록 — 프로필 화면 진입 시(shopCode 확정 시점)마다 조회
  const [shopReviews, setShopReviews] = useState<ShopReviewApi[]>([]);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  // CU-RSVC-08→09 요청 등록 전 확인 시트 — 시공 항목을 상세히 보여주고 명시적으로 확인해야 저장됨(2026-08-14 사용자 확인)
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<BidRequestApi | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [bidCancelReason, setBidCancelReason] = useState<string | null>(null);
  const [bidCancelEtcText, setBidCancelEtcText] = useState("");
  // 요청 카드·등록완료 화면에 차종(브랜드+모델)을 라벨로 보여주기 위한 코드값 조회
  const [carBrandCodes, setCarBrandCodes] = useState<CommonCodeDetailApi[]>([]);
  const [carModelCodes, setCarModelCodes] = useState<CommonCodeDetailApi[]>([]);
  // CU-RSVC-03 시공항목 선택 — admin-app 기준정보 > 시공항목 관리(AD-CTLG-03)에 등록·활성화된 CAR_INST만 노출
  const [carInstCodes, setCarInstCodes] = useState<CommonCodeDetailApi[]>([]);
  const [loadingCarInst, setLoadingCarInst] = useState(true);
  const [lastCreatedRequest, setLastCreatedRequest] = useState<BidRequestApi | null>(null);

  const [selId, setSelId] = useState("b1");
  // CU-RSVC-10/11/12/13 입찰 업체 비교·상세(GENERAL), 추천안 비교·상세(EXPERT) 모두 실 API 연동
  const [bidOffers, setBidOffers] = useState<Bidder[]>([]);
  const [recoPlans, setRecoPlans] = useState<RecoPlan[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  // 비교·상세 화면이 참조하는 원본 요청 — status/selectedOfferNo로 이미 선정완료된 요청인지 판단해 "선택" 버튼을 비활성화
  const [activeBidRequest, setActiveBidRequest] = useState<BidRequestApi | null>(null);
  // 내 요청 상세(RsvMyReqDtlScreen)에서 요청 시점 제품명의 참고 판매가를 보여주기 위한 실 카탈로그 조회 결과(제품명 -> 가격)
  const [myReqDtlPrices, setMyReqDtlPrices] = useState<Record<string, number>>({});
  const [loadingMyReqDtl, setLoadingMyReqDtl] = useState(false);
  // 입찰 내용 상세에서 "제품 상세"로 들어갈 때 보여줄 정보(고객이 요청한 제품명·부위별 농도) — GENERAL만 값 설정, EXPERT는 null 유지(기존 목업)
  const [activeProdInfo, setActiveProdInfo] = useState<ProdDtlInfo | null>(null);
  const [returnTo, setReturnTo] = useState<RsvScreen>("bidcmp");
  const [prodReturn, setProdReturn] = useState<RsvScreen>("biddtl");
  const [payMethod, setPayMethod] = useState<PayMethodKey>("card");

  const [pointUse, setPointUse] = useState(0);
  const [memberPointBalance, setMemberPointBalance] = useState(0);
  const [couponSel, setCouponSel] = useState<string | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  // CU-RSVC-21 업체 일정변경 요청 수락/거절
  const [respondingReschedRequest, setRespondingReschedRequest] = useState(false);
  const [rejectReschedReasonDraft, setRejectReschedReasonDraft] = useState("");

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

  // CU-RSVC-01 목록 새로고침 — 마운트 시 + 당겨서 새로고침(PullToRefresh)에서 공용으로 사용.
  // 나머지(공통코드·상품카탈로그 등)는 자주 안 바뀌는 참조 데이터라 새로고침 대상에서 제외
  const refreshRequests = async () => {
    await Promise.all([
      listMyBidRequests()
        .then(setMyRequests)
        .catch((err) => showToast(err instanceof Error ? err.message : "요청 목록을 불러오지 못했어요", "danger"))
        .finally(() => setLoadingRequests(false)),
      listMyReservations()
        .then((reservations) => {
          const progress: Record<string, string> = {};
          const byRequest: Record<string, ReservationApi> = {};
          for (const r of reservations) {
            if (r.reservationType === "BID" && r.requestNo) {
              progress[r.requestNo] = effectiveReservationStatus(r);
              byRequest[r.requestNo] = r;
            }
          }
          setReqProgress(progress);
          setReqReservation(byRequest);
        })
        .catch(() => {}), // 실패해도 선정완료로 폴백 표시되므로 별도 에러 토스트 불필요
    ]);
  };

  useEffect(() => {
    refreshRequests();
    listShops()
      .then((shops) => {
        setShopNameByCode(Object.fromEntries(shops.map((s) => [s.shopCode, s.name])));
        setShopsApi(shops);
      })
      .catch(() => {});
    getCommonCodeDetails("CAR_BRAND").then(setCarBrandCodes).catch(() => {});
    getCommonCodeDetails("CAR_MODEL").then(setCarModelCodes).catch(() => {});
    getCommonCodeDetails("CAR_INST")
      .then(setCarInstCodes)
      .catch(() => {})
      .finally(() => setLoadingCarInst(false));
    // 썬팅 제품·브랜드 코드는 요청 등록(제품 선택·검색)뿐 아니라 입찰 내용 상세(제품 상세)에서도 필요해 마운트 시
    // 우선 한 번 조회해둠(prodsel 화면에 들어가면 최신 값으로 다시 조회됨 — 아래 CU-RSVC-04 effect 참고)
    getCommonCodeDetails("PROD_BRAND").then(setProdBrandCodes).catch(() => {});
    listBidProducts("TINT").then(setTintProducts).catch(() => {});
    getMyPointsSummary()
      .then((s) => setMemberPointBalance(s.balance))
      .catch(() => {}); // 결제 화면 진입 전까지는 몰라도 되는 보조 데이터라 실패해도 토스트 없이 0으로 유지
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

  // 상품 브랜드 코드 -> 한글 라벨 — 제품 검색·상세(CU-RSVC-05/11)에서 실제 카탈로그의 brand(코드값)를 표시용으로 변환
  const prodBrandLabel = (code: string): string => prodBrandCodes.find((d) => d.detailCode === code)?.detailName ?? code;

  // 시공항목 선택(CU-RSVC-03)에 노출할 항목 — admin-app 시공항목 관리(AD-CTLG-03)에 등록한 CAR_INST만, 그
  // detailName/ref1을 그대로 항목명/설명으로 사용(하드코딩 문구 없음). GET /common-codes/:code가 서버에서
  // 이미 useYn=true만 반환하므로(공개용 조회 공통) 여기서 별도 필터 불필요
  const activeInstCodes = new Set(carInstCodes.map((c) => c.detailCode));
  const visibleItemDefs: ItemDef[] = ITEM_KEYS.flatMap((key) => {
    const detail = carInstCodes.find((c) => c.detailCode === INST_CODE_BY_ITEM_KEY[key]);
    return detail ? [{ key, name: detail.detailName, desc: detail.ref1 ?? "" }] : [];
  });

  // 전문가추천 "관심 카테고리"(CU-RSVC-07)도 동일하게 등록된 CAR_INST 전체를 그대로 사용 — 일반입찰(ItemKey)과
  // 달리 6개로 제한된 고정 하위집합이 없어 carInstCodes를 그대로 매핑. code(=instCode)를 catCats의 키로 써서
  // 이름 변경에 안전하게 하고, 라벨은 detailName을 그대로 사용
  const visibleCatDefs: CatDef[] = carInstCodes.map((c) => ({ code: c.detailCode, name: c.detailName }));
  const catLabel = (code: string): string => carInstCodes.find((c) => c.detailCode === code)?.detailName ?? code;

  // CU-RSVC-05 제품 검색 팝업 — 모든 항목이 공유(searchKey로 어떤 항목인지 구분). 기본 선택 없음(사용자 확정) —
  // 검색 결과에서 직접 고르기 전까지 선택값은 비어 있는 채로 둔다
  const searchProducts = searchKey === "tint" ? tintProducts : searchKey ? (otherProducts[searchKey as ProdItemKey] ?? []) : [];
  const searchSelectedName = searchKey === "tint" ? prodTint : searchKey ? prod[searchKey as ProdItemKey] : "";
  const searchLoading = loadingProducts;
  const searchTitle = visibleItemDefs.find((it) => it.key === searchKey)?.name ?? "";
  const searchBrandDefs: Array<[string, string]> = [
    ["all", "전체"],
    ...prodBrandCodes
      .filter((c) => searchProducts.some((p) => p.brand === c.detailCode))
      .map((c): [string, string] => [c.detailCode, c.detailName]),
  ];
  const openProductSearch = (key: ItemKey) => {
    setSearchKey(key);
    setSearch("");
    setBrand("all");
    setScreen("prodsearch");
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
  const { isRec, bidder: selBidder, reco: selReco, name: selName, total: selTotal } = selectedEntry(selId, isExpert, bidOffers, recoPlans);
  // 프로필(CoDtlProfScreen)·카드 사진 등에 쓸 선택(또는 조회중) 업체의 실 카탈로그 정보 — 거리는 고객 좌표를 안 받아 항상 미제공
  const selShopCode = isRec ? selReco?.shopCode : selBidder?.shopCode;
  const selShopApi = shopsApi.find((s) => s.shopCode === selShopCode);
  const selRating = selShopApi?.avgRating != null ? selShopApi.avgRating.toFixed(1) : "";
  const selDist = "";
  const selPhotoUrl = selShopApi?.mainPhoto ? `${API_BASE_URL}/uploads/${selShopApi.mainPhoto.photoPath}` : null;
  const selAddress = selShopApi ? [selShopApi.address, selShopApi.addressDetail].filter(Boolean).join(" · ") : "";
  const selCategories = selShopApi?.categories.map((code) => catLabel(code));
  const selReviewViews = shopReviews.map((r) => ({ name: r.reviewerName, stars: "★".repeat(r.rating), text: r.content }));
  // 업체 카드(견적서 도착 목록)에서 응찰·추천 업체별 사진을 찾기 위한 조회용 맵
  const photoUrlByShopCode: Record<string, string | null> = Object.fromEntries(
    shopsApi.map((s) => [s.shopCode, s.mainPhoto ? `${API_BASE_URL}/uploads/${s.mainPhoto.photoPath}` : null]),
  );

  // CU-RSVC-18 업체 프로필 진입 시(선택된 업체의 shopCode가 확정된 시점) 후기 목록을 새로 조회
  useEffect(() => {
    if (screen !== "copro" || !selShopCode) {
      setShopReviews([]);
      return;
    }
    listShopReviews(selShopCode).then(setShopReviews).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, selShopCode]);

  // 업체 프로필의 "시공 가능 카테고리"는 carInstCodes(admin 시공항목 관리)로 라벨을 붙이는데, 이 목록도
  // 마운트 시 한 번만 조회해두던 상태라 admin이 그 사이 항목을 추가/활성화해도 반영이 안 됐음 — 프로필
  // 진입마다 새로 조회(2026-08-14 버그 리포트로 추가, tintProducts 재조회 정책과 동일)
  useEffect(() => {
    if (screen !== "copro") return;
    getCommonCodeDetails("CAR_INST").then(setCarInstCodes).catch(() => {});
  }, [screen]);

  const handoverStatus: HandoverStatus = handoverDetail?.handoverStatus === "confirmed" ? "done" : "pending";
  const handoverPhotoUrls = (handoverDetail?.photos ?? []).map((p) => `${API_BASE_URL}/uploads/${p}`);

  // CU-RSVC-20 예약 상세 — 선정완료(SELECTED)~시공중(IN_PROGRESS) 요청을 열 때의 실제 낙찰·예약 데이터
  const bookingItemLabel = activeBidRequest
    ? activeBidRequest.items.map((it) => INST_CODE_LABELS[it.instCode] ?? it.instCode).join(" · ") || "-"
    : "-";
  // CU-RSVC-20 시공 항목 카드 — 낙찰된 업체(bidder)/추천안(reco)의 실제 항목·가격, 썬팅은 요청 시점 부위별 농도 표기
  const bookingTintDetail =
    activeBidRequest && activeBidRequest.positions.length > 0
      ? activeBidRequest.positions.map((p) => `${TINT_POSITION_LABELS[p.position] ?? p.position} ${p.level}%`).join(" · ")
      : undefined;
  const bookingItems: PackageSelectionItemView[] = isRec
    ? (selReco?.plans ?? []).map(([name, , offerPrice, instCode]) => ({
        product: name,
        price: offerPrice,
        tintDetail: instCode === "TINT" ? bookingTintDetail : undefined,
      }))
    : (selBidder?.items ?? []).map(([name, price, instCode]) => ({
        product: name,
        price,
        tintDetail: instCode === "TINT" ? bookingTintDetail : undefined,
      }));
  const bookingBaseVisitLabel = activeReservation ? `${activeReservation.date.replaceAll("-", ".")} ${activeReservation.time}` : "";
  const bookingVisitLabel = reschedDay
    ? `${reschedCalY}.${String(reschedCalM).padStart(2, "0")}.${String(reschedDay).padStart(2, "0")} ${reschedTime}`
    : bookingBaseVisitLabel;
  const bookingRows: Array<[string, string]> = [["예약 일시", bookingVisitLabel]];
  // 결제 확정된 예약이면(paidAt 존재) 실제 결제 내역을 함께 표시 — 쿠폰/포인트는 적용했을 때만 행을 추가
  if (activeReservation?.paidAt) {
    if (activeReservation.couponName) {
      const discountLabel = activeReservation.couponDiscount ? ` (-${nfmt(activeReservation.couponDiscount)}원)` : "";
      bookingRows.push(["적용 쿠폰", `${activeReservation.couponName}${discountLabel}`]);
    }
    if (activeReservation.pointsUsed) {
      bookingRows.push(["포인트 사용", `-${nfmt(activeReservation.pointsUsed)}원`]);
    }
    bookingRows.push(["결제 수단", activeReservation.paymentMethod === "BANK" ? "무통장 입금" : "카드결제"]);
    bookingRows.push(["결제 금액", `${nfmt(activeReservation.paidAmount ?? 0)}원`]);
  }
  // 업체가 보낸 일정변경 요청(응답 대기중인 것만 배너로 노출 — 이미 거절한 요청은 다시 뜨지 않음)
  const reschedRequestView =
    activeReservation?.reschedStatus === "REQUESTED" && activeReservation.reschedDate && activeReservation.reschedTime
      ? {
          dateLabel: `${formatDateOnlyLabel(activeReservation.reschedDate)} ${activeReservation.reschedTime}`,
          reason: activeReservation.reschedReason ?? "",
        }
      : null;
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
      case "myreqdtl":
        return pushBackAction(() => setScreen(activeBidRequest?.reqType === "EXPERT" ? "plancmp" : "bidcmp"));
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
  }, [screen, sheet, isExpert, isRec, returnTo, prodReturn, activeBidRequest]);

  // CAR_INST 조회가 끝난 뒤 비활성화된 항목이 있으면 기본 선택값(INITIAL_ITEMS)에서 켜둔 값을 꺼서
  // 화면에 보이지 않는 항목이 요청에 몰래 포함되는 일이 없게 함
  useEffect(() => {
    if (loadingCarInst) return;
    setItems((cur) => {
      const next = { ...cur };
      let changed = false;
      (Object.keys(next) as ItemKey[]).forEach((key) => {
        if (next[key] && !activeInstCodes.has(INST_CODE_BY_ITEM_KEY[key])) {
          next[key] = false;
          changed = true;
        }
      });
      return changed ? next : cur;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingCarInst, carInstCodes]);

  // CU-RSVC-04 제품 선택 화면 진입 시 선택된 항목들의 실제 카탈로그(bidApplicable=true)를 매번 새로 조회 —
  // admin이 상품 정보를 수정하면 이 화면을 다시 열 때 바로 반영돼야 해서 캐시하지 않고 진입할 때마다 재조회함
  // (2026-08-14 사용자 확인). 제품 종류가 다양해 임의로 하나를 기본 선택하면 오히려 오해를 줄 수 있어 기본
  // 선택은 하지 않음 — 등록된 제품이 없는 분류는 빈 값 그대로 둠
  useEffect(() => {
    if (screen !== "prodsel") return;
    const nonTintKeys = (Object.keys(items) as ItemKey[]).filter((k) => items[k] && k !== "tint") as ProdItemKey[];
    const fetches: Promise<unknown>[] = [
      ...(items.tint ? [listBidProducts("TINT").then(setTintProducts)] : []),
      ...nonTintKeys.map((key) =>
        listBidProducts(PROD_CAT_BY_ITEM_KEY[key]).then((rows) => {
          setOtherProducts((prev) => ({ ...prev, [key]: rows }));
        }),
      ),
    ];
    if (fetches.length === 0) return;
    setLoadingProducts(true);
    Promise.all(fetches)
      .catch((err) => showToast(err instanceof Error ? err.message : "제품 목록을 불러오지 못했어요", "danger"))
      .finally(() => setLoadingProducts(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // 입찰 내용 상세(biddtl)에 진입할 때마다 썬팅 카탈로그를 새로 조회 — "제품 상세" 팝업이 이 화면에 이미 불러온
  // tintProducts로 빌드되므로(buildProdDtlInfo), 마운트 시 한 번만 조회해두면 admin이 그 사이 상품 정보를
  // 수정해도 반영이 안 됨(2026-08-14 버그 리포트로 추가, prodsel 화면의 재조회 정책과 동일)
  useEffect(() => {
    if (screen !== "biddtl") return;
    listBidProducts("TINT").then(setTintProducts).catch(() => {});
  }, [screen]);

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
            .filter((code) => catCats[code])
            .map((code) => ({ instCode: code }))
        : (Object.keys(items) as ItemKey[])
            .filter((key) => items[key])
            .map((key) => ({
              instCode: INST_CODE_BY_ITEM_KEY[key],
              productName: (key === "tint" ? prodTint : prod[key as ProdItemKey]) || undefined,
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
      setShowRegConfirm(false);
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
  // 업체가 희망일에 슬롯이 없어 다른 날짜로 응찰했을 수 있어(scheduledDate) 요청의 희망일이 아니라 업체가 실제 잡은 날짜로 표시
  const mapOffer = (o: BidOfferApi): Bidder => ({
    id: o.offerNo,
    shopCode: o.shopCode,
    name: o.shopName,
    when: formatWhenLabel(o.scheduledDate, o.scheduledTime),
    date: o.scheduledDate,
    memo: o.memo,
    items: o.items.map((it): [string, number, string] => [INST_CODE_LABELS[it.instCode] ?? it.instCode, it.price, it.instCode]),
  });

  // GET /bid-requests/:id/plans 응답을 화면 표시용 RecoPlan으로 변환(마찬가지로 업체가 실제 잡은 날짜로 표시)
  const mapPlan = (p: BidPlanApi): RecoPlan => {
    const names = p.items.map((it) => INST_CODE_LABELS[it.instCode] ?? it.instCode);
    return {
      id: p.planNo,
      shopCode: p.shopCode,
      name: p.shopName,
      itemSummary: names.length > 1 ? `${names[0]} 외 ${names.length - 1}건` : (names[0] ?? "-"),
      reason: p.reason,
      when: formatWhenLabel(p.scheduledDate, p.scheduledTime),
      date: p.scheduledDate,
      plans: p.items.map((it): [string, number, number, string] => [it.productName, it.retailPrice, it.offerPrice, it.instCode]),
    };
  };

  // CU-RSVC-14/15 업체·추천안 선택(selectOffer/selectPlan) 직후 — 서버는 그 자리에서 실제 Reservation을 생성하지만
  // 응답(BidRequestView)에는 reservationNo가 담겨 있지 않아, 마운트 시 1회만 불러온 reqReservation은 아직 이 건을 모른다.
  // 방금 생성된 예약을 다시 조회해 activeReservation·reqReservation·reqProgress를 모두 최신화 — paydone 화면의 실제 예약번호 표시,
  // 이후 "내 요청" 목록에서 바로 이 요청을 다시 열었을 때도 새로고침 없이 정확한 상태가 보이도록 함
  const loadReservationForRequest = async (requestNo: string) => {
    setActiveReservation(null); // 실패 시 이전(다른 요청의) 예약이 잘못 남아 보이지 않도록 먼저 비움
    try {
      const reservations = await listMyReservations();
      const reservation = reservations.find((r) => r.reservationType === "BID" && r.requestNo === requestNo);
      if (!reservation) return;
      setActiveReservation(reservation);
      setReqReservation((prev) => ({ ...prev, [requestNo]: reservation }));
      setReqProgress((prev) => ({ ...prev, [requestNo]: effectiveReservationStatus(reservation) }));
    } catch {
      // 예약번호 표시만 영향받고 결제완료 자체는 이미 끝난 뒤라 별도 에러 토스트 없이 조용히 실패
    }
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

    // 결제대기(선정만 하고 결제 전 이탈)도 선정완료·시공중과 마찬가지로 activeReservation·selId를 채워야
    // 결제 화면(pay)이 정상 렌더링됨 — 없으면 "선정만 했는데 확정 알림이 가고 결제 화면엔 다시 못 들어가는" 버그였음
    const needsPayment = status === "PENDING_PAYMENT";
    const isSelected = needsPayment || status === "SELECTED" || status === "IN_PROGRESS";
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
        .then((plans) => setRecoPlans(plans.map(mapPlan)))
        .catch((err) => showToast(err instanceof Error ? err.message : "추천안 목록을 불러오지 못했어요", "danger"))
        .finally(() => setLoadingOffers(false));
    } else {
      getBidOffers(request.id)
        .then((offers) => setBidOffers(offers.map(mapOffer)))
        .catch((err) => showToast(err instanceof Error ? err.message : "입찰 목록을 불러오지 못했어요", "danger"))
        .finally(() => setLoadingOffers(false));
    }
    setScreen(needsPayment ? "pay" : isSelected ? "bookingdtl" : request.reqType === "EXPERT" ? "plancmp" : "bidcmp");
  };

  // 푸시 알림 탭 등 외부 진입점(App.tsx의 targetRequestNo) — 내 요청 목록이 로드되면 해당 요청을 찾아
  // openMyRequest와 동일한 로직(상태별 화면 분기)으로 바로 연다. 한 번만 동작하도록 targetRequestId 소비 여부를 ref로 추적
  useEffect(() => {
    if (!targetRequestNo || loadingRequests || targetRequestConsumedRef.current) return;
    const request = myRequests.find((r) => r.requestNo === targetRequestNo);
    if (!request) return;
    targetRequestConsumedRef.current = true;
    openMyRequest(request);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myRequests, loadingRequests, targetRequestNo]);

  // 내 요청 상세 진입 — 입찰/추천 도착 여부와 무관하게 언제든 볼 수 있어야 해서 비교 화면(bidcmp/plancmp)에서 별도로 연다.
  // 요청 시점에 고른 제품명이 있으면(일반입찰만) 그 카테고리의 실 카탈로그를 조회해 참고 판매가를 채워둔다
  const openMyReqDtl = () => {
    if (!activeBidRequest) return;
    setScreen("myreqdtl");
    const namedItems = activeBidRequest.items.filter((it) => it.productName);
    if (namedItems.length === 0) {
      setMyReqDtlPrices({});
      return;
    }
    const prodCats = [...new Set(namedItems.map((it) => PROD_CAT_BY_INST_CODE[it.instCode]).filter((c): c is string => !!c))];
    setLoadingMyReqDtl(true);
    Promise.all(prodCats.map((cat) => listBidProducts(cat)))
      .then((lists) => {
        const map: Record<string, number> = {};
        lists.flat().forEach((p) => (map[p.name] = p.price));
        setMyReqDtlPrices(map);
      })
      .catch(() => {}) // 참고용 가격 표시라 실패해도 화면 진입을 막지 않고 조용히 무시
      .finally(() => setLoadingMyReqDtl(false));
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

  // CU-RSVC-08→09 요청 등록 확인 시트에 표시할 시공 항목 상세 — 신차패키지 예약확정 요약(RsvCfmScreen.tsx)과
  // 동일하게 항목별로 풀어서 보여줌(일반입찰은 선택 제품·썬팅 부위농도까지, 전문가추천은 관심 카테고리만)
  const cfmItems = isExpert
    ? Object.keys(catCats)
        .filter((code) => catCats[code])
        .map((code) => ({ name: catLabel(code), product: null as string | null, tintDetail: undefined as string | undefined }))
    : visibleItemDefs
        .filter((it) => items[it.key])
        .map((it) => {
          const product = (it.key === "tint" ? prodTint : prod[it.key as ProdItemKey]) || null;
          // TINT_POSITIONS는 이미 한글 부위명("전면유리" 등)이라 TINT_POSITION_LABELS(코드->한글) 변환이 필요 없음
          const tintDetail =
            it.key === "tint"
              ? TINT_POSITIONS.filter((p) => !posOff[p])
                  .map((p) => `${p} ${posLevels[p]}%`)
                  .join(" · ")
              : undefined;
          return { name: it.name, product, tintDetail };
        });

  const cfmRows = [
    { k: "요청 유형", v: isExpert ? "전문가 추천" : "일반 입찰" },
    ...(isExpert ? [{ k: "희망 예산", v: `${nfmt(budget)}원` }] : []),
    { k: "검색 반경", v: `${condRadius}km · 평점 ${condRating}` },
    { k: "희망 일자", v: condDateLabel || "미선택" },
    ...(isExpert && catReq.trim() ? [{ k: "요청사항", v: catReq.trim() }] : []),
  ];

  const regRows = (() => {
    const catNames = Object.keys(catCats).filter((n) => catCats[n]).map(catLabel);
    const genItemNames = visibleItemDefs.filter((it) => items[it.key]).map((it) => it.name);
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
          onRefresh={refreshRequests}
        />
      )}

      {screen === "itemsel" && (
        <CstItemSelGenScreen
          items={items}
          itemDefs={visibleItemDefs}
          loading={loadingCarInst}
          onToggleItem={(key) => setItems((cur) => ({ ...cur, [key]: !cur[key] }))}
          onBack={goMain}
          onNext={() => setScreen("prodsel")}
        />
      )}

      {screen === "prodsel" && (
        <CstProdSelScreen
          items={items}
          itemDefs={visibleItemDefs}
          prodTint={prodTint}
          prod={prod}
          onOpenSearch={openProductSearch}
          onBack={() => setScreen("itemsel")}
          onNext={() => (items.tint ? setSheet("poslvl") : setScreen("condinput"))}
        />
      )}

      {screen === "prodsearch" && (
        <ProdSearchSelScreen
          title={searchTitle}
          search={search}
          brand={brand}
          selectedName={searchSelectedName}
          products={searchProducts}
          brandDefs={searchBrandDefs}
          loading={searchLoading}
          onSearchChange={setSearch}
          onBrandChange={setBrand}
          onSelect={(name) => {
            if (searchKey === "tint") setProdTint(name);
            else if (searchKey) setProd((cur) => ({ ...cur, [searchKey as ProdItemKey]: name }));
            setScreen("prodsel");
            showToast(`${name} 선택됨`, "success");
          }}
          onBack={() => setScreen("prodsel")}
        />
      )}

      {screen === "catbudget" && (
        <CatBudgetInputExpertScreen
          catDefs={visibleCatDefs}
          loading={loadingCarInst}
          catCats={catCats}
          budget={budget}
          catReq={catReq}
          onToggleCat={(code) => setCatCats((cur) => ({ ...cur, [code]: !cur[code] }))}
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
          onNext={() => setShowRegConfirm(true)}
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
          desiredDate={activeBidRequest?.desiredDate ?? ""}
          photoUrlByShopCode={photoUrlByShopCode}
          onSelectBid={(id) => {
            setScreen("biddtl");
            setSelId(id);
          }}
          onReRequest={() => {
            showToast("요청유형 선택으로 이동해요");
            openReqType();
          }}
          onOpenMyReq={openMyReqDtl}
          onBack={goMain}
        />
      )}

      {screen === "myreqdtl" && activeBidRequest && (
        <RsvMyReqDtlScreen
          reqType={activeBidRequest.reqType}
          items={activeBidRequest.items}
          positions={activeBidRequest.positions}
          budget={activeBidRequest.budget}
          radiusKm={activeBidRequest.radiusKm}
          minRating={activeBidRequest.minRating}
          desiredDate={activeBidRequest.desiredDate}
          priceByProductName={myReqDtlPrices}
          loadingPrices={loadingMyReqDtl}
          onBack={() => setScreen(activeBidRequest.reqType === "EXPERT" ? "plancmp" : "bidcmp")}
        />
      )}

      {screen === "biddtl" && (
        <BidContDtlScreen
          selId={selId}
          bidders={bidOffers}
          desiredDate={activeBidRequest?.desiredDate ?? ""}
          photoUrlByShopCode={photoUrlByShopCode}
          requestItems={activeBidRequest?.items ?? []}
          requestPositions={activeBidRequest?.positions ?? []}
          tintProducts={tintProducts}
          brandLabel={prodBrandLabel}
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
              await loadReservationForRequest(updated.requestNo);
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
          desiredDate={activeBidRequest?.desiredDate ?? ""}
          photoUrlByShopCode={photoUrlByShopCode}
          onSelectReco={(id) => {
            setScreen("plandtl");
            setSelId(id);
          }}
          onReRequest={() => {
            showToast("요청유형 선택으로 이동해요");
            openReqType();
          }}
          onOpenMyReq={openMyReqDtl}
          onBack={goMain}
        />
      )}

      {screen === "plandtl" && (
        <PlanDtlScreen
          reco={recoPlans.find((r) => r.id === selId) ?? recoPlans[0]}
          desiredDate={activeBidRequest?.desiredDate ?? ""}
          photoUrlByShopCode={photoUrlByShopCode}
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
              await loadReservationForRequest(updated.requestNo);
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
          memberPointBalance={memberPointBalance}
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
          submitting={submittingPayment}
          onPay={async () => {
            if (!activeReservation || submittingPayment) return;
            setSubmittingPayment(true);
            try {
              const breakdown = computePayBreakdown(selId, isExpert, couponSel, pointUse, memberPointBalance, bidOffers, recoPlans);
              const coupon = COUPON_DEFS.find((d) => d.id === couponSel);
              const updated = await confirmReservationPayment(activeReservation.id, {
                paymentMethod: payMethod === "bank" ? "BANK" : "CARD",
                couponName: coupon?.name,
                couponDiscount: breakdown.couponDiscount || undefined,
                pointsUsed: breakdown.pointsUsed || undefined,
                paidAmount: breakdown.payRemain,
              });
              setActiveReservation(updated);
              setMemberPointBalance((b) => b - breakdown.pointsUsed);
              setScreen("paydone");
            } catch (err) {
              showToast(err instanceof Error ? err.message : "결제 확정에 실패했어요", "danger");
            } finally {
              setSubmittingPayment(false);
            }
          }}
          onCancelSelection={async () => {
            if (!activeBidRequest || submittingPayment) return;
            try {
              const updated = await cancelBidSelection(activeBidRequest.id);
              setMyRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
              setActiveReservation(null);
              showToast("선정을 취소했어요. 다른 업체를 다시 골라주세요", "success");
              openMyRequest(updated);
            } catch (err) {
              showToast(err instanceof Error ? err.message : "선정 취소에 실패했어요", "danger");
            }
          }}
        />
      )}

      {screen === "paydone" && (
        <PayDoneScreen
          selId={selId}
          isExpert={isExpert}
          bidders={bidOffers}
          recos={recoPlans}
          positions={activeBidRequest?.positions ?? []}
          payMethod={payMethod}
          couponSel={couponSel}
          pointUse={pointUse}
          reservationNo={activeReservation?.reservationNo}
          paidAmount={activeReservation?.paidAmount}
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
        <CoDtlProfScreen
          name={selName}
          rating={selRating}
          dist={selDist}
          reviewCount={selShopApi ? nfmt(selShopApi.reviewCount) : undefined}
          categories={selCategories}
          intro={selShopApi?.intro ?? undefined}
          greeting={selShopApi?.greeting ?? undefined}
          address={selAddress || undefined}
          lat={selShopApi?.latitude}
          lng={selShopApi?.longitude}
          reviews={selReviewViews}
          photoUrl={selPhotoUrl}
          onBack={() => setScreen(returnTo || "bidcmp")}
        />
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
          items={bookingItems}
          priceLabel={`${nfmt(selTotal)}원`}
          priceRowLabel="확정 견적"
          timeline={bookingTimeline}
          cancelled={bookingCancelled}
          cancelReasonLabel={cancelReasonLabel}
          cancelRefundLabel={cancelRefundLabel}
          cancellable={bookingCancellable}
          onOpenResched={() => setScreen("resched")}
          onOpenCancel={() => setScreen("cancel")}
          reschedRequest={reschedRequestView}
          respondingReschedRequest={respondingReschedRequest}
          onAcceptReschedRequest={async () => {
            if (!activeReservation || respondingReschedRequest) return;
            setRespondingReschedRequest(true);
            try {
              const updated = await acceptReservationResched(activeReservation.id);
              setActiveReservation(updated);
              showToast("일정 변경을 수락했어요", "success");
            } catch (err) {
              showToast(err instanceof Error ? err.message : "처리에 실패했어요", "danger");
            } finally {
              setRespondingReschedRequest(false);
            }
          }}
          onOpenRejectReschedRequest={() => {
            setRejectReschedReasonDraft("");
            setSheet("reschedReject");
          }}
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

      {sheet === "reschedReject" && (
        <ReschedRejectSheet
          reason={rejectReschedReasonDraft}
          onChangeReason={setRejectReschedReasonDraft}
          submitting={respondingReschedRequest}
          onClose={() => setSheet(null)}
          onConfirm={async () => {
            if (!activeReservation || respondingReschedRequest) return;
            setRespondingReschedRequest(true);
            try {
              const updated = await rejectReservationResched(activeReservation.id, rejectReschedReasonDraft.trim() || undefined);
              setActiveReservation(updated);
              setSheet(null);
              showToast("일정 변경을 거절했어요", "success");
            } catch (err) {
              showToast(err instanceof Error ? err.message : "처리에 실패했어요", "danger");
            } finally {
              setRespondingReschedRequest(false);
            }
          }}
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

      {showRegConfirm && (
        <ReqRegConfirmScreen
          rows={cfmRows}
          items={cfmItems}
          itemsLabel={isExpert ? "관심 카테고리" : "시공 항목"}
          submitting={submittingRequest}
          onCancel={() => setShowRegConfirm(false)}
          onConfirm={submitBidRequest}
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
