// PT-RSVC-01~13 예약시공관리(입찰) 상태 컨테이너 - 입찰함↔요청상세↔입찰참여/추천안작성 및 시공대기↔착수↔완료↔일정변경 흐름을 엮음
// 백엔드에 입찰/추천안 모델이 아직 없어(고객앱 rsv 플로우와 동일하게) 로컬 state 목업으로만 시연
import { useState } from "react";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../components/ui/useToast";
import { INITIAL_JOBS, INITIAL_REQS, POS_NAMES, buildPlanDraft, products } from "./rsvcData";
import type { BidReq, PlanLine, RsvcJob } from "./rsvcTypes";
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
type StartSource = "job" | "req";

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
  const [sheet, setSheet] = useState<"callLog" | "start" | null>(null);
  const [startSource, setStartSource] = useState<StartSource>("job");

  const [reqs, setReqs] = useState<BidReq[]>(INITIAL_REQS);
  const [jobs, setJobs] = useState<RsvcJob[]>(INITIAL_JOBS);
  const [activeReqId, setActiveReqId] = useState("q1");
  const [activeJobId, setActiveJobId] = useState("j1");

  const [bidTab, setBidTab] = useState<BidTab>(initialBidTab);
  const [bidAmount, setBidAmount] = useState("");
  const [bidMemo, setBidMemo] = useState("");
  const [bidDate, setBidDate] = useState("");

  const [callResult, setCallResult] = useState<CallResult>("connected");
  const [callMemo, setCallMemo] = useState("");

  const [planDraft, setPlanDraft] = useState<PlanLine[]>([]);
  const [planMemo, setPlanMemo] = useState("");
  const [dropOpenIndex, setDropOpenIndex] = useState<number | null>(null);
  const [planSearchIdx, setPlanSearchIdx] = useState<number | null>(null);
  const [planSearch, setPlanSearch] = useState("");
  const [planBrand, setPlanBrand] = useState("all");
  const [planPosIdx, setPlanPosIdx] = useState<number | null>(null);

  const curReq = reqs.find((r) => r.id === activeReqId) ?? reqs[0];
  const curJob = jobs.find((j) => j.id === activeJobId) ?? jobs[0];

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

  const openJob = (job: RsvcJob) => {
    setActiveJobId(job.id);
    if (job.status === "착수전") {
      setStartSource("job");
      setSheet("start");
    } else if (job.status === "시공중") {
      setScreen("done");
    } else {
      showToast("이미 완료된 건이에요");
    }
  };

  const openPlan = (reqId: string) => {
    const req = reqs.find((r) => r.id === reqId);
    if (!req) return;
    setActiveReqId(reqId);
    setPlanDraft(buildPlanDraft(req));
    setDropOpenIndex(null);
    setPlanPosIdx(null);
    setPlanSearchIdx(null);
    setScreen("planwrite");
  };

  const pickProduct = (i: number, productId: string) => {
    const line = planDraft[i];
    const p = products(line.name).find((x) => x.id === productId);
    if (!p) return;
    setLine(i, { productId: p.id, offer: String(Math.round((p.price * 0.9) / 10000) * 10000) });
  };

  const posLine = planPosIdx != null ? planDraft[planPosIdx] : null;

  const activeGeneralCount = reqs.filter((r) => r.type === "general" && r.status === "active").length + 1;

  const startCtx =
    startSource === "job"
      ? {
          infoRows: [
            { k: "고객", v: curJob.customer },
            { k: "차량", v: curJob.car },
            { k: "예약일시", v: curJob.schedule },
          ],
          items: curJob.items,
        }
      : {
          infoRows: [
            { k: "고객", v: curReq.customer },
            { k: "차량", v: curReq.car },
          ],
          items: curReq.items,
        };

  return (
    <div className="absolute inset-0 bg-gray-50">
      {screen === "main" && (
        <RsvcMainScreen
          newReqCount={reqs.filter((r) => r.status === "open").length}
          bidTotalCount={reqs.filter((r) => r.status !== "closed").length}
          jobTotalCount={jobs.length}
          jobPreview={jobs.slice(0, 2)}
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
          jobs={jobs}
          onBack={() => setScreen("main")}
          onOpenJob={openJob}
          onCall={(job) => {
            setActiveJobId(job.id);
            setSheet("callLog");
          }}
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
        <RsvcBidboxScreen reqs={reqs} tab={bidTab} onChangeTab={setBidTab} onBack={() => setScreen("main")} onOpenReq={openReq} />
      )}

      {screen === "reqdetail" && (
        <RsvcReqDetailScreen
          req={curReq}
          onBack={() => setScreen("bidbox")}
          onGoResult={() => setScreen("pickresult")}
          onGoBidJoin={() => {
            setBidAmount("");
            setBidMemo("");
            setBidDate("");
            setScreen("bidjoin");
          }}
          onGoPlanWrite={() => openPlan(curReq.id)}
        />
      )}

      {screen === "bidjoin" && (
        <RsvcBidJoinScreen
          req={curReq}
          activeGeneralCount={activeGeneralCount}
          bidAmount={bidAmount}
          onChangeBidAmount={setBidAmount}
          bidDate={bidDate}
          onChangeBidDate={setBidDate}
          bidMemo={bidMemo}
          onChangeBidMemo={setBidMemo}
          onBack={() => setScreen("reqdetail")}
          onSubmit={() => {
            patchReq(curReq.id, { status: "active", myBid: Number(bidAmount) });
            setScreen("reqdetail");
            showToast("입찰이 제출되었어요", "success");
          }}
        />
      )}

      {screen === "planwrite" && (
        <RsvcPlanWriteScreen
          req={curReq}
          draft={planDraft}
          dropOpenIndex={dropOpenIndex}
          onToggleDropdown={(i) => setDropOpenIndex((prev) => (prev === i ? null : i))}
          onPickProduct={(i, productId) => {
            pickProduct(i, productId);
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
          planMemo={planMemo}
          onChangePlanMemo={setPlanMemo}
          onBack={() => setScreen("reqdetail")}
          onSubmit={() => {
            const offerTotal = planDraft.reduce((sum, ln) => sum + (Number(ln.offer) || 0), 0);
            patchReq(curReq.id, { status: "active", myPlan: { price: offerTotal, submitted: true } });
            setScreen("reqdetail");
            showToast("추천안이 제출되었어요", "success");
          }}
        />
      )}

      {screen === "plansearch" && planSearchIdx != null && (
        <RsvcPlanSearchScreen
          itemName={planDraft[planSearchIdx].name}
          allProducts={products(planDraft[planSearchIdx].name)}
          selectedProductId={planDraft[planSearchIdx].productId}
          search={planSearch}
          onChangeSearch={setPlanSearch}
          brand={planBrand}
          onChangeBrand={setPlanBrand}
          onSelect={(p) => {
            pickProduct(planSearchIdx, p.id);
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
            setStartSource("req");
            setSheet("start");
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
          onConfirm={() => {
            patchJob(curJob.id, { status: "완료" });
            setScreen("waitlist");
            showToast("완료 처리되었어요. 고객에게 인수확인을 요청했어요", "success");
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
          result={callResult}
          onChangeResult={setCallResult}
          memo={callMemo}
          onChangeMemo={setCallMemo}
          onClose={() => setSheet(null)}
          onSave={() => {
            setSheet(null);
            setCallMemo("");
            showToast("해피콜 이력이 저장되었어요", "success");
          }}
        />
      )}

      {sheet === "start" && (
        <RsvcStartSheet
          infoRows={startCtx.infoRows}
          items={startCtx.items}
          onCancel={() => setSheet(null)}
          onConfirm={() => {
            if (startSource === "job") patchJob(curJob.id, { status: "시공중" });
            setSheet(null);
            showToast("시공이 착수되었어요", "success");
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
