// PT-RSVC-01~13 예약시공관리(입찰) 실데이터 매핑·카탈로그·공용 포맷 헬퍼
// 입찰함·입찰 참여·추천안 작성/제출·상품 카탈로그(GET /products) 모두 실API 연동 완료
import type {
  ShopBidRequestApi,
  ShopBidRequestCarApi,
  ShopBidRequestItemApi,
  ShopBidRequestPositionApi,
} from "../../api/bidRequests";
import type { BidJob } from "../../api/reservations";
import type { BidReq, JobStatus, PlanLine, ReqStatus, ReqType, RsvcItem, RsvcJob, RsvcProduct } from "./rsvcTypes";

// PT-RSVC-02 시공 현황 상태 탭(신차패키지 시공관리의 NCPK_TAB_META와 동일 패턴)
export const JOB_TAB_META: { key: JobStatus; label: string }[] = [
  { key: "착수전", label: "착수전" },
  { key: "시공중", label: "시공중" },
  { key: "완료", label: "완료" },
];

// -> CommonCodeDetail(code='CAR_INST'), apps/customer-app의 rsvTypes.ts INST_CODE_LABELS와 동일
const INST_CODE_LABELS: Record<string, string> = {
  TINT: "썬팅·틴팅",
  PPF: "PPF",
  BBOX: "블랙박스",
  CCA: "유리막 코팅",
  UCOAT: "언더코팅",
  CLEAN: "광택·디테일링",
  EXTREP: "외장수리",
  WHTIRE: "휠·타이어",
};

// -> CommonCodeDetail(code='BID_TINT_POSITION')
const TINT_POS_LABELS: Record<string, string> = {
  FRONT: "전면유리",
  SIDE_1: "측면 1열",
  SIDE_2: "측면 2열",
  REAR: "후면유리",
  SUNROOF: "선루프",
};
// 한글 부위명 -> BID_TINT_POSITION 코드(TINT_POS_LABELS 역매핑) — 추천안 제출 시 사용
const POS_NAME_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(TINT_POS_LABELS).map(([code, name]) => [name, code]),
);
export function posNameToCode(name: string): string {
  return POS_NAME_TO_CODE[name] ?? name;
}

// CommonCodeDetail(code='CAR_INST') -> CommonCodeDetail(code='PROD_CAT') 매핑 — 두 코드그룹 값이 서로 달라 명시 매핑 필요
// (TINT/PPF/BBOX는 코드가 동일, CCA→COAT·WHTIRE→TIRE는 기존 PROD_CAT 코드를 그대로 재사용, CLEAN/UCOAT/EXTREP는 신규 추가된 코드)
export const CAR_INST_TO_PROD_CAT: Record<string, string> = {
  TINT: "TINT",
  PPF: "PPF",
  BBOX: "BBOX",
  CCA: "COAT",
  UCOAT: "UCOAT",
  CLEAN: "CLEAN",
  EXTREP: "EXTREP",
  WHTIRE: "TIRE",
};

function formatDeadlineLabel(bidDeadlineIso: string): string {
  const deadline = new Date(bidDeadlineIso);
  const mm = String(deadline.getMonth() + 1).padStart(2, "0");
  const dd = String(deadline.getDate()).padStart(2, "0");
  const hh = String(deadline.getHours()).padStart(2, "0");
  const mi = String(deadline.getMinutes()).padStart(2, "0");
  const dateTime = `${mm}.${dd} ${hh}:${mi}`;
  const diffMs = deadline.getTime() - Date.now();
  if (diffMs <= 0) return `마감 · ${dateTime}`;
  return `D-${Math.ceil(diffMs / 86400000)} · ${dateTime}`;
}

// 신규(신규 입찰 없음)/진행중(내가 이미 응찰·추천, 아직 고객 선택 전 — 수정 가능)/마감(선정완료·마감) 3구분
function deriveReqStatus(req: ShopBidRequestApi): ReqStatus {
  if (req.status === "SELECTED" || req.status === "CLOSED") return "closed";
  if (new Date(req.bidDeadline).getTime() <= Date.now()) return "closed";
  if (req.myOffer || req.myPlan) return "active";
  return "open";
}

/**
 * GET /shops/me/bid-requests 응답 1건을 화면 표시용 BidReq로 변환(myOffer가 있으면 이미 제출한 입찰 — OPEN인 동안 수정 가능)
 * carLabel은 apps/customer-app과 동일하게 CommonCodeDetail(CAR_BRAND/CAR_MODEL) 조회로 "벤츠 E-Class"처럼 라벨 변환하는 함수
 */
