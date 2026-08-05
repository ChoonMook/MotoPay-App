// 고객앱 "신차패키지" 10개 화면(CU-NCPK-01~10)을 엮는 상태 컨테이너 (AuthFlow.tsx와 동일한 패턴)
import { useEffect, useState } from "react";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../components/ui/useToast";
import { pushBackAction } from "../../native/backHandler";
import { API_BASE_URL } from "../../api/config";
import { listMyCars, type MyCarApi } from "../../api/cars";
import { getCommonCodeDetails, type CommonCodeDetailApi } from "../../api/commonCodes";
import { getPackageDetail, type PackageDetailApi } from "../../api/products";
import { listShops, type ShopListItemApi } from "../../api/shops";
import { listShopHolidays, getDailySchedule, type DailyScheduleApi } from "../../api/shopSchedule";
import {
  createReservation,
  listMyReservations,
  cancelReservation,
  rescheduleReservation,
  getHandoverDetail,
  confirmHandover,
  type ReservationApi,
  type HandoverDetail,
} from "../../api/reservations";
import PkgScreen from "./PkgScreen";
import MyPkgCfmScreen, { type PkgGroup } from "./MyPkgCfmScreen";
import AddOptScreen, { type AddOption } from "./AddOptScreen";
import PtnSelScreen, { type ShopView } from "./PtnSelScreen";
import CstSchedRsvScreen, { type DaySlotView } from "./CstSchedRsvScreen";
import UpgDiffPayScreen, { type PayItem } from "./UpgDiffPayScreen";
import RsvCfmScreen from "./RsvCfmScreen";
import PosLvlSelScreen from "../common/PosLvlSelScreen";
import CstDoneHandoverScreen, { type VehicleSummary } from "../common/CstDoneHandoverScreen";
import ReviewWriteScreen from "../common/ReviewWriteScreen";
import CoDtlProfScreen from "../common/CoDtlProfScreen";
import BookingDtlScreen, { type BookingTimelineStep } from "../common/BookingDtlScreen";
import BookingReschedScreen from "../common/BookingReschedScreen";
import BookingCancelScreen, { CANCEL_REASONS } from "../common/BookingCancelScreen";
import { TINT_POSITIONS, type TintLevel, type HandoverStatus } from "../common/commonTypes";
import { type NcpScreen, type NcpSheet, type PayMethodKey } from "./ncpTypes";
import { nfmt } from "./ncpFormat";

const pad2 = (n: number) => String(n).padStart(2, "0");

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

// "YYYY-MM-DD" 날짜키 + "HH:mm" 시간을 "YYYY.MM.DD(요일) HH:mm" 형태로 포맷 — 예약확정/예약상세 화면에서 공용
function formatVisitLabel(dateKey: string, timeLabel: string): string {
  if (!dateKey) return "2026.03.14(토) 10:30";
  const [y, m, d] = dateKey.split("-").map(Number);
  const wd = WEEKDAY_LABELS[new Date(y, m - 1, d).getDay()];
  return `${y}.${pad2(m)}.${pad2(d)}(${wd})${timeLabel ? " " + timeLabel : ""}`;
}

// 백엔드에 리뷰·평점 모델이 아직 없어 매장명 기준 임시 목업값을 그대로 사용 — 실제 리뷰 API가 생기면 교체
const SHOP_MOCK_STATS: Record<string, { official: boolean; rating: string; reviews: string }> = {
  "강남 오토바디": { official: true, rating: "4.9", reviews: "1,284" },
  "역삼 카케어": { official: false, rating: "4.8", reviews: "926" },
  "서초 프리미엄 디테일": { official: false, rating: "4.7", reviews: "641" },
};
const DEFAULT_SHOP_STATS = { official: false, rating: "4.8", reviews: "-" };

interface NcpkFlowProps {
  onExit: () => void;
  initialScreen?: NcpScreen;
}

