// PT-RSVC-01~13 예약시공관리(입찰) 상태 컨테이너 - 입찰함↔요청상세↔입찰참여/추천안작성 및 시공대기↔착수↔완료↔일정변경 흐름을 엮음
// 입찰함(신규 요청 목록)·입찰 참여·추천안 작성/제출·상품 카탈로그·시공 착수/완료·해피콜 이력 모두 실API 연동.
// 일정변경 요청만 아직 백엔드 모델이 없어 로컬 state 목업으로 시연
import { useEffect, useState } from "react";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../components/ui/useToast";
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
  getBidJobs,
  getCallLogs,
  updateReservationProgress,
  type CallLog,
} from "../../api/reservations";
import { CAR_INST_TO_PROD_CAT, POS_NAMES, buildPlanDraft, mapBidJob, mapBidRequest, posNameToCode } from "./rsvcData";
import type { BidReq, JobStatus, PlanLine, RsvcJob, RsvcProduct } from "./rsvcTypes";
import RsvcMainScreen from "./RsvcMainScreen";
import RsvcWaitlistScreen from "./RsvcWaitlistScreen";
import RsvcCallLogSheet, { type CallResult } from "./RsvcCallLogSheet";
import RsvcBidboxScreen, { type BidTab } from "./RsvcBidboxScreen";
import RsvcReqDetailScreen from "./RsvcReqDetailScreen";
import RsvcBidJoinScreen from "./RsvcBidJoinScreen";
import RsvcPlanWriteScreen from "./RsvcPlanWriteScreen";
import RsvcPlanSearchScreen from "./RsvcPlanSearchScreen";
import RsvcPlanPosSheet from "./RsvcPlanPosSheet";
import RsvcPickResultScreen from "./RsvcPickResultScreen";
import RsvcStartSheet from "./RsvcStartSheet";
import RsvcBidSubmitConfirmSheet from "./RsvcBidSubmitConfirmSheet";
import RsvcDoneScreen from "./RsvcDoneScreen";
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
  | "resched";

interface RsvcFlowProps {
  onExit: () => void;
  onOpenStl: () => void;
  onOpenMyPage: () => void;
  initialScreen?: "main" | "waitlist" | "bidbox";
  initialBidTab?: BidTab;
}