/** 시공 항목(instCode) + 부위/농도(TINT만)를 화면 표시용 RsvcItem[]으로 변환 — mapBidRequest·mapBidJob 공용 */
export function mapRequestItems(
  items: ShopBidRequestItemApi[],
  positions: ShopBidRequestPositionApi[],
): RsvcItem[] {
  return items.map((it) => {
    const name = INST_CODE_LABELS[it.instCode] ?? it.instCode;
    if (it.instCode === "TINT" && positions.length) {
      const posSummary = positions.map((p) => `${TINT_POS_LABELS[p.position] ?? p.position} ${p.level}%`).join(" · ");
      const spec = it.productName ? `${it.productName} · ${posSummary}` : posSummary;
      return { name, spec, instCode: it.instCode, productName: it.productName };
    }
    return { name, spec: it.productName ?? "", instCode: it.instCode, productName: it.productName };
  });
}

export function mapBidRequest(req: ShopBidRequestApi, carLabel: (car: ShopBidRequestCarApi | null) => string | null): BidReq {
  const items = mapRequestItems(req.items, req.positions);
  const budgetLabel =
    req.reqType === "EXPERT"
      ? `${won(req.budget ?? 0)} 이하`
      : `반경 ${req.radiusKm}km · 평점 ${req.minRating ? `${req.minRating.toFixed(1)}★ 이상` : "전체"}`;

  return {
    id: req.requestNo,
    type: req.reqType === "EXPERT" ? "expert" : "general",
    customer: req.customerName,
    car: carLabel(req.car) ?? "-",
    distance: "-", // 회원 위치 좌표 미보유로 실거리 계산 불가(반경 조건은 검색 조건 행에만 노출)
    category: req.reqType === "EXPERT" ? items.map((it) => it.name).join(" · ") : undefined,
    items,
    budgetLabel,
    deadlineLabel: formatDeadlineLabel(req.bidDeadline),
    desiredDate: req.desiredDate,
    status: deriveReqStatus(req),
    myOffer: req.myOffer
      ? {
          prices: Object.fromEntries(req.myOffer.items.map((it) => [it.instCode, String(it.price)])),
          date: req.myOffer.scheduledDate,
          time: req.myOffer.scheduledTime,
          memo: req.myOffer.memo ?? "",
        }
      : undefined,
    myPlan: req.myPlan
      ? {
          planNo: req.myPlan.planNo,
          items: mapRequestItems(req.myPlan.items, req.myPlan.positions),
          totalOffer: req.myPlan.items.reduce((sum, it) => sum + it.offerPrice, 0),
          scheduledDate: req.myPlan.scheduledDate,
          scheduledTime: req.myPlan.scheduledTime,
          reason: req.myPlan.reason,
        }
      : undefined,
    // 고객이 선택 완료(SELECTED)했고, 그 선택이 내가 제출한 응찰/추천안과 같으면 낙찰(picked)
    picked:
      req.status === "SELECTED" &&
      ((!!req.myOffer && req.myOffer.offerNo === req.selectedOfferNo) ||
        (!!req.myPlan && req.myPlan.planNo === req.selectedPlanNo)),
  };
}

