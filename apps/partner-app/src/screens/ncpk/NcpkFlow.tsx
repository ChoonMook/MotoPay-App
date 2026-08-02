// PT-NCPK-01~05 신차패키지 시공관리를 엮는 상태 컨테이너 - 착수대기→착수→시공중→완료등록→인수확인 흐름
// 목록·상세·착수·완료등록·인수확인 현황 모두 실 API 연동. 항목별 체크는 제출 전 화면 내 확인 게이트일 뿐 별도 저장하지 않음
import { useEffect, useState } from "react";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../components/ui/useToast";
import {
  completeReservationJob,
  getPackageJobDetail,
  getPackageJobs,
  updateReservationProgress,
  type PackageJob,
  type PackageJobDetail,
} from "../../api/reservations";
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
}

export default function NcpkFlow({ onExit, initialTab = "wait" }: NcpkFlowProps) {
  const { toast, showToast } = useToast();
  const [screen, setScreen] = useState<Screen>("list");
  const [sheet, setSheet] = useState<"start" | null>(null);
  const [tab, setTab] = useState<NcpkTab>(initialTab);

  const [jobs, setJobs] = useState<PackageJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  const [selectedJob, setSelectedJob] = useState<PackageJobDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [checks, setChecks] = useState<boolean[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [memo, setMemo] = useState("");

  useEffect(() => {
    getPackageJobs()
      .then(setJobs)
      .catch((err) => showToast(err instanceof Error ? err.message : "신차패키지 목록을 불러오지 못했어요", "danger"))
      .finally(() => setLoadingJobs(false));
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
      .then(setSelectedJob)
      .catch((err) => {
        showToast(err instanceof Error ? err.message : "시공 상세를 불러오지 못했어요", "danger");
        setScreen("list");
      })
      .finally(() => setLoadingDetail(false));
  };

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
        />
      )}

      {screen === "done" && selectedJob && (
        <NcpkDoneScreen
          items={selectedJob.items}
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
          onCancel={() => setSheet(null)}
          onConfirm={confirmStart}
          confirming={updating}
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