export default function NcpkFlow({ onExit, initialScreen = "main" }: NcpkFlowProps) {
  const [screen, setScreen] = useState<NcpScreen>(initialScreen);
  const [sheet, setSheet] = useState<NcpSheet>(null);

  const [carsApi, setCarsApi] = useState<MyCarApi[]>([]);
  const [carBrandOptions, setCarBrandOptions] = useState<CommonCodeDetailApi[]>([]);
  const [carModelOptions, setCarModelOptions] = useState<CommonCodeDetailApi[]>([]);
  const [prodCatOptions, setProdCatOptions] = useState<CommonCodeDetailApi[]>([]);
  const [carInstOptions, setCarInstOptions] = useState<CommonCodeDetailApi[]>([]);
  const [shopsApi, setShopsApi] = useState<ShopListItemApi[]>([]);
  const [reservationsApi, setReservationsApi] = useState<ReservationApi[]>([]);

  const [tintLevels, setTintLevels] = useState<Record<string, TintLevel>>({}); // 기본값: 농도 미선택
  const [tintBulk, setTintBulk] = useState(false); // 기본값: 전체 일괄 적용 꺼짐
  const [tintOff, setTintOff] = useState<Record<string, boolean>>({});

  const [packageDetail, setPackageDetail] = useState<PackageDetailApi | null>(null);
  const [pkgSel, setPkgSel] = useState<Record<string, string>>({}); // prodCat -> 현재 선택된 구성상품코드(기본/업그레이드 통틀어)
  const [pkgDropOpen, setPkgDropOpen] = useState<string | null>(null);

  const [addOpts, setAddOpts] = useState<Record<string, boolean>>({});
  const [shopIndex, setShopIndex] = useState(0);

  const now = new Date();
  const [calY, setCalY] = useState(now.getFullYear());
  const [calM, setCalM] = useState(now.getMonth() + 1);
  const [sel, setSel] = useState("");
  const [time, setTime] = useState("");
  const [shopHolidays, setShopHolidays] = useState<string[]>([]);
  const [daySchedule, setDaySchedule] = useState<DailyScheduleApi | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [reservationNo, setReservationNo] = useState<string | null>(null);
  const [reservationId, setReservationId] = useState<number | null>(null);

  // CU-RSVC-20/21/22 예약 상세·일정변경·예약취소 (신차패키지에서는 실제 예약 데이터·API 기반)
  const [bookingCancelled, setBookingCancelled] = useState(false);
  const [cancelReason, setCancelReason] = useState<string | null>(null);
  const [cancelEtc, setCancelEtc] = useState("");
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [reschedCalY, setReschedCalY] = useState(now.getFullYear());
  const [reschedCalM, setReschedCalM] = useState(now.getMonth() + 1);
  const [reschedDay, setReschedDay] = useState<number | null>(null);
  const [reschedTime, setReschedTime] = useState("");
  const [reschedSubmitting, setReschedSubmitting] = useState(false);
  const [reschedHolidays, setReschedHolidays] = useState<string[]>([]);
  const [reschedDaySchedule, setReschedDaySchedule] = useState<DailyScheduleApi | null>(null);
  const [reschedScheduleLoading, setReschedScheduleLoading] = useState(false);

  const [pay, setPay] = useState<PayMethodKey>("card");
  const [payProcessing, setPayProcessing] = useState(false);
  const [pointUse, setPointUse] = useState(0);
  const [couponSel, setCouponSel] = useState<string | null>(null);
  const [handoverDetail, setHandoverDetail] = useState<HandoverDetail | null>(null);
  const [loadingHandover, setLoadingHandover] = useState(false);
  const [confirmingHandover, setConfirmingHandover] = useState(false);
  const [reviewStar, setReviewStar] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);

  const { toast, showToast } = useToast();

  // CU-NCPK-05/06 시공업체 목록·프로필 — 리뷰·평점은 백엔드에 데이터가 없어 매장명 기준 임시 목업값을 덧씌움.
  // 거리(distLabel)는 이번 연계 범위에서 위치정보 연동을 하지 않아 항상 "-"
  const shopViews: ShopView[] = shopsApi.map((s) => {
    const stats = SHOP_MOCK_STATS[s.name] ?? DEFAULT_SHOP_STATS;
    return {
      shopCode: s.shopCode,
      name: s.name,
      official: stats.official,
      rating: stats.rating,
      reviews: stats.reviews,
      distLabel: "-",
      categories: s.categories.map((code) => carInstOptions.find((c) => c.detailCode === code)?.detailName ?? code),
      intro: s.intro,
      greeting: s.greeting,
      address: [s.address, s.addressDetail].filter(Boolean).join(" · ") || null,
      photoUrl: s.mainPhoto ? `${API_BASE_URL}/uploads/${s.mainPhoto.photoPath}` : null,
    };
  });
  const selShopView = shopViews[shopIndex];
  const selShopName = selShopView?.name ?? "";

  // CU-NCPK-02 차량정보 카드 — 마이페이지와 동일하게 대표차량(없으면 첫 차량) 기준으로 표시
  const defaultCarApi = carsApi.find((c) => c.isDefault) ?? carsApi[0];
  const carBrandName = defaultCarApi
    ? carBrandOptions.find((b) => b.detailCode === defaultCarApi.carBrandCode)?.detailName ?? defaultCarApi.carBrandCode
    : "";
  const carModelName = defaultCarApi
    ? carModelOptions.find((m) => m.detailCode === defaultCarApi.carModelCode)?.detailName ?? defaultCarApi.carModelCode
    : "";
  const carLabel = defaultCarApi ? `${carBrandName} ${carModelName}` : "등록된 차량이 없어요";
  const carVin = defaultCarApi?.vin ?? null;

  // CU-NCPK-02 시공 항목 — 대표차량이 신차매핑(MAP)이고 연결된 패키지가 있을 때만 구성상품을 조회.
  // 구성상품은 상품분류(prodCat)별로 묶어 기본상품(basicItems, 무상·복수 가능) + 업그레이드옵션(optionItems, 유상)으로 표시.
  // 항목명은 공통코드명(PROD_CAT, 예: "썬팅")을 사용
  const pkgGroups: PkgGroup[] = (() => {
    if (!packageDetail) return [];
    const groups = new Map<string, PkgGroup>();
    const getGroup = (cat: string) => {
      let g = groups.get(cat);
      if (!g) {
        g = { prodCat: cat, name: prodCatOptions.find((c) => c.detailCode === cat)?.detailName ?? cat, baseOptions: [], upgradeOptions: [] };
        groups.set(cat, g);
      }
      return g;
    };
    for (const item of packageDetail.basicItems) {
      if (!item.product) continue;
      const cat = item.product.prodCat ?? "ETC";
      getGroup(cat).baseOptions.push({ code: item.componentCode, name: item.product.name });
    }
    for (const item of packageDetail.optionItems) {
      if (!item.product) continue;
      const cat = item.product.prodCat ?? "ETC";
      const group = groups.get(cat);
      if (!group) continue; // 업그레이드옵션은 항상 기본상품이 있는 분류에만 존재
      group.upgradeOptions.push({ code: item.componentCode, name: item.product.name, price: item.effectivePrice ?? item.product.price });
    }
    return Array.from(groups.values());
  })();

  // CU-NCPK-04 추가옵션 — 패키지에 없는 분류를 유상으로 추가하는 항목(itemType='ADD'). 없으면 addopt 시트를 건너뜀
  const addOptions: AddOption[] = (packageDetail?.addItems ?? [])
    .filter((item) => item.product)
    .map((item) => ({
      code: item.componentCode,
      name: item.product!.name,
      desc: item.product!.description ?? "",
      price: item.effectivePrice ?? item.product!.price,
    }));

  // CU-NCPK-02 썬팅 카드의 "농도 선택" 요약 라벨 — 실제 tintLevels/tintOff 상태를 반영(첫 활성·선택된 부위 기준 · 2개 이상이면 "외" 표기)
  const tintActivePositions = TINT_POSITIONS.filter((p) => !tintOff[p]);
  const tintConcLabel = (() => {
    if (tintActivePositions.length === 0) return "농도 선택 · 시공 부위 없음";
    const firstSelected = tintActivePositions.find((p) => tintLevels[p]);
    if (!firstSelected) return "농도 선택 · 부위별 농도를 선택해주세요";
    const shortLabel = firstSelected.replace("유리", "");
    return `농도 선택 · ${shortLabel} ${tintLevels[firstSelected]}%${tintActivePositions.length > 1 ? " 외" : ""}`;
  })();
  // 패키지에 썬팅 시공이 포함돼 있으면, 활성 부위 전부에 농도를 선택해야만 다음 단계(추가옵션/시공업체 선택)로 진행 가능
  const hasTintItem = pkgGroups.some((g) => g.prodCat === "TINT");
  const tintConcComplete = tintActivePositions.length > 0 && tintActivePositions.every((p) => !!tintLevels[p]);
  const canCompletePkg = !hasTintItem || tintConcComplete;

  // CU-NCPK-07 선택한 날짜의 예약 가능 시간대 — capacity가 없거나(템플릿 없음) 잠김이거나 마감이면 비활성
  const daySlots: DaySlotView[] = (daySchedule?.slots ?? []).map((s) => ({
    time: s.time,
    disabled: s.capacity === null || s.isLocked || s.reservedCount >= s.capacity,
  }));

  // CU-NCPK-08 결제 대상 — 선택한 업그레이드 옵션(패키지 기본 대비 유상 대체) + 선택한 추가옵션(패키지 미포함, 유상) 합산
  const payItems: PayItem[] = [
    ...pkgGroups.flatMap((g) => {
      const opt = g.upgradeOptions.find((o) => o.code === pkgSel[g.prodCat]);
      if (!opt) return [];
      const base = g.baseOptions[0];
      return [{ name: opt.name, sub: base ? `${base.name} → 업그레이드` : `${g.name} 업그레이드`, price: opt.price }];
    }),
    ...addOptions.filter((o) => addOpts[o.code]).map((o) => ({ name: o.name, sub: o.desc, price: o.price })),
  ];
  const payTotal = payItems.reduce((sum, p) => sum + p.price, 0);

  // CU-NCPK-09 예약 확정 요약 라벨
  const itemSummaryLabel =
    pkgGroups.length === 0 ? "시공 항목 없음" : pkgGroups.length === 1 ? pkgGroups[0].name : `${pkgGroups[0].name} 외 ${pkgGroups.length - 1}건`;
  const paidAmountLabel = payTotal > 0 ? `${nfmt(payTotal)}원 결제완료` : "결제 금액 없음";

  // CU-RSVC-16/CU-NCPK-10 시공완료·인수확인 — 실제 완료 등록된 차량·구성상품·사진으로 화면 구성
  const handover: HandoverStatus = handoverDetail?.handoverStatus === "confirmed" ? "done" : "pending";
  const handoverVehicleSummary: VehicleSummary | undefined = handoverDetail
    ? {
        car: handoverDetail.car ?? "-",
        vin: handoverDetail.vin ?? "-",
        items: handoverDetail.items.map((it) => ({
          name: it.name,
          sub: it.spec ?? "",
          tag: it.tag === "OPTION" ? "업그레이드" : "기본",
        })),
      }
    : undefined;
  const handoverPhotoUrls = handoverDetail?.photos.map((p) => `${API_BASE_URL}/uploads/${p}`) ?? [];

  // CU-NCPK-10/CU-RSVC-20 예약 상세 — 파트너앱에서 실제로 기록하는 진행상태(progressStatus)를 기준으로
  // 완료 여부를 판단해 인수확인 단계로 안내할지, 예약상세(진행현황)로 안내할지 결정
  const todayKey = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  const activeReservationProgress =
    reservationsApi.find((r) => r.reservationNo === reservationNo)?.progressStatus ?? "APPLIED";
  const bookingDone = activeReservationProgress === "DONE";
  const hasBooking = !!reservationNo;
  // 시공 시작(IN_PROGRESS) 이후에는 일정변경·예약취소 모두 불가 — 백엔드 cancel()/reschedule()과 동일 기준
  const bookingCancellable = hasBooking && !bookingCancelled && activeReservationProgress === "APPLIED";
  const bookingVisitLabel = reschedDay ? `${reschedCalY}.${pad2(reschedCalM)}.${pad2(reschedDay)} ${reschedTime}` : formatVisitLabel(sel, time);
  const bookingRows: Array<[string, string]> = [
    ["방문 일시", bookingVisitLabel],
    ["시공 항목", itemSummaryLabel],
    ["업그레이드 차액", paidAmountLabel],
  ];
  const bookingStages = bookingCancelled ? ["선정완료", "시공예정", "취소됨"] : ["선정완료", "시공예정", "시공중", "시공완료"];
  // 0-indexed: cancelled면 기존과 동일하게 "시공예정"에 고정, 그 외엔 실제 progressStatus를 그대로 반영
  const bookingCur = bookingCancelled
    ? 1
    : activeReservationProgress === "DONE"
      ? 3
      : activeReservationProgress === "IN_PROGRESS"
        ? 2
        : 1;
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
  const cancelReasonLabel = CANCEL_REASONS.find((r) => r.id === cancelReason)?.label ?? "사유 미기재";
  // 취소 정책(화면에 안내되는 문구와 동일 기준): 시공 3일 전까지 전액, 1~2일 전 90%(위약금10%), 당일 환불 없음
  const refundDiffDays = sel ? Math.round((new Date(`${sel}T00:00:00`).getTime() - new Date(`${todayKey}T00:00:00`).getTime()) / 86400000) : 3;
  const refundRate = refundDiffDays >= 3 ? 1 : refundDiffDays >= 1 ? 0.9 : 0;
  const refundAmount = Math.round(payTotal * refundRate);
  const cancelRefundLabel = refundRate === 1 ? "전액 환불 처리됨" : refundRate === 0.9 ? "90% 환불(위약금 10%) 처리됨" : "환불 없음(당일 취소)";

  // CU-RSVC-21 일정 변경 — 선택한 날짜의 예약 가능 시간대(신차패키지 원 예약과 동일한 실제 API 사용)
  const reschedDaySlots: DaySlotView[] = (reschedDaySchedule?.slots ?? []).map((s) => ({
    time: s.time,
    disabled: s.capacity === null || s.isLocked || s.reservedCount >= s.capacity,
  }));

  useEffect(() => {
    listMyCars()
      .then(setCarsApi)
      .catch((err) => showToast(err instanceof Error ? err.message : "차량 정보를 불러오지 못했어요", "danger"));
    Promise.all([getCommonCodeDetails("CAR_BRAND"), getCommonCodeDetails("CAR_MODEL"), getCommonCodeDetails("PROD_CAT"), getCommonCodeDetails("CAR_INST")])
      .then(([brands, models, prodCats, carInsts]) => {
        setCarBrandOptions(brands);
        setCarModelOptions(models);
        setProdCatOptions(prodCats);
        setCarInstOptions(carInsts);
      })
      .catch((err) => showToast(err instanceof Error ? err.message : "차량 코드 정보를 불러오지 못했어요", "danger"));
    listShops()
      .then(setShopsApi)
      .catch((err) => showToast(err instanceof Error ? err.message : "시공업체 정보를 불러오지 못했어요", "danger"));
    listMyReservations()
      .then(setReservationsApi)
      .catch((err) => showToast(err instanceof Error ? err.message : "예약 정보를 불러오지 못했어요", "danger"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 홈 화면 카드 등 다른 진입점에서 바로 예약상세/인수확인 화면으로 들어온 경우, 이번 세션에서 새로
  // 결제까지 마친 예약이 없으면(reservationNo 미설정) 서버에 남아있는 최근 확정 예약으로 상태를 복원
  useEffect(() => {
    if (initialScreen !== "bookingdtl" && initialScreen !== "handover") return;
    if (reservationNo) return;
    const activePkgRes = reservationsApi
      .filter((r) => r.reservationType === "PKG" && r.status === "CONFIRMED")
      .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    if (!activePkgRes) return;
    setReservationNo(activePkgRes.reservationNo);
    setReservationId(activePkgRes.id);
    setSel(activePkgRes.date);
    setTime(activePkgRes.time);
    const shopIdx = shopsApi.findIndex((s) => s.shopCode === activePkgRes.shopCode);
    if (shopIdx >= 0) setShopIndex(shopIdx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationsApi, shopsApi]);

  // CU-RSVC-16/CU-NCPK-10 시공완료·인수확인 — 인수확인 화면에 들어올 때마다 최신 상태(사진·인수확인 여부)를 다시 조회
  useEffect(() => {
    if (screen !== "handover" || reservationId === null) return;
    setLoadingHandover(true);
    getHandoverDetail(reservationId)
      .then(setHandoverDetail)
      .catch((err) => showToast(err instanceof Error ? err.message : "인수확인 정보를 불러오지 못했어요", "danger"))
      .finally(() => setLoadingHandover(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, reservationId]);

  useEffect(() => {
    const packageCode = (carsApi.find((c) => c.isDefault) ?? carsApi[0])?.packageCode;
    if (!packageCode) {
      setPackageDetail(null);
      return;
    }
    getPackageDetail(packageCode)
      .then(setPackageDetail)
      .catch((err) => showToast(err instanceof Error ? err.message : "시공 패키지 정보를 불러오지 못했어요", "danger"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carsApi]);

  // 패키지가 바뀌면(차량 전환 등) 분류별 선택을 각 기본 품목의 첫 후보로, 추가옵션 선택은 빈 상태로 초기화
  useEffect(() => {
    setPkgSel(Object.fromEntries(pkgGroups.filter((g) => g.baseOptions[0]).map((g) => [g.prodCat, g.baseOptions[0].code])));
    setPkgDropOpen(null);
    setAddOpts({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageDetail]);

  // CU-NCPK-07 달력에 보이는 달의 업체 휴무일 조회 — 업체·연·월이 바뀔 때마다 갱신
  useEffect(() => {
    const shopCode = selShopView?.shopCode;
    if (!shopCode) {
      setShopHolidays([]);
      return;
    }
    listShopHolidays(shopCode, calY, calM)
      .then(setShopHolidays)
      .catch((err) => showToast(err instanceof Error ? err.message : "휴무일 정보를 불러오지 못했어요", "danger"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selShopView?.shopCode, calY, calM]);

  // CU-NCPK-07 선택한 날짜의 예약 가능 시간대 조회
  useEffect(() => {
    const shopCode = selShopView?.shopCode;
    if (!shopCode || !sel) {
      setDaySchedule(null);
      return;
    }
    setScheduleLoading(true);
    getDailySchedule(shopCode, sel)
      .then(setDaySchedule)
      .catch((err) => showToast(err instanceof Error ? err.message : "예약 가능 시간을 불러오지 못했어요", "danger"))
      .finally(() => setScheduleLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selShopView?.shopCode, sel]);

  // CU-RSVC-21 일정 변경 — 달력에 보이는 달의 휴무일 조회 — 업체·연·월이 바뀔 때마다 갱신
  useEffect(() => {
    const shopCode = selShopView?.shopCode;
    if (!shopCode) {
      setReschedHolidays([]);
      return;
    }
    listShopHolidays(shopCode, reschedCalY, reschedCalM)
      .then(setReschedHolidays)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selShopView?.shopCode, reschedCalY, reschedCalM]);

  // CU-RSVC-21 일정 변경 — 새로 고른 날짜의 예약 가능 시간대 조회
  useEffect(() => {
    const shopCode = selShopView?.shopCode;
    if (!shopCode || !reschedDay) {
      setReschedDaySchedule(null);
      return;
    }
    const dateKey = `${reschedCalY}-${pad2(reschedCalM)}-${pad2(reschedDay)}`;
    setReschedScheduleLoading(true);
    getDailySchedule(shopCode, dateKey)
      .then(setReschedDaySchedule)
      .catch((err) => showToast(err instanceof Error ? err.message : "예약 가능 시간을 불러오지 못했어요", "danger"))
      .finally(() => setReschedScheduleLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selShopView?.shopCode, reschedDay]);

  const closeSheet = () => setSheet(null);
  // 이미 신청(확정된 예약)이 있으면 신차패키지 메인(보유 패키지 확인하기 CTA)을 다시 보여줄 이유가 없어 —
  // "신청할 보유 패키지가 없는" 상태이므로 앱 홈으로 바로 내보냄
  const goMain = () => {
    if (hasBooking) {
      onExit();
      return;
    }
    setScreen("main");
    setSheet(null);
  };

  const selectTintLevel = (position: string, level: TintLevel) => {
    if (tintBulk) {
      setTintLevels(Object.fromEntries(TINT_POSITIONS.map((p) => [p, level])));
    } else {
      setTintLevels((cur) => ({ ...cur, [position]: level }));
    }
  };

  // 하드웨어 백버튼: 각 화면 상단 '‹' 버튼의 onBack과 동일한 대상으로 이동. confirm처럼 원래
  // 뒤로가기 버튼이 없는 화면은 등록하지 않음(상위 스택으로 흘러가 홈으로 이동)
  useEffect(() => {
    if (sheet) {
      return pushBackAction(closeSheet);
    }
    switch (screen) {
      case "pkg":
      case "handover":
        return pushBackAction(goMain);
      case "shops":
        return pushBackAction(() => setScreen("pkg"));
      case "sched":
        return pushBackAction(() => setScreen("shops"));
      case "pay":
        return pushBackAction(() => setScreen("sched"));
      case "copro":
        return pushBackAction(() => setScreen("shops"));
      case "bookingdtl":
        return pushBackAction(goMain);
      case "resched":
      case "cancel":
        return pushBackAction(() => setScreen("bookingdtl"));
      default:
        return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, sheet]);

  const visitLabel = formatVisitLabel(sel, time);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {screen === "main" && (
        <PkgScreen
          onCheckPkg={() => setScreen("pkg")}
          onTapResvCard={() => setScreen(bookingDone ? "handover" : "bookingdtl")}
          onNavHome={onExit}
          onNavToast={(label) => showToast(`${label} 탭으로 이동해요`)}
          booking={
            hasBooking
              ? { itemSummaryLabel, shopName: selShopName, dateLabel: bookingDone ? visitLabel : bookingVisitLabel, done: bookingDone }
              : null
          }
        />
      )}

      {screen === "pkg" && (
        <MyPkgCfmScreen
          onBack={goMain}
          onComplete={() => (addOptions.length > 0 ? setSheet("addopt") : setScreen("shops"))}
          onOpenTint={() => setSheet("tint")}
          carLabel={carLabel}
          carVin={carVin}
          tintConcLabel={tintConcLabel}
          canComplete={canCompletePkg}
          pkgGroups={pkgGroups}
          pkgSel={pkgSel}
          pkgDropOpen={pkgDropOpen}
          onToggleDrop={(boxKey) => setPkgDropOpen((cur) => (cur === boxKey ? null : boxKey))}
          onSelectItem={(prodCat, code) => {
            setPkgSel((cur) => ({ ...cur, [prodCat]: code }));
            setPkgDropOpen(null);
          }}
          onToast={showToast}
        />
      )}

      {screen === "shops" && (
        <PtnSelScreen
          onBack={() => setScreen("pkg")}
          onProceed={() => setScreen("sched")}
          shops={shopViews}
          shopIndex={shopIndex}
          onSelectShop={setShopIndex}
          onViewProfile={() => setScreen("copro")}
        />
      )}

      {screen === "sched" && (
        <CstSchedRsvScreen
          onBack={() => setScreen("shops")}
          onConfirm={() => setScreen("pay")}
          shopName={selShopName}
          calY={calY}
          calM={calM}
          sel={sel}
          time={time}
          holidays={shopHolidays}
          daySlots={daySlots}
          scheduleLoading={scheduleLoading}
          onPrevMonth={() => {
            if (calM === 1) {
              setCalY((y) => y - 1);
              setCalM(12);
            } else {
              setCalM((m) => m - 1);
            }
          }}
          onNextMonth={() => {
            if (calM === 12) {
              setCalY((y) => y + 1);
              setCalM(1);
            } else {
              setCalM((m) => m + 1);
            }
          }}
          onSelectDate={(key) => {
            setSel(key);
            setTime("");
          }}
          onSelectTime={setTime}
        />
      )}

      {screen === "pay" && (
        <UpgDiffPayScreen
          onBack={() => setScreen("sched")}
          onPay={async () => {
            const shopCode = selShopView?.shopCode;
            if (!shopCode || !sel || !time) return;
            setPayProcessing(true);
            try {
              const reservation = await createReservation({ shopCode, date: sel, time, reservationType: "PKG" });
              setReservationNo(reservation.reservationNo);
              setReservationId(reservation.id);
              setScreen("confirm");
            } catch (err) {
              showToast(err instanceof Error ? err.message : "예약에 실패했어요. 다른 시간을 선택해주세요", "danger");
              setTime("");
              setScreen("sched");
            } finally {
              setPayProcessing(false);
            }
          }}
          submitting={payProcessing}
          payItems={payItems}
          payTotal={payTotal}
          pay={pay}
          pointUse={pointUse}
          couponSel={couponSel}
          couponSheetOpen={sheet === "coupon"}
          onSelectPay={setPay}
          onPointInput={(raw) => {
            const n = parseInt(raw.replace(/[^0-9]/g, ""), 10) || 0;
            setPointUse(Math.min(n, 0));
          }}
          onUseAllPoint={() => setPointUse(0)}
          onOpenCouponSheet={() => setSheet("coupon")}
          onCloseCouponSheet={closeSheet}
          onSelectCoupon={setCouponSel}
          onConfirmCoupon={() => {
            closeSheet();
            showToast(couponSel ? "쿠폰이 적용됐어요" : "쿠폰 적용이 해제됐어요", "success");
          }}
        />
      )}

      {screen === "confirm" && (
        <RsvCfmScreen
          onConfirm={() => {
            showToast("홈 화면으로 이동해요");
            setTimeout(goMain, 700);
          }}
          shopName={selShopName}
          visitLabel={visitLabel}
          itemSummaryLabel={itemSummaryLabel}
          paidAmountLabel={paidAmountLabel}
          reservationNo={reservationNo ?? undefined}
        />
      )}

      {screen === "handover" && (
        <CstDoneHandoverScreen
          selName={selShopName}
          handover={handover}
          vehicleSummary={handoverVehicleSummary}
          photos={handoverPhotoUrls}
          loading={loadingHandover}
          confirming={confirmingHandover}
          onBack={goMain}
          onConfirmHandover={async () => {
            if (handover !== "done") {
              if (reservationId === null) return;
              setConfirmingHandover(true);
              try {
                await confirmHandover(reservationId);
                setHandoverDetail(await getHandoverDetail(reservationId));
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

      {screen === "bookingdtl" && (
        <BookingDtlScreen
          onBack={goMain}
          shopName={selShopName}
          shopMeta="신차패키지 시공 예약"
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
            if (!reservationId || !reschedDay || !reschedTime) return;
            const dateKey = `${reschedCalY}-${pad2(reschedCalM)}-${pad2(reschedDay)}`;
            setReschedSubmitting(true);
            try {
              const updated = await rescheduleReservation(reservationId, dateKey, reschedTime);
              setSel(updated.date);
              setTime(updated.time);
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
          shopName={selShopName}
          currentVisitLabel={visitLabel}
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
            if (!reservationId || !cancelReason) return;
            setCancelSubmitting(true);
            try {
              await cancelReservation(reservationId, cancelReason, cancelReason === "ETC" ? cancelEtc : undefined);
              setBookingCancelled(true);
              setReservationNo(null);
              setReservationId(null);
              setScreen("bookingdtl");
              showToast("예약이 취소됐어요", "danger");
            } catch (err) {
              showToast(err instanceof Error ? err.message : "예약 취소에 실패했어요", "danger");
            } finally {
              setCancelSubmitting(false);
            }
          }}
          submitting={cancelSubmitting}
          shopName={selShopName}
          itemSummaryLabel={itemSummaryLabel}
          visitDateLabel={bookingVisitLabel}
          priceLabel={paidAmountLabel}
          reason={cancelReason}
          etcText={cancelEtc}
          refundAmount={refundAmount}
          onSelectReason={setCancelReason}
          onEtcChange={setCancelEtc}
        />
      )}

      {screen === "copro" && selShopView && (
        <CoDtlProfScreen
          name={selShopView.name}
          rating={selShopView.rating}
          dist={selShopView.distLabel}
          reviewCount={selShopView.reviews}
          categories={selShopView.categories}
          intro={selShopView.intro ?? undefined}
          greeting={selShopView.greeting ?? undefined}
          address={selShopView.address ?? undefined}
          photoUrl={selShopView.photoUrl}
          onBack={() => setScreen("shops")}
        />
      )}

      {sheet === "tint" && (
        <PosLvlSelScreen
          onClose={closeSheet}
          onComplete={() => {
            closeSheet();
            showToast("농도 선택이 반영됐어요", "success");
          }}
          posLevels={tintLevels}
          posBulk={tintBulk}
          posOff={tintOff}
          onSelectLevel={selectTintLevel}
          onToggleBulk={() => setTintBulk((v) => !v)}
          onTogglePosition={(name) =>
            setTintOff((cur) => ({ ...cur, [name]: !cur[name] }))
          }
        />
      )}

      {sheet === "addopt" && (
        <AddOptScreen
          onClose={closeSheet}
          onSkip={() => {
            setScreen("shops");
            setSheet(null);
          }}
          onComplete={() => {
            setScreen("shops");
            setSheet(null);
          }}
          addItems={addOptions}
          addOpts={addOpts}
          onToggleOpt={(code) => setAddOpts((cur) => ({ ...cur, [code]: !cur[code] }))}
        />
      )}

      {sheet === "review" && (
        <ReviewWriteScreen
          selName={selShopName}
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
            showToast("소중한 후기가 등록됐어요", "success");
            setTimeout(goMain, 700);
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
