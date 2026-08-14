// 고객앱 "신차패키지" 10개 화면(CU-NCPK-01~10)을 엮는 상태 컨테이너 (AuthFlow.tsx와 동일한 패턴)
import { useEffect, useState } from "react";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../components/ui/useToast";
import { pushBackAction } from "../../native/backHandler";
import { getCurrentPosition } from "../../lib/geolocation";
import { API_BASE_URL } from "../../api/config";
import { listMyCars, type MyCarApi } from "../../api/cars";
import { getCommonCodeDetails, type CommonCodeDetailApi } from "../../api/commonCodes";
import { getPackageDetail, type PackageDetailApi } from "../../api/products";
import { listShops, listShopReviews, type ShopListItemApi, type ShopReviewApi } from "../../api/shops";
import { listShopHolidays, getDailySchedule, type DailyScheduleApi } from "../../api/shopSchedule";
import {
  createReservation,
  listMyReservations,
  cancelReservation,
  rescheduleReservation,
  getHandoverDetail,
  confirmHandover,
  getPackageSelection,
  createReview,
  getReview,
  type ReservationApi,
  type HandoverDetail,
  type PackageSelectionDetail,
  type ReviewApi,
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
import CoDtlProfScreen, { type CoDtlReview } from "../common/CoDtlProfScreen";
import BookingDtlScreen, { type BookingTimelineStep } from "../common/BookingDtlScreen";
import BookingReschedScreen from "../common/BookingReschedScreen";
import BookingCancelScreen, { CANCEL_REASONS } from "../common/BookingCancelScreen";
import {
  TINT_POSITIONS,
  TINT_POSITION_TO_CODE,
  TINT_POSITION_LABELS,
  type TintLevel,
  type HandoverStatus,
  type PackageSelectionItemView,
} from "../common/commonTypes";
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

// 거리 라벨 — 1km 미만은 m 단위, 그 이상은 소수점 1자리 km 단위. 위치 정보를 못 구했거나 업체 좌표가 없으면 "-"
function formatDistance(distanceKm: number | null): string {
  if (distanceKm === null) return "-";
  return distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`;
}

// 예약 확정/일정 변경 직전 방어 로직 — 화면에 떠 있는 daySlots는 사용자가 달력을 연 시점의 스냅샷이라 그 사이
// 다른 고객이 같은 시간대를 채웠거나 업체가 휴무·잠금 처리했을 수 있다. 저장 API를 호출하기 직전 이 함수로 방금
// 새로 받아온 일정을 검사해 막힌 상태면 저장을 시도하지도 않고 명확한 사유를 사용자에게 알려준다(백엔드도 동일한
// 조건을 다시 검증하지만, 그건 이미 저장을 시도한 뒤의 반응적 거부라 이 사전 체크가 더 빠르고 분명하다)
function findBookableSlotError(schedule: DailyScheduleApi, time: string): string | null {
  if (schedule.isHoliday) return "선택하신 날짜가 휴무일로 바뀌었어요. 다른 날짜를 선택해주세요.";
  const slot = schedule.slots.find((s) => s.time === time);
  if (!slot || slot.capacity === null) return "선택하신 시간은 예약 가능한 시간대가 아니에요. 다른 시간을 선택해주세요.";
  if (slot.isLocked) return "선택하신 시간이 마감됐어요. 다른 시간을 선택해주세요.";
  if (slot.reservedCount >= slot.capacity) return "선택하신 시간의 예약 가능 인원이 방금 마감됐어요. 다른 시간을 선택해주세요.";
  return null;
}

interface NcpkFlowProps {
  onExit: () => void;
  initialScreen?: NcpScreen;
  /** 홈 화면 카드에서 특정 예약을 탭하고 들어온 경우의 그 예약번호 — bookingdtl/handover 진입 시 이 값으로 정확히
   * 그 예약을 찾아 보여준다. 없으면(신차패키지 메뉴로 직접 진입 등) 서버에 남아있는 최근 확정 예약으로 대체 복원한다 */
  targetReservationNo?: string;
}

export default function NcpkFlow({ onExit, initialScreen = "main", targetReservationNo }: NcpkFlowProps) {
  const [screen, setScreen] = useState<NcpScreen>(initialScreen);
  const [sheet, setSheet] = useState<NcpSheet>(null);

  const [carsApi, setCarsApi] = useState<MyCarApi[]>([]);
  const [carBrandOptions, setCarBrandOptions] = useState<CommonCodeDetailApi[]>([]);
  const [carModelOptions, setCarModelOptions] = useState<CommonCodeDetailApi[]>([]);
  const [prodCatOptions, setProdCatOptions] = useState<CommonCodeDetailApi[]>([]);
  const [carInstOptions, setCarInstOptions] = useState<CommonCodeDetailApi[]>([]);
  const [shopsApi, setShopsApi] = useState<ShopListItemApi[]>([]);
  const [reservationsApi, setReservationsApi] = useState<ReservationApi[]>([]);
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [shopReviews, setShopReviews] = useState<ShopReviewApi[]>([]);

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
  // CU-NCPK-09/CU-RSVC-20 예약확정·예약상세 — 예약확정 시점에 저장된 실제 선택 내역(가격 포함). pkgSel/addOpts/tintLevels는
  // 화면을 새로 마운트할 때마다 기본값으로 초기화돼(레거시 버그) 결제 후 조회 화면은 반드시 이 백엔드 값을 써야 한다
  const [packageSelection, setPackageSelection] = useState<PackageSelectionDetail | null>(null);
  const [confirmingHandover, setConfirmingHandover] = useState(false);
  const [reviewStar, setReviewStar] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const [review, setReview] = useState<ReviewApi | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const { toast, showToast } = useToast();

  // CU-NCPK-05/06 시공업체 목록·프로필 — 평점·후기수·거리 모두 GET /shops 응답의 실제 값을 사용.
  // official("공식") 배지는 백엔드에 대응하는 데이터가 아직 없어 항상 false(비노출)
  const shopViews: ShopView[] = shopsApi.map((s) => ({
    shopCode: s.shopCode,
    name: s.name,
    official: false,
    rating: s.avgRating !== null ? s.avgRating.toFixed(1) : "-",
    reviews: nfmt(s.reviewCount),
    distLabel: formatDistance(s.distanceKm),
    categories: s.categories.map((code) => carInstOptions.find((c) => c.detailCode === code)?.detailName ?? code),
    intro: s.intro,
    greeting: s.greeting,
    address: [s.address, s.addressDetail].filter(Boolean).join(" · ") || null,
    lat: s.latitude,
    lng: s.longitude,
    photoUrl: s.mainPhoto ? `${API_BASE_URL}/uploads/${s.mainPhoto.photoPath}` : null,
  }));
  const selShopView = shopViews[shopIndex];
  const selShopName = selShopView?.name ?? "";

  // CU-NCPK-06 업체 프로필의 후기 목록 — 별점(숫자)을 화면 표시용 별 문자열로 변환
  const shopReviewViews: CoDtlReview[] = shopReviews.map((r) => ({
    name: r.reviewerName,
    stars: "★".repeat(r.rating),
    text: r.content,
  }));

  // CU-NCPK-02 차량정보 카드 — 마이페이지와 동일하게 대표차량(없으면 첫 차량) 기준으로 표시
  const defaultCarApi = carsApi.find((c) => c.isDefault) ?? carsApi[0];
  const carBrandName = defaultCarApi
    ? carBrandOptions.find((b) => b.detailCode === defaultCarApi.carBrandCode)?.detailName ?? defaultCarApi.carBrandCode
    : "";
  const carModelName = defaultCarApi
    ? carModelOptions.find((m) => m.detailCode === defaultCarApi.carModelCode)?.detailName ?? defaultCarApi.carModelCode
    : "";
  const carLabel = defaultCarApi
    ? defaultCarApi.trimName
      ? `${carBrandName} ${carModelName} ${defaultCarApi.trimName}`
      : `${carBrandName} ${carModelName}`
    : "등록된 차량이 없어요";
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

  // 예약확정(POST /reservations) 시 저장할 최종 선택 항목 전체 — 분류별로 선택된 구성상품(기본상품이면 가격 0,
  // 업그레이드옵션이면 해당 가격) 1건씩 + 체크한 추가옵션들, 각 항목의 실제 적용 가격을 함께 전달
  const selectedItems = [
    ...pkgGroups.flatMap((g) => {
      const code = pkgSel[g.prodCat];
      if (!code) return [];
      const upgrade = g.upgradeOptions.find((o) => o.code === code);
      return [{ componentCode: code, price: upgrade?.price ?? 0 }];
    }),
    ...addOptions.filter((o) => addOpts[o.code]).map((o) => ({ componentCode: o.code, price: o.price })),
  ];

  // 예약확정 시 저장할 썬팅 부위별 농도 — 시공 안 함으로 끈 부위는 제외, 코드값(BID_TINT_POSITION)으로 변환해 전달
  const tintPositionsPayload = tintActivePositions
    .filter((p) => !!tintLevels[p])
    .map((p) => ({ position: TINT_POSITION_TO_CODE[p] ?? p, level: tintLevels[p] as string }));

  // CU-NCPK-09 예약 확정 요약 라벨
  const itemSummaryLabel =
    pkgGroups.length === 0 ? "시공 항목 없음" : pkgGroups.length === 1 ? pkgGroups[0].name : `${pkgGroups[0].name} 외 ${pkgGroups.length - 1}건`;
  const paidAmountLabel = payTotal > 0 ? `${nfmt(payTotal)}원 결제완료` : "결제 금액 없음";

  // CU-NCPK-09/CU-RSVC-20 예약확정·예약상세 상세 표시 — pkgSel/addOpts 등 라이브 상태는 화면 재마운트 때마다
  // 기본값으로 리셋되므로(위 payItems/paidAmountLabel과 달리) 예약확정 시점에 백엔드에 저장해둔 실제 선택 내역을 사용
  const confirmedTintDetail =
    packageSelection && packageSelection.tintPositions.length > 0
      ? packageSelection.tintPositions.map((t) => `${TINT_POSITION_LABELS[t.position] ?? t.position} ${t.level}%`).join(" · ")
      : undefined;
  const confirmedItems: PackageSelectionItemView[] = (packageSelection?.items ?? []).map((it) => ({
    category: it.prodCat ? prodCatOptions.find((c) => c.detailCode === it.prodCat)?.detailName ?? it.prodCat : it.name,
    product: it.name,
    price: it.price,
    tintDetail: it.prodCat === "TINT" ? confirmedTintDetail : undefined,
  }));
  const confirmedPriceLabel = packageSelection
    ? (() => {
        const total = packageSelection.items.reduce((sum, it) => sum + it.price, 0);
        return total > 0 ? `${nfmt(total)}원 결제완료` : "결제 금액 없음";
      })()
    : paidAmountLabel; // 조회 전(막 결제 직후 등)에는 라이브 계산값으로 잠깐 대체 — 이 시점엔 아직 정확함

  // CU-RSVC-16/CU-NCPK-10 시공완료·인수확인 — 실제 완료 등록된 차량·구성상품·사진으로 화면 구성
  const handover: HandoverStatus = handoverDetail?.handoverStatus === "confirmed" ? "done" : "pending";
  const handoverTintDetail =
    handoverDetail && handoverDetail.tintPositions.length > 0
      ? handoverDetail.tintPositions.map((t) => `${TINT_POSITION_LABELS[t.position] ?? t.position} ${t.level}%`).join(" · ")
      : undefined;
  const handoverVehicleSummary: VehicleSummary | undefined = handoverDetail
    ? {
        car: handoverDetail.car ?? "-",
        vin: handoverDetail.vin ?? "-",
        packageName: handoverDetail.packageName,
        items: handoverDetail.items.map((it) => ({
          name: it.name,
          sub: it.spec ?? "",
          tag: it.tag === "OPTION" ? "업그레이드" : "기본",
          tintDetail: it.prodCat === "TINT" ? handoverTintDetail : undefined,
        })),
      }
    : undefined;
  const handoverPhotoUrls = handoverDetail?.photos.map((p) => `${API_BASE_URL}/uploads/${p}`) ?? [];

  // CU-NCPK-10/CU-RSVC-20 예약 상세 — 파트너앱에서 실제로 기록하는 진행상태(progressStatus)를 기준으로
  // 완료 여부를 판단해 인수확인 단계로 안내할지, 예약상세(진행현황)로 안내할지 결정
  const todayKey = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  const activeReservation = reservationsApi.find((r) => r.reservationNo === reservationNo);
  const activeReservationProgress = activeReservation?.progressStatus ?? "APPLIED";
  const bookingDone = activeReservationProgress === "DONE";
  const hasBooking = !!reservationNo;
  // 예약 상세 화면 전용 로딩 게이트 — 업체 인덱스 동기화(위 useEffect)나 packageDetail 조회가 아직 안 끝난
  // 상태에서 selShopName·itemSummaryLabel이 임시값으로 잠깐 보였다가 실제 값으로 바뀌는 깜빡임을 막기 위함
  const bookingDtlLoading =
    hasBooking &&
    (!activeReservation || selShopView?.shopCode !== activeReservation.shopCode || !packageDetail || !packageSelection);
  // 시공 시작(IN_PROGRESS) 이후에는 일정변경·예약취소 모두 불가 — 백엔드 cancel()/reschedule()과 동일 기준
  const bookingCancellable = hasBooking && !bookingCancelled && activeReservationProgress === "APPLIED";
  const bookingVisitLabel = reschedDay ? `${reschedCalY}.${pad2(reschedCalM)}.${pad2(reschedDay)} ${reschedTime}` : formatVisitLabel(sel, time);
  const bookingRows: Array<[string, string]> = [["방문 일시", bookingVisitLabel]];
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
    listMyReservations()
      .then(setReservationsApi)
      .catch((err) => showToast(err instanceof Error ? err.message : "예약 정보를 불러오지 못했어요", "danger"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // CU-NCPK-05 시공업체 선택 화면의 거리순 정렬용 — 권한 거부·미지원이어도 흐름은 그대로 진행(거리 없이 표시)
  useEffect(() => {
    getCurrentPosition().then(setMyLocation);
  }, []);

  // CU-NCPK-05 시공업체 선택 — 대표차량(신차매핑)의 딜러사가 DealerShopMapping(AD-NCPK-04)으로 지정한
  // 업체만 노출해야 해서, carsApi가 로드된 뒤(대표차량의 dealerCompanyId를 알 수 있을 때) 조회한다.
  // myLocation은 비동기로 뒤늦게 채워질 수 있어(위치 권한 프롬프트 대기) 의존성에 넣어 확보되는 즉시 거리순으로 재조회
  useEffect(() => {
    const dealerCompanyId = (carsApi.find((c) => c.isDefault) ?? carsApi[0])?.dealerCompanyId ?? undefined;
    listShops({ dealerCompanyId, lat: myLocation?.lat, lng: myLocation?.lng })
      .then(setShopsApi)
      .catch((err) => showToast(err instanceof Error ? err.message : "시공업체 정보를 불러오지 못했어요", "danger"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carsApi, myLocation]);

  // 홈 화면 카드 등 다른 진입점에서 바로 예약상세/인수확인 화면으로 들어온 경우, 이번 세션에서 새로
  // 결제까지 마친 예약이 없으면(reservationNo 미설정) 서버에 남아있는 예약으로 상태를 복원.
  // targetReservationNo가 있으면(홈 화면 카드를 탭한 경우) 그 예약을 정확히 찾아 쓰고, 없을 때만 "가장 최근
  // 확정 예약"으로 추측한다 — 이 추측 로직은 HomeScreen.tsx가 카드에 띄우는 예약을 고르는 기준(mappedAt 이후
  // 생성분만 대상)과 반드시 동일해야 한다. 기준이 어긋나면 홈 카드에는 A 업체가 보이는데 상세 화면은 다른 예약을
  // 추측해 B 업체를 보여주는 불일치가 생긴다(2026-08-13 실제 발생 확인)
  useEffect(() => {
    if (initialScreen !== "bookingdtl" && initialScreen !== "handover") return;
    if (reservationNo) return;
    const mappedAt = defaultCarApi?.mappedAt ? new Date(defaultCarApi.mappedAt).getTime() : null;
    const activePkgRes = targetReservationNo
      ? reservationsApi.find((r) => r.reservationNo === targetReservationNo)
      : reservationsApi
          .filter(
            (r) =>
              r.reservationType === "PKG" &&
              r.status === "CONFIRMED" &&
              (mappedAt === null || new Date(r.createdAt).getTime() >= mappedAt),
          )
          .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    if (!activePkgRes) return;
    setReservationNo(activePkgRes.reservationNo);
    setReservationId(activePkgRes.id);
    setSel(activePkgRes.date);
    setTime(activePkgRes.time);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationsApi, targetReservationNo, defaultCarApi?.mappedAt]);

  // 위 복원 로직과 별도 effect로 분리 — shopsApi는 carsApi 로드 → 위치 취득(최대 5초 대기) → 이후에야 채워지는
  // 체인이라, reservationsApi가 먼저 응답해 위 effect가 shopsApi=[] 상태로 먼저 실행되는 경우가 흔하다. 그 경우
  // 위 effect에서 findIndex가 실패해도 reservationNo가 이미 설정돼 있어 재실행되지 않으므로, shopIndex 동기화만
  // shopsApi가 바뀔 때마다 독립적으로 다시 계산해 shopsApi가 늦게 도착해도 정확한 업체로 맞춰지게 한다
  useEffect(() => {
    if (!reservationNo) return;
    const shopCode = reservationsApi.find((r) => r.reservationNo === reservationNo)?.shopCode;
    if (!shopCode) return;
    const shopIdx = shopsApi.findIndex((s) => s.shopCode === shopCode);
    if (shopIdx >= 0) setShopIndex(shopIdx);
  }, [reservationNo, reservationsApi, shopsApi]);

  // CU-RSVC-16/CU-NCPK-10 시공완료·인수확인 — 인수확인 화면에 들어올 때마다 최신 상태(사진·인수확인 여부)를 다시 조회
  useEffect(() => {
    if (screen !== "handover" || reservationId === null) return;
    setLoadingHandover(true);
    setReview(null);
    getHandoverDetail(reservationId)
      .then(setHandoverDetail)
      .catch((err) => showToast(err instanceof Error ? err.message : "인수확인 정보를 불러오지 못했어요", "danger"))
      .finally(() => setLoadingHandover(false));
    getReview(reservationId)
      .then(setReview)
      .catch(() => {}); // 후기 조회 실패는 버튼 노출에만 영향 — 별도 에러 토스트 불필요(RsvFlow.tsx와 동일 처리)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, reservationId]);

  // CU-NCPK-09/CU-RSVC-20 예약확정·예약상세 화면에 들어올 때마다 예약확정 시점에 저장된 실제 선택 내역을 다시 조회
  useEffect(() => {
    if ((screen !== "confirm" && screen !== "bookingdtl") || reservationId === null) return;
    getPackageSelection(reservationId)
      .then(setPackageSelection)
      .catch(() => setPackageSelection(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, reservationId]);

  // CU-NCPK-06 업체 프로필 — 프로필 화면에 들어갈 때만 그 업체의 후기 목록을 조회(목록 화면에선 평점·후기수만 필요)
  useEffect(() => {
    const shopCode = selShopView?.shopCode;
    if (screen !== "copro" || !shopCode) return;
    listShopReviews(shopCode)
      .then(setShopReviews)
      .catch((err) => showToast(err instanceof Error ? err.message : "후기를 불러오지 못했어요", "danger"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, selShopView?.shopCode]);

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

  // CU-NCPK-07 달력에 보이는 달의 업체 휴무일 조회 — 업체·연·월이 바뀔 때마다 갱신.
  // 함수로 분리해둬 "이 업체로 진행하기" 클릭 시(handleProceedToSched)에도 같은 업체·월이어도 강제로 다시 불러올 수 있게 함
  const loadShopHolidays = (shopCode: string, year: number, month: number) => {
    listShopHolidays(shopCode, year, month)
      .then(setShopHolidays)
      .catch((err) => showToast(err instanceof Error ? err.message : "휴무일 정보를 불러오지 못했어요", "danger"));
  };

  useEffect(() => {
    const shopCode = selShopView?.shopCode;
    if (!shopCode) {
      setShopHolidays([]);
      return;
    }
    loadShopHolidays(shopCode, calY, calM);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selShopView?.shopCode, calY, calM]);

  // CU-NCPK-07 선택한 날짜의 예약 가능 시간대 조회 — 위와 동일한 이유로 함수로 분리
  const loadDaySchedule = (shopCode: string, dateKey: string) => {
    setScheduleLoading(true);
    getDailySchedule(shopCode, dateKey)
      .then(setDaySchedule)
      .catch((err) => showToast(err instanceof Error ? err.message : "예약 가능 시간을 불러오지 못했어요", "danger"))
      .finally(() => setScheduleLoading(false));
  };

  useEffect(() => {
    const shopCode = selShopView?.shopCode;
    if (!shopCode || !sel) {
      setDaySchedule(null);
      return;
    }
    loadDaySchedule(shopCode, sel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selShopView?.shopCode, sel]);

  // CU-RSVC-21 일정 변경 — 달력에 보이는 달의 휴무일 조회 — 업체·연·월이 바뀔 때마다 갱신.
  // 위 CU-NCPK-07과 동일한 이유로 함수 분리 — "일정 변경" 클릭 시(handleOpenResched)에도 명시적으로 다시 불러옴
  const loadReschedHolidays = (shopCode: string, year: number, month: number) => {
    listShopHolidays(shopCode, year, month)
      .then(setReschedHolidays)
      .catch(() => {});
  };

  useEffect(() => {
    const shopCode = selShopView?.shopCode;
    if (!shopCode) {
      setReschedHolidays([]);
      return;
    }
    loadReschedHolidays(shopCode, reschedCalY, reschedCalM);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selShopView?.shopCode, reschedCalY, reschedCalM]);

  // CU-RSVC-21 일정 변경 — 새로 고른 날짜의 예약 가능 시간대 조회
  const loadReschedDaySchedule = (shopCode: string, dateKey: string) => {
    setReschedScheduleLoading(true);
    getDailySchedule(shopCode, dateKey)
      .then(setReschedDaySchedule)
      .catch((err) => showToast(err instanceof Error ? err.message : "예약 가능 시간을 불러오지 못했어요", "danger"))
      .finally(() => setReschedScheduleLoading(false));
  };

  useEffect(() => {
    const shopCode = selShopView?.shopCode;
    if (!shopCode || !reschedDay) {
      setReschedDaySchedule(null);
      return;
    }
    loadReschedDaySchedule(shopCode, `${reschedCalY}-${pad2(reschedCalM)}-${pad2(reschedDay)}`);
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
          onProceed={() => {
            // 앞서 이 업체를 이미 조회해둔 상태(동일 shopCode·연월)였다면 useEffect 의존성이 안 바뀌어 재조회가
            // 안 일어나므로, 예약 직전 시점의 최신 휴무일·예약가능시간을 보장하기 위해 여기서 명시적으로 다시 불러옴
            const shopCode = selShopView?.shopCode;
            if (shopCode) {
              loadShopHolidays(shopCode, calY, calM);
              if (sel) loadDaySchedule(shopCode, sel);
            }
            setScreen("sched");
          }}
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
              // 방어 로직: 결제(예약 확정) 직전 해당 일자·시간·예약가능대수를 최신 상태로 다시 확인
              const freshSchedule = await getDailySchedule(shopCode, sel);
              setDaySchedule(freshSchedule);
              const slotError = findBookableSlotError(freshSchedule, time);
              if (slotError) {
                showToast(slotError, "danger");
                setTime("");
                setScreen("sched");
                return;
              }
              const reservation = await createReservation({
                shopCode,
                date: sel,
                time,
                reservationType: "PKG",
                selectedItems,
                tintPositions: tintPositionsPayload,
              });
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
          items={confirmedItems}
          paidAmountLabel={confirmedPriceLabel}
          reservationNo={reservationNo ?? undefined}
        />
      )}

      {screen === "handover" && (
        <CstDoneHandoverScreen
          selName={selShopName}
          handover={handover}
          vehicleSummary={handoverVehicleSummary}
          photos={handoverPhotoUrls}
          review={review}
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
          items={confirmedItems}
          priceLabel={confirmedPriceLabel}
          timeline={bookingTimeline}
          cancelled={bookingCancelled}
          cancelReasonLabel={cancelReasonLabel}
          cancelRefundLabel={cancelRefundLabel}
          cancellable={bookingCancellable}
          loading={bookingDtlLoading}
          onOpenResched={() => {
            // "이 업체로 진행하기"와 동일한 이유 — 의존성(shopCode·연월)이 안 바뀌었어도 일정 변경 화면을 열 때마다
            // 최신 휴무일·예약가능시간을 다시 불러옴
            const shopCode = selShopView?.shopCode;
            if (shopCode) {
              loadReschedHolidays(shopCode, reschedCalY, reschedCalM);
              if (reschedDay) loadReschedDaySchedule(shopCode, `${reschedCalY}-${pad2(reschedCalM)}-${pad2(reschedDay)}`);
            }
            setScreen("resched");
          }}
          onOpenCancel={() => setScreen("cancel")}
        />
      )}

      {screen === "resched" && (
        <BookingReschedScreen
          onBack={() => setScreen("bookingdtl")}
          onConfirm={async () => {
            if (!reservationId || !reschedDay || !reschedTime) return;
            const shopCode = selShopView?.shopCode;
            const dateKey = `${reschedCalY}-${pad2(reschedCalM)}-${pad2(reschedDay)}`;
            setReschedSubmitting(true);
            try {
              // 방어 로직: 일정 변경 저장 직전 해당 일자·시간·예약가능대수를 최신 상태로 다시 확인
              if (shopCode) {
                const freshSchedule = await getDailySchedule(shopCode, dateKey);
                setReschedDaySchedule(freshSchedule);
                const slotError = findBookableSlotError(freshSchedule, reschedTime);
                if (slotError) {
                  showToast(slotError, "danger");
                  setReschedTime("");
                  return;
                }
              }
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
          lat={selShopView.lat}
          lng={selShopView.lng}
          reviews={shopReviewViews}
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
          onSubmit={async () => {
            if (reviewStar === 0 || submittingReview || reservationId === null) return;
            setSubmittingReview(true);
            try {
              const created = await createReview(reservationId, {
                rating: reviewStar,
                content: reviewText,
                photos: reviewPhotos,
              });
              setReview(created);
              showToast("소중한 후기가 등록됐어요", "success");
              closeSheet();
            } catch (err) {
              showToast(err instanceof Error ? err.message : "후기 등록에 실패했어요", "danger");
            } finally {
              setSubmittingReview(false);
            }
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
