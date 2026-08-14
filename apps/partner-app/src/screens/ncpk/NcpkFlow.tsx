// PT-NCPK-01~05 신차패키지 시공관리를 엮는 상태 컨테이너 - 착수대기→착수→시공중→완료등록→인수확인 흐름
// 목록·상세·착수·완료등록·인수확인 현황 모두 실 API 연동. 항목별 체크는 제출 전 화면 내 확인 게이트일 뿐 별도 저장하지 않음
import { useEffect, useState } from "react";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../components/ui/useToast";
import CallLogSheet, { type CallResult } from "../../components/ui/CallLogSheet";
import { pushBackAction } from "../../native/backHandler";
import {
  addCallLog,
  completeReservationJob,
  getCallLogs,
  getPackageJobDetail,
  getPackageJobs,
  updateReservationProgress,
  type CallLog,
  type PackageJob,
  type PackageJobDetail,
} from "../../api/reservations";
import { getCommonCodeDetails, type CommonCodeDetailApi } from "../../api/commonCodes";
import { progressToTab, type NcpkTab } from "./ncpkData";
import NcpkListScreen from "./NcpkListScreen";
import NcpkDetailScreen from "./NcpkDetailScreen";
import NcpkStartSheet from "./NcpkStartSheet";
import NcpkDoneScreen from "./NcpkDoneScreen";
import NcpkHandoverScreen from "./NcpkHandoverScreen";

type Screen = "list" | "detail" | "done" | "handover";

interface NcpkFlowProps {
  onExit: () => void;
  initialTab?: NcpkTab;
  /** 홈 "오늘의 시공 일정"에서 특정 예약을 바로 열 때만 값이 전달됨 — 있으면 목록 대신 그 건의 상세를 바로 조회 */
  initialReservationNo?: string;
}