/** "YYYY-MM-DD" -> "8월 7일(금)" */
export function formatDesiredDateLabel(desiredDate: string): string {
  const d = new Date(`${desiredDate}T00:00:00`);
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${d.getMonth() + 1}월 ${d.getDate()}일(${weekday})`;
}

const JOB_PROGRESS_LABELS: Record<string, RsvcJob["status"]> = {
  APPLIED: "착수전",
  IN_PROGRESS: "시공중",
  DONE: "완료",
};

/** GET /shops/me/reservations/bids 응답 1건을 화면 표시용 RsvcJob으로 변환 */
export function mapBidJob(job: BidJob, carLabel: (car: ShopBidRequestCarApi | null) => string | null): RsvcJob {
  return {
    id: job.reservationNo,
    requestNo: job.requestNo,
    customer: job.customerName,
    phone: job.phone,
    car: carLabel(job.car) ?? "-",
    vin: job.vin ?? "-", // -> BidRequest.myCarId -> MyCar.vin(대표차량 미등록 회원은 "-")
    status: JOB_PROGRESS_LABELS[job.progressStatus] ?? "착수전",
    schedule: `${job.date.replace(/-/g, ".")} ${job.time}`,
    items: mapRequestItems(job.items, job.positions),
    doneCheck: {},
    photos: [],
    memo: "",
    reschedStatus: job.reschedStatus === "REQUESTED" ? "sent" : job.reschedStatus === "REJECTED" ? "rejected" : "none",
    reschedReason: job.reschedReason ?? "",
    reschedDate: job.reschedDate ?? "",
    reschedTime: job.reschedTime ?? "",
    reschedRejectReason: job.reschedRejectReason ?? "",
  };
}

export const POS_NAMES = ["전면유리", "측면 1열", "측면 2열", "후면유리", "선루프"];

export function hasPos(instCode: string): boolean {
  return instCode === "TINT";
}

export function won(n: number | string | null | undefined): string {
  return `${Number(n || 0).toLocaleString("ko-KR")}원`;
}

/** 고객이 요청한 제품명을 실 카탈로그(productsByInstCode)에서 이름으로 찾아 판매가를 참고용으로 반환(없으면 null) */
export function findRequestedProductPrice(
  productsByInstCode: Record<string, RsvcProduct[]>,
  instCode: string | undefined,
  productName: string | null | undefined,
): number | null {
  if (!instCode || !productName) return null;
  return (productsByInstCode[instCode] ?? []).find((p) => p.name === productName)?.price ?? null;
}

/**
 * 요청 항목별 실 카탈로그(productsByInstCode, instCode -> GET /products 결과)로 초안 추천 라인 생성.
 * 카탈로그에 상품이 하나도 없는 항목은(실무상 발생하지 않아야 함 — 8개 CAR_INST 전부 최소 1개 이상 시딩됨) 제외한다.
 */
/** instCodeOrder는 admin-app 시공항목 관리(AD-CTLG-03)에 등록된 순서 그대로(carInstCodes를 조회한 순서) —
 * 없는 코드는 뒤로 밀어서(정렬순서 개념이 없는 값이라도) 항목이 누락되지 않게 함 */
export function buildPlanDraft(
  req: BidReq,
  productsByInstCode: Record<string, RsvcProduct[]>,
  instCodeOrder: string[] = [],
): PlanLine[] {
  const orderIndex = new Map(instCodeOrder.map((code, i) => [code, i]));
  return req.items
    .filter((it) => it.instCode && (productsByInstCode[it.instCode]?.length ?? 0) > 0)
    .slice()
    .sort((a, b) => (orderIndex.get(a.instCode!) ?? Infinity) - (orderIndex.get(b.instCode!) ?? Infinity))
    .map((it) => {
      const instCode = it.instCode!;
      // 부위·농도 기본값 없음 — 전 부위를 우선 꺼둔 채로 시작해 파트너가 직접 부위를 켜고 농도를 골라야 함
      // (제품 기본 선택 제거와 동일한 이유, 2026-08-14 사용자 확정)
      const posOff: Record<string, boolean> = {};
      if (hasPos(instCode)) POS_NAMES.forEach((n) => (posOff[n] = true));
      return {
        name: it.name,
        instCode,
        spec: it.spec,
        productCode: null,
        productName: null,
        retailPrice: null,
        offer: "",
        posOff,
        posLevels: {},
        posBulk: false,
      };
    });
}

export function reqTypeLabel(type: ReqType): string {
  return type === "general" ? "일반입찰" : "전문가추천";
}

export function reqTypeChipClass(type: ReqType): string {
  return type === "general" ? "text-brand bg-brand-subtle" : "text-[#0E9A96] bg-[#0E9A9614]";
}

export function jobStatusChipClass(status: RsvcJob["status"]): string {
  if (status === "착수전") return "text-gray-600 bg-gray-100";
  if (status === "시공중") return "text-brand bg-brand-subtle";
  return "text-[#0E9A96] bg-[#0E9A9614]";
}

export function reqUrgent(deadlineLabel: string): boolean {
  return deadlineLabel.startsWith("D-1") || deadlineLabel.startsWith("D-2");
}

export function reqInfoRows(req: BidReq): { k: string; v: string }[] {
  return req.type === "general"
    ? [
        { k: "요청 유형", v: "일반입찰" },
        { k: "희망 시공일", v: formatDesiredDateLabel(req.desiredDate) },
        { k: "검색 조건", v: req.budgetLabel },
        { k: "마감", v: req.deadlineLabel },
      ]
    : [
        { k: "요청 유형", v: "전문가추천" },
        { k: "희망 시공일", v: formatDesiredDateLabel(req.desiredDate) },
        { k: "카테고리", v: req.category ?? "-" },
        { k: "예산", v: req.budgetLabel },
        { k: "마감", v: req.deadlineLabel },
      ];
}

export function itemSummary(items: { name: string }[]): string {
  return items.map((it) => it.name).join(" · ");
}
