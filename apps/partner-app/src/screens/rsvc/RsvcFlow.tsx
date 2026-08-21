// PT-RSVC-01~13 예약시공관리(입찰) 상태 컨테이너 - 입찰함↔요청상세↔입찰참여/추천안작성 및 시공현황↔착수↔완료↔일정변경 흐름을 엮음
// 입찰함(신규 요청 목록)·입찰 참여·추천안 작성/제출·상품 카탈로그·시공 착수/완료·해피콜 이력 모두 실API 연동.
// 일정변경 요청만 아직 백엔드 모델이 없어 로컬 state 목업으로 시연
import { useEffect, useRef, useState } from "react";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../components/ui/useToast";
import { pushBackAction } from "../../native/backHandler";
import { getMyBidRequests, type ShopBidRequestCarApi } from "../../api/bidRequests";
import { submitBidPlan } from "../../api/bidPlans";
import { getCommonCodeDetails, type CommonCodeDetailApi } from "../../api/commonCodes";
import { getProducts } from "../../api/products";
import { getMyShop } from "../../api/shops";
import { getDailySchedule, type DailySlot } from "../../api/shopSchedule";
import { submitBidOffer } from "../../api/bidOffers";
import {
  addCallLog,
  completeReservationJob,
  getBidJobDetail,
  getBidJobs,
  getCallLogs,
  updateReservationProgress,
  requestResched,
  type BidJobDetail,
  type CallLog,
} from "../../api/reservations";
import { CAR_INST_TO_PROD_CAT, POS_NAMES, buildPlanDraft, mapBidJob, mapBidRequest, posNameToCode } from "./rsvcData";
import type { BidReq, JobStatus, PlanLine, RsvcJob, RsvcProduct } from "./rsvcTypes";
import RsvcMainScreen from "./RsvcMainScreen";
import RsvcWaitlistScreen from "./RsvcWaitlistScreen";
import CallLogSheet, { type CallResult } from "../../components/ui/CallLogSheet";
import RsvcBidboxScreen, { type BidTab } from "./RsvcBidboxScreen";
import RsvcReqDetailScreen from "./RsvcReqDetailScreen";
import RsvcBidJoinScreen from "./RsvcBidJoinScreen";
import RsvcPlanWriteScreen from "./RsvcPlanWriteScreen";
import RsvcPlanSearchScreen from "./RsvcPlanSearchScreen";
import RsvcPlanPosSheet from "./RsvcPlanPosSheet";
import RsvcPickResultScreen from "./RsvcPickResultScreen";
import RsvcStartSheet from "./RsvcStartSheet";
import RsvcBidSubmitConfirmSheet from "./RsvcBidSubmitConfirmSheet";
import RsvcDatePickSheet from "./RsvcDatePickSheet";
import RsvcDoneScreen from "./RsvcDoneScreen";
import RsvcHandoverScreen from "./RsvcHandoverScreen";
import RsvcReschedScreen from "./RsvcReschedScreen";

type Screen =
  | "main"
  | "waitlist"
  | "bidbox"
  | "reqdetail"
  | "bidjoin"
  | "planwrite"
  | "plansearch"
  | "pickresult"
  | "done"
  | "handover"
  | "resched";

interface RsvcFlowProps {
  onExit: () => void;
  onOpenStl: () => void;
  onOpenMyPage: () => void;
  initialScreen?: "main" | "waitlist" | "bidbox";
  initialBidTab?: BidTab;
  /** 홈 "오늘의 시공 일정"에서 특정 예약을 바로 열 때만 값이 전달됨 — 있으면 목록 진입 직후 그 건을 바로 연다 */
  initialReservationNo?: string;
  /** 푸시 알림 탭(입찰안내/낙찰/미선정) — 있으면 목록 진입 직후 해당 요청 상세(reqdetail)를 바로 연다 */
  targetRequestNo?: string;
}