export default function NcpkFlow({ onExit, initialTab = "wait", initialReservationNo }: NcpkFlowProps) {
  const { toast, showToast } = useToast();
  const [screen, setScreen] = useState<Screen>("list");
  const [sheet, setSheet] = useState<"start" | "callLog" | null>(null);
  const [tab, setTab] = useState<NcpkTab>(initialTab);

  const [jobs, setJobs] = useState<PackageJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  // 시공 항목 카드의 분류명(예: "썬팅") 표기용 — PROD_CAT은 관리자가 계속 추가할 수 있어 하드코딩하지 않고 조회
  const [prodCatOptions, setProdCatOptions] = useState<CommonCodeDetailApi[]>([]);

  const [selectedJob, setSelectedJob] = useState<PackageJobDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [checks, setChecks] = useState<boolean[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [memo, setMemo] = useState("");

  const [callResult, setCallResult] = useState<CallResult>("CONNECTED");
  const [callMemo, setCallMemo] = useState("");
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loadingCallLogs, setLoadingCallLogs] = useState(false);
  const [savingCallLog, setSavingCallLog] = useState(false);

  useEffect(() => {
    getPackageJobs()
      .then(setJobs)
      .catch((err) => showToast(err instanceof Error ? err.message : "신차패키지 목록을 불러오지 못했어요", "danger"))
      .finally(() => setLoadingJobs(false));
    getCommonCodeDetails("PROD_CAT").then(setProdCatOptions).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patchJobStatus = (reservationNo: string, progressStatus: string) => {
    setJobs((prev) => prev.map((j) => (j.reservationNo === reservationNo ? { ...j, progressStatus } : j)));
  };

  const openJob = (job: PackageJob) => {
    setScreen("detail");
    setSelectedJob(null);
    setLoadingDetail(true);
    getPackageJobDetail(job.reservationNo)
      .then((detail) => {
        setSelectedJob(detail);
        // 목록으로 돌아갔을 때 이 job이 보이는 탭과 항상 맞춰둠(홈 "오늘의 시공 일정"처럼 목록을 거치지 않고
        // 바로 들어온 경우에도 실제 진행상태에 맞는 탭이 보여야 함 — RsvcFlow.openJob과 동일 패턴)
        setTab(progressToTab(detail.progressStatus));
      })
      .catch((err) => {
        showToast(err instanceof Error ? err.message : "시공 상세를 불러오지 못했어요", "danger");
        setScreen("list");
      })
      .finally(() => setLoadingDetail(false));
  };

  // 홈 "오늘의 시공 일정"에서 진입한 경우 목록을 거치지 않고 해당 예약 상세를 바로 연다
  useEffect(() => {
    if (!initialReservationNo) return;
    openJob({ reservationNo: initialReservationNo } as PackageJob);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 해피콜 이력 저장 시트 진입 — 열 때마다 그 job의 최신 이력을 다시 조회(RsvcFlow.tsx와 동일 패턴)
  const openCallLog = (reservationNo: string) => {
    setSheet("callLog");
    setCallLogs([]);
    setLoadingCallLogs(true);
    getCallLogs(reservationNo)
      .then(setCallLogs)
      .catch((err) => showToast(err instanceof Error ? err.message : "해피콜 이력을 불러오지 못했어요", "danger"))
      .finally(() => setLoadingCallLogs(false));
  };

  // 해피콜 버튼 탭 — 실제 전화 앱을 열고, 통화 후 파트너앱으로 돌아오면(탭이 다시 보이는 시점을 통화 종료로 간주)
  // 이력 저장 팝업을 자동으로 띄운다. 웹 환경이라 실제 통화 종료 이벤트를 받을 방법이 없어 근사치로 처리
  const [pendingCallReservationNo, setPendingCallReservationNo] = useState<string | null>(null);
  const startCall = (job: PackageJobDetail) => {
    if (!job.phone) {
      showToast("등록된 연락처가 없어요", "danger");
      return;
    }
    setPendingCallReservationNo(job.reservationNo);
    window.location.href = `tel:${job.phone}`;
  };
  useEffect(() => {
    if (!pendingCallReservationNo) return;
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      const reservationNo = pendingCallReservationNo;
      setPendingCallReservationNo(null);
      openCallLog(reservationNo);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [pendingCallReservationNo]);

  // 하드웨어 백버튼: 화면 상단 '‹' 버튼의 onBack과 동일한 대상으로 이동. 루트 화면(list)에서는 등록하지 않아
  // 상위(App.tsx)의 "홈으로" 처리로 자연스럽게 넘어감
  useEffect(() => {
    if (sheet) return pushBackAction(() => setSheet(null));
    switch (screen) {
      case "detail":
        return pushBackAction(() => setScreen("list"));
      case "done":
        return pushBackAction(() => setScreen("detail"));
      case "handover":
        return pushBackAction(() => setScreen("list"));
      default:
        return;
    }
  }, [screen, sheet]);

  const confirmStart = async () => {
    if (!selectedJob) return;
    setUpdating(true);
    try {
      await updateReservationProgress(selectedJob.reservationNo, "IN_PROGRESS");
      setSelectedJob({ ...selectedJob, progressStatus: "IN_PROGRESS" });
      patchJobStatus(selectedJob.reservationNo, "IN_PROGRESS");
      setTab("ing");
      setSheet(null);
      showToast("시공을 착수했어요 · 고객에게 알림 발송", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "시공 착수 처리에 실패했습니다", "danger");
    } finally {
      setUpdating(false);
    }
  };

  const toggleCheck = (index: number) => {
    setChecks((prev) => prev.map((v, i) => (i === index ? !v : v)));
  };

  const allChecked = checks.every(Boolean);

  const confirmDone = async () => {
    if (!selectedJob || !allChecked || photos.length < 3) return;
    setUpdating(true);
    try {
      await completeReservationJob(selectedJob.reservationNo, { photos, memo: memo.trim() || undefined });
      setSelectedJob({ ...selectedJob, progressStatus: "DONE" });
      patchJobStatus(selectedJob.reservationNo, "DONE");
      setTab("done");
      setScreen("handover");
      showToast("완료 처리했어요 · 고객에게 인수확인 요청", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "완료 처리에 실패했습니다", "danger");
    } finally {
      setUpdating(false);
    }
  };

  // PT-NCPK-05 인수확인 현황 — 화면 진입마다 최신 상태(고객이 그 사이 확인했을 수 있음)를 다시 조회
  useEffect(() => {
    if (screen !== "handover" || !selectedJob) return;
    getPackageJobDetail(selectedJob.reservationNo)
      .then(setSelectedJob)
      .catch((err) => showToast(err instanceof Error ? err.message : "인수확인 현황을 불러오지 못했어요", "danger"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  const tabCounts: Record<NcpkTab, number> = { wait: 0, ing: 0, done: 0 };
  for (const j of jobs) tabCounts[progressToTab(j.progressStatus)] += 1;
  const visibleJobs = jobs.filter((j) => progressToTab(j.progressStatus) === tab);

  return (
    <div className="absolute inset-0 bg-gray-50">
      {screen === "list" && (
        <NcpkListScreen
          tab={tab}
          onChangeTab={setTab}
          jobs={visibleJobs}
          prodCatOptions={prodCatOptions}
          tabCounts={tabCounts}
          loading={loadingJobs}
          onOpenJob={openJob}
          onOpenHome={onExit}
          onPlaceholder={(label) => showToast(`${label} 탭으로 이동해요`)}
          onTapSearch={() => showToast("고객명·차량번호로 검색해요")}
        />
      )}

      {screen === "detail" && (
        <NcpkDetailScreen
          job={selectedJob}
          prodCatOptions={prodCatOptions}
          loading={loadingDetail}
          updating={updating}
          onBack={() => setScreen("list")}
          onStart={() => setSheet("start")}
          onGoDone={() => {
            setChecks(selectedJob ? selectedJob.items.map(() => false) : []);
            setPhotos([]);
            setMemo("");
            setScreen("done");
          }}
          onGoHandover={() => setScreen("handover")}
          onCall={startCall}
        />
      )}

      {screen === "done" && selectedJob && (
        <NcpkDoneScreen
          items={selectedJob.items}
          tintPositions={selectedJob.tintPositions}
          prodCatOptions={prodCatOptions}
          checks={checks}
          onToggleCheck={toggleCheck}
          photos={photos}
          onAddPhoto={(dataUri) => setPhotos((p) => (p.length < 10 ? [...p, dataUri] : p))}
          onRemovePhoto={(index) => setPhotos((p) => p.filter((_, i) => i !== index))}
          memo={memo}
          onChangeMemo={setMemo}
          onBack={() => setScreen("detail")}
          onConfirm={confirmDone}
          canConfirm={allChecked && photos.length >= 3 && !updating}
          confirming={updating}
          onError={(message) => showToast(message, "danger")}
        />
      )}

      {screen === "handover" && selectedJob && (
        <NcpkHandoverScreen
          job={selectedJob}
          onBack={() => setScreen("list")}
          onRemind={() => showToast("인수확인 알림을 재발송했어요", "success")}
        />
      )}

      {sheet === "start" && selectedJob && (
        <NcpkStartSheet
          job={selectedJob}
          prodCatOptions={prodCatOptions}
          onCancel={() => setSheet(null)}
          onConfirm={confirmStart}
          confirming={updating}
        />
      )}

      {sheet === "callLog" && selectedJob && (
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
              await addCallLog(selectedJob.reservationNo, { result: callResult, memo: callMemo.trim() || undefined });
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

      {toast && (
        <div className="absolute inset-x-0 bottom-10 z-[90] flex justify-center px-6">
          <Toast tone={toast.tone}>{toast.message}</Toast>
        </div>
      )}
    </div>
  );
}
