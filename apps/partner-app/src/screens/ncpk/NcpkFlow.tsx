// PT-NCPK-01~05 신차패키지 시공관리를 엮는 상태 컨테이너 - 착수대기→착수→시공중→완료등록→인수확인 흐름
// 목록·상세·착수는 실 API 연동(Reservation 진행상태). 완료 등록의 항목체크·사진·메모와 인수확인 화면은
// 이를 저장할 백엔드 모델이 아직 없어 화면 자체는 로컬 상태로만 동작하고, 완료 처리 시 진행상태만 DONE으로 반영함
import { useEffect, useState } from "react";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../components/ui/useToast";
import {
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
  const [photos, setPhotos] = useState(0);
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
    if (!selectedJob || !allChecked || photos < 3) return;
    setUpdating(true);
    try {
      await updateReservationProgress(selectedJob.reservationNo, "DONE");
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
          onTapCall={() => showToast("고객에게 해피콜을 연결해요")}
          onStart={() => setSheet("start")}
          onGoDone={() => {
            setChecks(selectedJob ? selectedJob.items.map(() => false) : []);
            setPhotos(0);
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
          onAddPhoto={() => setPhotos((p) => Math.min(10, p + 1))}
          onRemovePhoto={() => setPhotos((p) => Math.max(0, p - 1))}
          memo={memo}
          onChangeMemo={setMemo}
          onBack={() => setScreen("detail")}
          onConfirm={confirmDone}
          canConfirm={allChecked && photos >= 3 && !updating}
        />
      )}

      {screen === "handover" && selectedJob && (
        <NcpkHandoverScreen
          job={selectedJob}
          photos={photos}
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