export default function RsvcFlow({ onExit, onOpenStl, onOpenMyPage, initialScreen = "main", initialBidTab = "new" }: RsvcFlowProps) {
  const { toast, showToast } = useToast();

  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [sheet, setSheet] = useState<"callLog" | "start" | "bidSubmit" | null>(null);
  const [startingJob, setStartingJob] = useState(false);
  const [completingJob, setCompletingJob] = useState(false);

  const [reqs, setReqs] = useState<BidReq[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(true);
  const [shopCode, setShopCode] = useState("");
  const [jobs, setJobs] = useState<RsvcJob[]>([]);
  const [activeReqId, setActiveReqId] = useState("");
  const [activeJobId, setActiveJobId] = useState("");

  useEffect(() => {
    Promise.all([
      getMyBidRequests(),
      getCommonCodeDetails("CAR_BRAND"),
      getCommonCodeDetails("CAR_MODEL"),
      getMyShop(),
      getBidJobs(),
    ])
      .then(([rows, carBrandCodes, carModelCodes, shop, bidJobs]) => {
        // 차종 코드 -> 한글 라벨(예: "벤츠 E-Class" 또는 세부차종명이 있으면 "벤츠 E-Class E 200"), apps/customer-app의 carLabel과 동일 방식
        const carLabel = (car: ShopBidRequestCarApi | null): string | null => {
          if (!car) return null;
          const brand = carBrandCodes.find((d: CommonCodeDetailApi) => d.detailCode === car.carBrandCode)?.detailName ?? car.carBrandCode;
          const model = carModelCodes.find((d: CommonCodeDetailApi) => d.detailCode === car.carModelCode)?.detailName ?? car.carModelCode;
          return car.trimName ? `${brand} ${model} ${car.trimName}` : `${brand} ${model}`;
        };
        setReqs(rows.map((r) => mapBidRequest(r, carLabel)));
        setShopCode(shop.shopCode);
        setJobs(bidJobs.map((j) => mapBidJob(j, carLabel)));
      })
      .catch((err) => showToast(err instanceof Error ? err.message : "입찰함을 불러오지 못했습니다", "danger"))
      .finally(() => setLoadingReqs(false));
  }, []);

  const [bidTab, setBidTab] = useState<BidTab>(initialBidTab);
  const [waitlistTab, setWaitlistTab] = useState<JobStatus>("착수전");
  const [bidPrices, setBidPrices] = useState<Record<string, string>>({}); // key=instCode — 시공 항목별 견적가
  const [bidMemo, setBidMemo] = useState("");
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [bidTime, setBidTime] = useState(""); // 선택한 시공 가능 시간("HH:mm") — 고객 희망일(req.desiredDate) 기준 업체 실제 스케줄에서 선택
  const [daySlots, setDaySlots] = useState<DailySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

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
  const [dropOpenIndex, setDropOpenIndex] = useState<number | null>(null);
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
  // 시공 대기 목록 로딩 중이거나 0건일 때의 안전 기본값(실제 화면 전환은 openJob을 거쳐야만 발생하므로 도달하지 않음)
  const emptyJob: RsvcJob = {
    id: "",
    requestNo: "",
    customer: "",
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
    reschedDt: "",
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

  const openReq = (req: BidReq) => {
    setActiveReqId(req.id);
    setScreen("reqdetail");
  };

  // 입찰 참여(수정) 화면 진입 — 이미 제출한 입찰이 있으면(myOffer) 기존값을 채워 수정 모드로 열고,
  // 고객 희망일(req.desiredDate) 기준 내 업체의 실제 예약 가능 시간대를 조회
  const openBidJoin = (req: BidReq) => {
    setBidPrices(req.myOffer?.prices ?? {});
    setBidMemo(req.myOffer?.memo ?? "");
    setBidTime(req.myOffer?.time ?? "");
    setDaySlots([]);
    setScreen("bidjoin");
    setLoadingSlots(true);
    getDailySchedule(shopCode, req.desiredDate)
      .then((schedule) => setDaySlots(schedule.slots))
      .catch((err) => showToast(err instanceof Error ? err.message : "시공 가능 시간을 불러오지 못했습니다", "danger"))
      .finally(() => setLoadingSlots(false));
  };

  const openJob = (job: RsvcJob) => {
    setActiveJobId(job.id);
    if (job.status === "착수전") {
      setSheet("start");
    } else if (job.status === "시공중") {
      setScreen("done");
    } else {
      showToast("이미 완료된 건이에요");
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

  // 추천안 작성 화면 진입 — 요청 항목별 실 카탈로그(GET /products)를 조회해 초안을 만들고,
  // 고객 희망일(req.desiredDate) 기준 내 업체의 실제 예약 가능 시간대도 함께 조회(RsvcBidJoinScreen과 동일 패턴)
  const openPlan = (reqId: string) => {
    const req = reqs.find((r) => r.id === reqId);
    if (!req) return;
    setActiveReqId(reqId);
    setPlanMemo(req.myPlan?.reason ?? "");
    setPlanTime(req.myPlan?.scheduledTime ?? "");
    setDropOpenIndex(null);
    setPlanPosIdx(null);
    setPlanSearchIdx(null);
    setPlanDraft([]);
    setDaySlots([]);
    setScreen("planwrite");

    const instCodes = [...new Set(req.items.map((it) => it.instCode).filter((c): c is string => !!c))];
    setLoadingSlots(true);
    Promise.all([
      Promise.all(instCodes.map((code) => getProducts(CAR_INST_TO_PROD_CAT[code] ?? code))),
      getDailySchedule(shopCode, req.desiredDate),
    ])
      .then(([productLists, schedule]) => {
        const byInstCode: Record<string, RsvcProduct[]> = {};
        instCodes.forEach((code, i) => (byInstCode[code] = productLists[i]));
        setProductsByInstCode(byInstCode);
        setPlanDraft(buildPlanDraft(req, byInstCode));
        setDaySlots(schedule.slots);
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

  const activeGeneralCount = reqs.filter((r) => r.type === "general" && r.status === "active").length + 1;
  // "착수전·시공중 건"만 시공 대기로 집계(완료 건은 제외) — jobStatusChipClass 라벨과 동일 기준
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
          onCall={openCallLog}
          onResched={(job) => {
            setActiveJobId(job.id);
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
          bidPrices={bidPrices}
          onChangePrice={(instCode, value) => setBidPrices((prev) => ({ ...prev, [instCode]: value }))}
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
          dropOpenIndex={dropOpenIndex}
          onToggleDropdown={(i) => setDropOpenIndex((prev) => (prev === i ? null : i))}
          onPickProduct={(i, productCode) => {
            pickProduct(i, productCode);
            setDropOpenIndex(null);
          }}
          onOpenSearch={(i) => {
            setPlanSearchIdx(i);
            setPlanSearch("");
            setPlanBrand("all");
            setScreen("plansearch");
          }}
          onOpenPos={(i) => setPlanPosIdx(i)}
          onChangeOffer={(i, value) => setLine(i, { offer: value })}
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
              const tintLine = planDraft.find((ln) => ln.instCode === "TINT");
              const positions = tintLine
                ? POS_NAMES.filter((n) => !tintLine.posOff[n]).map((n) => ({
                    position: posNameToCode(n),
                    level: tintLine.posLevels[n] ?? "15",
                  }))
                : undefined;
              await submitBidPlan(curReq.id, {
                items: planDraft.map((ln) => ({
                  instCode: ln.instCode,
                  productCode: ln.productCode,
                  productName: ln.productName,
                  retailPrice: ln.retailPrice,
                  offerPrice: Number(ln.offer) || 0,
                })),
                positions,
                scheduledTime: planTime,
                reason: planMemo,
              });
              patchReq(curReq.id, {
                status: "active",
                myPlan: {
                  planNo: curReq.myPlan?.planNo ?? "",
                  items: planDraft.map((ln) => ({ name: ln.name, spec: ln.productName, instCode: ln.instCode })),
                  totalOffer: planDraft.reduce((sum, ln) => sum + (Number(ln.offer) || 0), 0),
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

      {screen === "resched" && (
        <RsvcReschedScreen
          job={curJob}
          onChangeReason={(reschedReason) => patchJob(curJob.id, { reschedReason })}
          onChangeDt={(reschedDt) => patchJob(curJob.id, { reschedDt })}
          onBack={() => setScreen("waitlist")}
          onSubmit={() => {
            patchJob(curJob.id, { reschedStatus: "sent" });
            showToast("일정 변경을 요청했어요. 고객 확인 후 확정돼요", "success");
          }}
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
            const first = posLine.posLevels[POS_NAMES[0]] ?? "15";
            setLine(
              planPosIdx,
              next
                ? { posBulk: true, posLevels: POS_NAMES.reduce<Record<string, string>>((acc, n) => ((acc[n] = first), acc), {}) }
                : { posBulk: false },
            );
          }}
          onClose={() => setPlanPosIdx(null)}
          onDone={() => setPlanPosIdx(null)}
        />
      )}

      {sheet === "callLog" && (
        <RsvcCallLogSheet
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
                scheduledTime: bidTime,
                memo: bidMemo.trim() || undefined,
              });
              patchReq(curReq.id, {
                status: "active",
                myOffer: { prices: { ...bidPrices }, time: bidTime, memo: bidMemo },
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

      {toast && (
        <div className="absolute inset-x-0 bottom-10 z-[90] flex justify-center px-6">
          <Toast tone={toast.tone}>{toast.message}</Toast>
        </div>
      )}
    </div>
  );
}