export default function RsvcFlow({
  onExit,
  onOpenStl,
  onOpenMyPage,
  initialScreen = "main",
  initialBidTab = "new",
  initialReservationNo,
  targetRequestNo,
}: RsvcFlowProps) {
  const { toast, showToast } = useToast();

  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [sheet, setSheet] = useState<"callLog" | "start" | "bidSubmit" | "datePick" | "reschedDatePick" | null>(null);
  const [startingJob, setStartingJob] = useState(false);
  const [completingJob, setCompletingJob] = useState(false);

  const [reqs, setReqs] = useState<BidReq[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(true);
  const [shopCode, setShopCode] = useState("");
  const [carBrandCodes, setCarBrandCodes] = useState<CommonCodeDetailApi[]>([]);
  const [carModelCodes, setCarModelCodes] = useState<CommonCodeDetailApi[]>([]);
  // 추천안 작성(PT-RSVC-07) 시공항목 정렬 순서 — admin-app 시공항목 관리(AD-CTLG-03)에 등록된 순서를 그대로 따름
  const [carInstCodes, setCarInstCodes] = useState<CommonCodeDetailApi[]>([]);
  const [jobs, setJobs] = useState<RsvcJob[]>([]);
  const [activeReqId, setActiveReqId] = useState("");
  const [activeJobId, setActiveJobId] = useState("");

  useEffect(() => {
    Promise.all([
      getMyBidRequests(),
      getCommonCodeDetails("CAR_BRAND"),
      getCommonCodeDetails("CAR_MODEL"),
      getCommonCodeDetails("CAR_INST"),
      getMyShop(),
      getBidJobs(),
    ])
      .then(([rows, carBrandCodes, carModelCodes, carInstCodes, shop, bidJobs]) => {
        // 차종 코드 -> 한글 라벨(예: "벤츠 E-Class" 또는 세부차종명이 있으면 "벤츠 E-Class E 200"), apps/customer-app의 carLabel과 동일 방식
        const carLabel = (car: ShopBidRequestCarApi | null): string | null => {
          if (!car) return null;
          const brand = carBrandCodes.find((d: CommonCodeDetailApi) => d.detailCode === car.carBrandCode)?.detailName ?? car.carBrandCode;
          const model = carModelCodes.find((d: CommonCodeDetailApi) => d.detailCode === car.carModelCode)?.detailName ?? car.carModelCode;
          return car.trimName ? `${brand} ${model} ${car.trimName}` : `${brand} ${model}`;
        };
        const mappedReqs = rows.map((r) => mapBidRequest(r, carLabel));
        setReqs(mappedReqs);
        setShopCode(shop.shopCode);
        setCarBrandCodes(carBrandCodes);
        setCarModelCodes(carModelCodes);
        setCarInstCodes(carInstCodes);
        const mappedJobs = bidJobs.map((j) => mapBidJob(j, carLabel));
        setJobs(mappedJobs);
        // 홈 "오늘의 시공 일정"에서 진입한 경우 목록 대신 그 건을 바로 연다(착수전이면 착수 시트, 시공중이면 완료 화면)
        if (initialReservationNo) {
          const target = mappedJobs.find((j) => j.id === initialReservationNo);
          if (target) openJob(target);
        }
        // 푸시 알림 탭(입찰안내/낙찰/미선정) — 해당 요청 상세를 바로 연다
        if (targetRequestNo) {
          const targetReq = mappedReqs.find((r) => r.id === targetRequestNo);
          if (targetReq) openReq(targetReq);
        }
      })
      .catch((err) => showToast(err instanceof Error ? err.message : "입찰함을 불러오지 못했습니다", "danger"))
      .finally(() => setLoadingReqs(false));
  }, []);

  // 입찰함(bidbox) 등 다른 화면에서 뒤로가기로 예약시공관리 홈(main)에 다시 들어올 때마다 입찰함·시공 현황 목록을
  // 새로 조회 — 마운트 시 최초 조회는 위 effect가 이미 하므로 여기서는 "main으로 되돌아온" 경우만 처리한다
  const prevRsvcScreenRef = useRef(screen);
  useEffect(() => {
    const prevScreen = prevRsvcScreenRef.current;
    prevRsvcScreenRef.current = screen;
    if (screen !== "main" || prevScreen === "main" || carBrandCodes.length === 0) return;
    const carLabel = (car: ShopBidRequestCarApi | null): string | null => {
      if (!car) return null;
      const brand = carBrandCodes.find((d) => d.detailCode === car.carBrandCode)?.detailName ?? car.carBrandCode;
      const model = carModelCodes.find((d) => d.detailCode === car.carModelCode)?.detailName ?? car.carModelCode;
      return car.trimName ? `${brand} ${model} ${car.trimName}` : `${brand} ${model}`;
    };
    Promise.all([getMyBidRequests(), getBidJobs()])
      .then(([rows, bidJobs]) => {
        setReqs(rows.map((r) => mapBidRequest(r, carLabel)));
        setJobs(bidJobs.map((j) => mapBidJob(j, carLabel)));
      })
      .catch((err) => showToast(err instanceof Error ? err.message : "목록을 다시 불러오지 못했습니다", "danger"));
  }, [screen, carBrandCodes, carModelCodes]);

  const [bidTab, setBidTab] = useState<BidTab>(initialBidTab);
  const [waitlistTab, setWaitlistTab] = useState<JobStatus>("착수전");
  const [bidPrices, setBidPrices] = useState<Record<string, string>>({}); // key=instCode — 시공 항목별 견적가
  const [bidMemo, setBidMemo] = useState("");
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [bidTime, setBidTime] = useState(""); // 선택한 시공 가능 시간("HH:mm") — schedDate 기준 업체 실제 스케줄에서 선택
  const [daySlots, setDaySlots] = useState<DailySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  // 시공 가능 시간 조회 기준 날짜 — 기본은 고객 희망일(req.desiredDate), 그 날짜에 슬롯이 없으면 파트너가 직접 다른 날짜로 변경 가능(bidjoin·planwrite 공용, 2026-08-14 추가)
  const [schedDate, setSchedDate] = useState("");
  const [datePickYear, setDatePickYear] = useState(new Date().getFullYear());
  const [datePickMonth, setDatePickMonth] = useState(new Date().getMonth() + 1);

  // PT-RSVC-12 일정변경 요청 작성 — 화면 진입 시마다 빈 값으로 시작(이전에 거절된 요청이 있어도 새로 작성)
  const [reschedReasonDraft, setReschedReasonDraft] = useState("");
  const [reschedDateDraft, setReschedDateDraft] = useState("");
  const [reschedTimeDraft, setReschedTimeDraft] = useState("");
  const [reschedDaySlots, setReschedDaySlots] = useState<DailySlot[]>([]);
  const [loadingReschedSlots, setLoadingReschedSlots] = useState(false);
  const [reschedDatePickYear, setReschedDatePickYear] = useState(new Date().getFullYear());
  const [reschedDatePickMonth, setReschedDatePickMonth] = useState(new Date().getMonth() + 1);
  const [submittingResched, setSubmittingResched] = useState(false);

  const [jobDetail, setJobDetail] = useState<BidJobDetail | null>(null);
  const [loadingJobDetail, setLoadingJobDetail] = useState(false);

  const [callResult, setCallResult] = useState<CallResult>("CONNECTED");
  const [callMemo, setCallMemo] = useState("");
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loadingCallLogs, setLoadingCallLogs] = useState(false);
  const [savingCallLog, setSavingCallLog] = useState(false);

  const [planDraft, setPlanDraft] = useState<PlanLine[]>([]);
  const [productsByInstCode, setProductsByInstCode] = useState<Record<string, RsvcProduct[]>>({});
  const [planMemo, setPlanMemo] = useState("");
  const [planTime, setPlanTime] = useState(""); // 선택한 시공 가능 시간("HH:mm") — bidTime과 동일하게 실제 스케줄에서 선택
  const [submittingPlan, setSubmittingPlan] = useState(false);
  const [planSearchIdx, setPlanSearchIdx] = useState<number | null>(null);
  const [planSearch, setPlanSearch] = useState("");
  const [planBrand, setPlanBrand] = useState("all");
  const [planPosIdx, setPlanPosIdx] = useState<number | null>(null);

  // 입찰함 로딩 중이거나 의뢰받은 요청이 0건일 때의 안전 기본값(실제 화면 전환은 openReq를 거쳐야만 발생하므로 도달하지 않음)
  const emptyReq: BidReq = {
    id: "",
    type: "general",
    customer: "",
    car: "",
    distance: "-",
    items: [],
    budgetLabel: "",
    deadlineLabel: "",
    desiredDate: "",
    status: "open",
  };
  // 시공 현황 로딩 중이거나 0건일 때의 안전 기본값(실제 화면 전환은 openJob을 거쳐야만 발생하므로 도달하지 않음)
  const emptyJob: RsvcJob = {
    id: "",
    requestNo: "",
    customer: "",
    phone: null,
    car: "",
    vin: "",
    status: "착수전",
    schedule: "",
    items: [],
    doneCheck: {},
    photos: [],
    memo: "",
    reschedStatus: "none",
    reschedReason: "",
    reschedDate: "",
    reschedTime: "",
    reschedRejectReason: "",
  };
  const curReq = reqs.find((r) => r.id === activeReqId) ?? reqs[0] ?? emptyReq;
  const curJob = jobs.find((j) => j.id === activeJobId) ?? jobs[0] ?? emptyJob;

  const patchJob = (id: string, patch: Partial<RsvcJob>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  };
  const patchReq = (id: string, patch: Partial<BidReq>) => {
    setReqs((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };
  const setLine = (i: number, patch: Partial<PlanLine>) => {
    setPlanDraft((prev) => prev.map((ln, idx) => (idx === i ? { ...ln, ...patch } : ln)));
  };

  // 요청 상세 진입 — 고객이 요청한 제품의 참고 판매가를 보여주기 위해 실 카탈로그(GET /products)도 함께 조회해둔다
  // (요청 상세·입찰 참여·추천안 작성 화면이 모두 이 productsByInstCode를 공유해서 씀, 2026-08-14 요청으로 추가)
  const openReq = (req: BidReq) => {
    setActiveReqId(req.id);
    setScreen("reqdetail");
    const instCodes = [...new Set(req.items.map((it) => it.instCode).filter((c): c is string => !!c))];
    if (instCodes.length === 0) return;
    Promise.all(instCodes.map((code) => getProducts(CAR_INST_TO_PROD_CAT[code] ?? code)))
      .then((productLists) => {
        const byInstCode: Record<string, RsvcProduct[]> = {};
        instCodes.forEach((code, i) => (byInstCode[code] = productLists[i]));
        setProductsByInstCode(byInstCode);
      })
      .catch(() => {}); // 참고용 가격 표시라 실패해도 화면 진입을 막지 않고 조용히 무시
  };

  // 시공 가능 시간 조회 — 업체가 그 날짜에 휴무일이면 슬롯 템플릿과 무관하게 예약 불가이므로
  // 백엔드가 내려주는 isHoliday를 확인해 슬롯을 강제로 빈 목록으로 취급(2026-08-14 버그 리포트로 추가)
  const loadDailySlots = (date: string) => {
    setDaySlots([]);
    setLoadingSlots(true);
    getDailySchedule(shopCode, date)
      .then((schedule) => setDaySlots(schedule.isHoliday ? [] : schedule.slots))
      .catch((err) => showToast(err instanceof Error ? err.message : "시공 가능 시간을 불러오지 못했습니다", "danger"))
      .finally(() => setLoadingSlots(false));
  };

  // 입찰 참여(수정) 화면 진입 — 이미 제출한 입찰이 있으면(myOffer) 기존값을 채워 수정 모드로 열고,
  // 기준 날짜(이미 다른 날짜로 응찰했으면 그 날짜, 아니면 고객 희망일) 기준 내 업체의 실제 예약 가능 시간대를 조회
  const openBidJoin = (req: BidReq) => {
    setBidPrices(req.myOffer?.prices ?? {});
    setBidMemo(req.myOffer?.memo ?? "");
    setBidTime(req.myOffer?.time ?? "");
    const date = req.myOffer?.date ?? req.desiredDate;
    setSchedDate(date);
    setScreen("bidjoin");
    loadDailySlots(date);
  };

  // 시공 가능 시간이 없어 다른 날짜로 변경할 때 공용으로 사용 — bidjoin·planwrite 어느 화면에서 열었든 동일하게 동작
  const openDatePick = () => {
    const d = new Date(`${schedDate}T00:00:00`);
    setDatePickYear(d.getFullYear());
    setDatePickMonth(d.getMonth() + 1);
    setSheet("datePick");
  };

  const changeSchedDate = (newDate: string) => {
    setSchedDate(newDate);
    setBidTime("");
    setPlanTime("");
    setSheet(null);
    loadDailySlots(newDate);
  };

  // PT-RSVC-12 일정변경 요청 — 날짜 선택 캘린더를 열고, 날짜를 고르면 그 날짜의 실제 예약 가능 시간을 조회
  const openReschedDatePick = () => {
    const d = reschedDateDraft ? new Date(`${reschedDateDraft}T00:00:00`) : new Date();
    setReschedDatePickYear(d.getFullYear());
    setReschedDatePickMonth(d.getMonth() + 1);
    setSheet("reschedDatePick");
  };

  const selectReschedDate = (date: string) => {
    setReschedDateDraft(date);
    setReschedTimeDraft("");
    setSheet(null);
    setReschedDaySlots([]);
    setLoadingReschedSlots(true);
    getDailySchedule(shopCode, date)
      .then((schedule) => setReschedDaySlots(schedule.isHoliday ? [] : schedule.slots))
      .catch((err) => showToast(err instanceof Error ? err.message : "시공 가능 시간을 불러오지 못했습니다", "danger"))
      .finally(() => setLoadingReschedSlots(false));
  };

  const openJob = (job: RsvcJob) => {
    setActiveJobId(job.id);
    // 시공 현황으로 돌아갔을 때 이 job이 보이는 탭과 항상 맞춰둠(홈 "오늘의 시공 일정"처럼 목록을 거치지 않고
    // 바로 들어온 경우에도 완료 건이면 완료 탭이 보여야 함)
    setWaitlistTab(job.status);
    if (job.status === "착수전") {
      setSheet("start");
    } else if (job.status === "시공중") {
      setScreen("done");
    } else {
      // 완료건 — NcpkHandoverScreen과 동일한 패턴으로 첨부 사진·메모·인수확인 상태를 조회해 보여줌
      setScreen("handover");
      setJobDetail(null);
      setLoadingJobDetail(true);
      getBidJobDetail(job.id)
        .then(setJobDetail)
        .catch((err) => {
          showToast(err instanceof Error ? err.message : "시공 상세를 불러오지 못했어요", "danger");
          setScreen("waitlist");
        })
        .finally(() => setLoadingJobDetail(false));
    }
  };

  // 해피콜 이력 저장 시트 진입 — 열 때마다 그 job의 최신 이력을 다시 조회
  const openCallLog = (job: RsvcJob) => {
    setActiveJobId(job.id);
    setSheet("callLog");
    setCallLogs([]);
    setLoadingCallLogs(true);
    getCallLogs(job.id)
      .then(setCallLogs)
      .catch((err) => showToast(err instanceof Error ? err.message : "해피콜 이력을 불러오지 못했어요", "danger"))
      .finally(() => setLoadingCallLogs(false));
  };

  // 해피콜 버튼 탭 — 실제 전화 앱을 열고, 통화 후 파트너앱으로 돌아오면(탭이 다시 보이는 시점을 통화 종료로 간주)
  // 이력 저장 팝업을 자동으로 띄운다. 웹 환경이라 실제 통화 종료 이벤트를 받을 방법이 없어 근사치로 처리
  const [pendingCallJob, setPendingCallJob] = useState<RsvcJob | null>(null);
  const startCall = (job: RsvcJob) => {
    if (!job.phone) {
      showToast("등록된 연락처가 없어요", "danger");
      return;
    }
    setPendingCallJob(job);
    window.location.href = `tel:${job.phone}`;
  };
  useEffect(() => {
    if (!pendingCallJob) return;
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      const job = pendingCallJob;
      setPendingCallJob(null);
      openCallLog(job);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [pendingCallJob]);

  // 추천안 작성 화면 진입 — 요청 항목별 실 카탈로그(GET /products)를 조회해 초안을 만들고,
  // 기준 날짜(이미 다른 날짜로 추천했으면 그 날짜, 아니면 고객 희망일) 기준 내 업체의 실제 예약 가능 시간대도 함께 조회(RsvcBidJoinScreen과 동일 패턴)
  const openPlan = (reqId: string) => {
    const req = reqs.find((r) => r.id === reqId);
    if (!req) return;
    setActiveReqId(reqId);
    setPlanMemo(req.myPlan?.reason ?? "");
    setPlanTime(req.myPlan?.scheduledTime ?? "");
    const date = req.myPlan?.scheduledDate ?? req.desiredDate;
    setSchedDate(date);
    setPlanPosIdx(null);
    setPlanSearchIdx(null);
    setPlanDraft([]);
    setDaySlots([]);
    setScreen("planwrite");

    const instCodes = [...new Set(req.items.map((it) => it.instCode).filter((c): c is string => !!c))];
    setLoadingSlots(true);
    Promise.all([
      Promise.all(instCodes.map((code) => getProducts(CAR_INST_TO_PROD_CAT[code] ?? code))),
      getDailySchedule(shopCode, date),
    ])
      .then(([productLists, schedule]) => {
        const byInstCode: Record<string, RsvcProduct[]> = {};
        instCodes.forEach((code, i) => (byInstCode[code] = productLists[i]));
        setProductsByInstCode(byInstCode);
        setPlanDraft(buildPlanDraft(req, byInstCode, carInstCodes.map((c) => c.detailCode)));
        setDaySlots(schedule.isHoliday ? [] : schedule.slots);
      })
      .catch((err) => showToast(err instanceof Error ? err.message : "추천안 작성 정보를 불러오지 못했습니다", "danger"))
      .finally(() => setLoadingSlots(false));
  };

  const pickProduct = (i: number, productCode: string) => {
    const line = planDraft[i];
    const p = (productsByInstCode[line.instCode] ?? []).find((x) => x.productCode === productCode);
    if (!p) return;
    setLine(i, {
      productCode: p.productCode,
      productName: p.name,
      retailPrice: p.price,
      offer: String(Math.round((p.price * 0.9) / 10000) * 10000),
    });
  };

  const posLine = planPosIdx != null ? planDraft[planPosIdx] : null;

  // 하드웨어 백버튼: 화면 상단 '‹' 버튼의 onBack과 동일한 대상으로 이동. 루트 화면(main)에서는 등록하지 않아
  // 상위(App.tsx)의 "홈으로" 처리로 자연스럽게 넘어감
  useEffect(() => {
    if (planPosIdx != null) return pushBackAction(() => setPlanPosIdx(null));
    if (sheet) return pushBackAction(() => setSheet(null));
    switch (screen) {
      case "waitlist":
      case "bidbox":
        return pushBackAction(() => setScreen("main"));
      case "reqdetail":
        return pushBackAction(() => setScreen("bidbox"));
      case "bidjoin":
      case "planwrite":
        return pushBackAction(() => setScreen("reqdetail"));
      case "plansearch":
        return pushBackAction(() => setScreen("planwrite"));
      case "pickresult":
        return pushBackAction(() => setScreen("bidbox"));
      case "done":
      case "handover":
      case "resched":
        return pushBackAction(() => setScreen("waitlist"));
      default:
        return;
    }
  }, [screen, sheet, planPosIdx]);

  const activeGeneralCount = reqs.filter((r) => r.type === "general" && r.status === "active").length + 1;
  // "착수전·시공중 건"만 시공 현황으로 집계(완료 건은 제외) — jobStatusChipClass 라벨과 동일 기준
  const waitingJobs = jobs.filter((j) => j.status !== "완료");
  const waitlistTabCounts: Record<JobStatus, number> = { 착수전: 0, 시공중: 0, 완료: 0 };
  for (const j of jobs) waitlistTabCounts[j.status] += 1;
  const visibleWaitlistJobs = jobs.filter((j) => j.status === waitlistTab);

  return (
    <div className="absolute inset-0 bg-gray-50">
      {screen === "main" && (
        <RsvcMainScreen
          newReqCount={reqs.filter((r) => r.status === "open").length}
          bidTotalCount={reqs.filter((r) => r.status !== "closed").length}
          jobTotalCount={waitingJobs.length}
          jobPreview={waitingJobs.slice(0, 2)}
          onOpenBidbox={() => {
            setBidTab("new");
            setScreen("bidbox");
          }}
          onOpenWaitlist={() => setScreen("waitlist")}
          onOpenJob={openJob}
          onOpenHome={onExit}
          onOpenStl={onOpenStl}
          onOpenMyPage={onOpenMyPage}
          onPlaceholder={(label) => showToast(`${label}으로 이동해요`)}
        />
      )}

      {screen === "waitlist" && (
        <RsvcWaitlistScreen
          jobs={visibleWaitlistJobs}
          tab={waitlistTab}
          onChangeTab={setWaitlistTab}
          tabCounts={waitlistTabCounts}
          onBack={() => setScreen("main")}
          onOpenJob={openJob}
          onCall={startCall}
          onResched={(job) => {
            setActiveJobId(job.id);
            setReschedReasonDraft("");
            setReschedDateDraft("");
            setReschedTimeDraft("");
            setReschedDaySlots([]);
            setScreen("resched");
          }}
          onOpenHome={onExit}
          onOpenStl={onOpenStl}
          onOpenMyPage={onOpenMyPage}
          onPlaceholder={(label) => showToast(`${label}으로 이동해요`)}
        />
      )}

      {screen === "bidbox" && (
        <RsvcBidboxScreen
          reqs={reqs}
          loading={loadingReqs}
          tab={bidTab}
          onChangeTab={setBidTab}
          onBack={() => setScreen("main")}
          onOpenReq={openReq}
        />
      )}

      {screen === "reqdetail" && (
        <RsvcReqDetailScreen
          req={curReq}
          productsByInstCode={productsByInstCode}
          onBack={() => setScreen("bidbox")}
          onGoResult={() => setScreen("pickresult")}
          onGoBidJoin={() => openBidJoin(curReq)}
          onGoPlanWrite={() => openPlan(curReq.id)}
        />
      )}

      {screen === "bidjoin" && (
        <RsvcBidJoinScreen
          req={curReq}
          activeGeneralCount={activeGeneralCount}
          productsByInstCode={productsByInstCode}
          bidPrices={bidPrices}
          onChangePrice={(instCode, value) => setBidPrices((prev) => ({ ...prev, [instCode]: value }))}
          schedDate={schedDate}
          onChangeDate={openDatePick}
          daySlots={daySlots}
          loadingSlots={loadingSlots}
          bidTime={bidTime}
          onChangeBidTime={setBidTime}
          bidMemo={bidMemo}
          onChangeBidMemo={setBidMemo}
          onBack={() => setScreen("reqdetail")}
          onSubmit={() => setSheet("bidSubmit")}
        />
      )}

      {screen === "planwrite" && (
        <RsvcPlanWriteScreen
          req={curReq}
          draft={planDraft}
          productsByInstCode={productsByInstCode}
          onOpenSearch={(i) => {
            setPlanSearchIdx(i);
            setPlanSearch("");
            setPlanBrand("all");
            setScreen("plansearch");
          }}
          onOpenPos={(i) => setPlanPosIdx(i)}
          onChangeOffer={(i, value) => setLine(i, { offer: value })}
          schedDate={schedDate}
          onChangeDate={openDatePick}
          daySlots={daySlots}
          loadingSlots={loadingSlots}
          planTime={planTime}
          onChangePlanTime={setPlanTime}
          planMemo={planMemo}
          onChangePlanMemo={setPlanMemo}
          onBack={() => setScreen("reqdetail")}
          onSubmit={async () => {
            if (submittingPlan) return;
            setSubmittingPlan(true);
            try {
              // planReady(버튼 활성화 조건)가 이미 모든 라인의 productCode·켜진 부위의 농도 존재를 검증했으므로
              // non-null 단언 안전(부위·농도는 기본값이 없어 여기서 임의로 채우지 않음)
              const tintLine = planDraft.find((ln) => ln.instCode === "TINT");
              const positions = tintLine
                ? POS_NAMES.filter((n) => !tintLine.posOff[n]).map((n) => ({
                    position: posNameToCode(n),
                    level: tintLine.posLevels[n]!,
                  }))
                : undefined;
              await submitBidPlan(curReq.id, {
                items: planDraft.map((ln) => ({
                  instCode: ln.instCode,
                  productCode: ln.productCode!,
                  productName: ln.productName!,
                  retailPrice: ln.retailPrice!,
                  offerPrice: Number(ln.offer) || 0,
                })),
                positions,
                scheduledDate: schedDate,
                scheduledTime: planTime,
                reason: planMemo,
              });
              patchReq(curReq.id, {
                status: "active",
                myPlan: {
                  planNo: curReq.myPlan?.planNo ?? "",
                  items: planDraft.map((ln) => ({ name: ln.name, spec: ln.productName!, instCode: ln.instCode })),
                  totalOffer: planDraft.reduce((sum, ln) => sum + (Number(ln.offer) || 0), 0),
                  scheduledDate: schedDate,
                  scheduledTime: planTime,
                  reason: planMemo,
                },
              });
              setScreen("reqdetail");
              showToast("추천안이 제출되었어요", "success");
            } catch (err) {
              showToast(err instanceof Error ? err.message : "추천안 제출에 실패했습니다", "danger");
            } finally {
              setSubmittingPlan(false);
            }
          }}
        />
      )}

      {screen === "plansearch" && planSearchIdx != null && (
        <RsvcPlanSearchScreen
          itemName={planDraft[planSearchIdx].name}
          allProducts={productsByInstCode[planDraft[planSearchIdx].instCode] ?? []}
          selectedProductCode={planDraft[planSearchIdx].productCode}
          search={planSearch}
          onChangeSearch={setPlanSearch}
          brand={planBrand}
          onChangeBrand={setPlanBrand}
          onSelect={(p) => {
            pickProduct(planSearchIdx, p.productCode);
            setScreen("planwrite");
            showToast(`${p.brand} ${p.name} 선택됨`, "success");
          }}
          onBack={() => setScreen("planwrite")}
        />
      )}

      {screen === "pickresult" && (
        <RsvcPickResultScreen
          req={curReq}
          onBack={() => setScreen("bidbox")}
          onStartRegister={() => {
            const job = jobs.find((j) => j.requestNo === curReq.id);
            if (job) {
              openJob(job);
            } else {
              showToast("시공 건을 찾을 수 없어요. 잠시 후 다시 시도해 주세요", "danger");
            }
          }}
        />
      )}

      {screen === "done" && (
        <RsvcDoneScreen
          job={curJob}
          onToggleCheck={(i) => patchJob(curJob.id, { doneCheck: { ...curJob.doneCheck, [i]: !curJob.doneCheck[i] } })}
          onAddPhoto={(dataUri) =>
            curJob.photos.length < 10 && patchJob(curJob.id, { photos: [...curJob.photos, dataUri] })
          }
          onRemovePhoto={(i) => patchJob(curJob.id, { photos: curJob.photos.filter((_, idx) => idx !== i) })}
          onChangeMemo={(memo) => patchJob(curJob.id, { memo })}
          onBack={() => setScreen("waitlist")}
          onConfirm={async () => {
            if (completingJob || curJob.photos.length < 3) return;
            setCompletingJob(true);
            try {
              await completeReservationJob(curJob.id, { photos: curJob.photos, memo: curJob.memo.trim() || undefined });
              patchJob(curJob.id, { status: "완료" });
              setScreen("waitlist");
              showToast("완료 처리되었어요. 고객에게 인수확인을 요청했어요", "success");
            } catch (err) {
              showToast(err instanceof Error ? err.message : "완료 처리에 실패했습니다", "danger");
            } finally {
              setCompletingJob(false);
            }
          }}
          onError={(message) => showToast(message, "danger")}
        />
      )}

      {screen === "handover" && (
        <RsvcHandoverScreen
          job={jobDetail}
          loading={loadingJobDetail}
          onBack={() => setScreen("waitlist")}
          onRemind={() => showToast("인수확인 알림을 재발송했어요", "success")}
        />
      )}

      {screen === "resched" && (
        <RsvcReschedScreen
          job={curJob}
          reasonDraft={reschedReasonDraft}
          onChangeReason={setReschedReasonDraft}
          dateDraft={reschedDateDraft}
          onOpenDatePick={openReschedDatePick}
          timeDraft={reschedTimeDraft}
          onChangeTime={setReschedTimeDraft}
          daySlots={reschedDaySlots}
          loadingSlots={loadingReschedSlots}
          submitting={submittingResched}
          onBack={() => setScreen("waitlist")}
          onSubmit={async () => {
            if (submittingResched || !reschedReasonDraft || !reschedDateDraft || !reschedTimeDraft) return;
            setSubmittingResched(true);
            try {
              await requestResched(curJob.id, {
                date: reschedDateDraft,
                time: reschedTimeDraft,
                reason: reschedReasonDraft,
              });
              patchJob(curJob.id, {
                reschedStatus: "sent",
                reschedDate: reschedDateDraft,
                reschedTime: reschedTimeDraft,
                reschedReason: reschedReasonDraft,
                reschedRejectReason: "",
              });
              showToast("일정 변경을 요청했어요. 고객 확인 후 확정돼요", "success");
            } catch (err) {
              showToast(err instanceof Error ? err.message : "일정변경 요청에 실패했습니다", "danger");
            } finally {
              setSubmittingResched(false);
            }
          }}
        />
      )}

      {sheet === "reschedDatePick" && (
        <RsvcDatePickSheet
          shopCode={shopCode}
          year={reschedDatePickYear}
          month={reschedDatePickMonth}
          selectedDate={reschedDateDraft}
          onSelectDate={selectReschedDate}
          onPrevMonth={() =>
            setReschedDatePickMonth((m) => {
              if (m === 1) {
                setReschedDatePickYear((y) => y - 1);
                return 12;
              }
              return m - 1;
            })
          }
          onNextMonth={() =>
            setReschedDatePickMonth((m) => {
              if (m === 12) {
                setReschedDatePickYear((y) => y + 1);
                return 1;
              }
              return m + 1;
            })
          }
          onClose={() => setSheet(null)}
        />
      )}

      {planPosIdx != null && posLine && (
        <RsvcPlanPosSheet
          line={posLine}
          onTogglePos={(name) => setLine(planPosIdx, { posOff: { ...posLine.posOff, [name]: !posLine.posOff[name] } })}
          onSetLevel={(name, level) => {
            const next = posLine.posBulk
              ? POS_NAMES.reduce<Record<string, string>>((acc, n) => {
                  acc[n] = level;
                  return acc;
                }, {})
              : { ...posLine.posLevels, [name]: level };
            setLine(planPosIdx, { posLevels: next });
          }}
          onToggleBulk={() => {
            const next = !posLine.posBulk;
            // 기본 농도 없음 — 아직 아무 부위도 농도를 안 골랐으면 일괄 적용을 켜도 값 없이(미설정) 그대로 둠
            const first = posLine.posLevels[POS_NAMES[0]];
            setLine(
              planPosIdx,
              next
                ? {
                    posBulk: true,
                    posLevels: first
                      ? POS_NAMES.reduce<Record<string, string>>((acc, n) => ((acc[n] = first), acc), {})
                      : posLine.posLevels,
                  }
                : { posBulk: false },
            );
          }}
          onClose={() => setPlanPosIdx(null)}
          onDone={() => setPlanPosIdx(null)}
        />
      )}

      {sheet === "callLog" && (
        <CallLogSheet
          logs={callLogs}
          loadingLogs={loadingCallLogs}
          result={callResult}
          onChangeResult={setCallResult}
          memo={callMemo}
          onChangeMemo={setCallMemo}
          saving={savingCallLog}
          onClose={() => setSheet(null)}
          onSave={async () => {
            if (savingCallLog) return;
            setSavingCallLog(true);
            try {
              await addCallLog(curJob.id, { result: callResult, memo: callMemo.trim() || undefined });
              setSheet(null);
              setCallMemo("");
              showToast("해피콜 이력이 저장되었어요", "success");
            } catch (err) {
              showToast(err instanceof Error ? err.message : "해피콜 이력 저장에 실패했습니다", "danger");
            } finally {
              setSavingCallLog(false);
            }
          }}
        />
      )}

      {sheet === "start" && (
        <RsvcStartSheet
          infoRows={[
            { k: "고객", v: curJob.customer },
            { k: "차량", v: curJob.car },
            { k: "예약일시", v: curJob.schedule },
          ]}
          items={curJob.items}
          confirming={startingJob}
          onCancel={() => setSheet(null)}
          onConfirm={async () => {
            if (startingJob) return;
            setStartingJob(true);
            try {
              await updateReservationProgress(curJob.id, "IN_PROGRESS");
              patchJob(curJob.id, { status: "시공중" });
              setSheet(null);
              showToast("시공이 착수되었어요", "success");
            } catch (err) {
              showToast(err instanceof Error ? err.message : "시공 착수 처리에 실패했습니다", "danger");
            } finally {
              setStartingJob(false);
            }
          }}
        />
      )}

      {sheet === "bidSubmit" && (
        <RsvcBidSubmitConfirmSheet
          req={curReq}
          bidPrices={bidPrices}
          bidDate={schedDate}
          bidTime={bidTime}
          bidMemo={bidMemo}
          submitting={submittingOffer}
          onCancel={() => setSheet(null)}
          onConfirm={async () => {
            if (submittingOffer) return;
            setSubmittingOffer(true);
            try {
              await submitBidOffer(curReq.id, {
                items: curReq.items.map((it) => ({
                  instCode: it.instCode ?? "",
                  price: Number(bidPrices[it.instCode ?? ""]) || 0,
                })),
                scheduledDate: schedDate,
                scheduledTime: bidTime,
                memo: bidMemo.trim() || undefined,
              });
              patchReq(curReq.id, {
                status: "active",
                myOffer: { prices: { ...bidPrices }, date: schedDate, time: bidTime, memo: bidMemo },
              });
              setSheet(null);
              setScreen("reqdetail");
              showToast("입찰이 제출되었어요", "success");
            } catch (err) {
              showToast(err instanceof Error ? err.message : "입찰 제출에 실패했습니다", "danger");
            } finally {
              setSubmittingOffer(false);
            }
          }}
        />
      )}

      {sheet === "datePick" && (
        <RsvcDatePickSheet
          shopCode={shopCode}
          year={datePickYear}
          month={datePickMonth}
          selectedDate={schedDate}
          onSelectDate={changeSchedDate}
          onPrevMonth={() =>
            setDatePickMonth((m) => {
              if (m === 1) {
                setDatePickYear((y) => y - 1);
                return 12;
              }
              return m - 1;
            })
          }
          onNextMonth={() =>
            setDatePickMonth((m) => {
              if (m === 12) {
                setDatePickYear((y) => y + 1);
                return 1;
              }
              return m + 1;
            })
          }
          onClose={() => setSheet(null)}
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
