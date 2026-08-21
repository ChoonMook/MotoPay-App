// 푸시 발송(AD-CS-04) — 관리자가 회원/시공업체 사용자에게 임의로 보낸 공지성 푸시 발송 이력 조회 + 신규 발송.
// 발송(팝업)은 URL경로가 없는 액션이라 이 화면 상단 "푸시 발송" 버튼으로 노출한다(쿠폰 발행과 동일 컨벤션).
import { useEffect, useMemo, useState } from "react";
import type { ColDef } from "ag-grid-community";
import { Plus } from "lucide-react";
import { listPushBroadcastHistory, type AdminPushBroadcastListItem } from "../../api/pushBroadcast";
import DataGrid from "../../components/DataGrid";
import PageBreadcrumb from "../../components/PageBreadcrumb";
import PushBroadcastModal from "./PushBroadcastModal";

const TARGET_TYPE_LABEL: Record<string, string> = { USER: "회원", PARTNER: "시공업체 사용자" };
const SCOPE_LABEL: Record<string, string> = { ALL: "전체", INDIVIDUAL: "개별선택" };

function formatDateTime(value: string): string {
  return value.replace("T", " ").slice(0, 16);
}

export default function PushBroadcastPage() {
  const [rows, setRows] = useState<AdminPushBroadcastListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [globalError, setGlobalError] = useState("");

  const loadRows = () => {
    setLoading(true);
    listPushBroadcastHistory()
      .then(setRows)
      .catch((err) => setGlobalError(err instanceof Error ? err.message : "발송 이력을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(loadRows, []);

  useEffect(() => {
    if (!globalError) return;
    const t = setTimeout(() => setGlobalError(""), 3200);
    return () => clearTimeout(t);
  }, [globalError]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const columnDefs = useMemo<ColDef<AdminPushBroadcastListItem>[]>(
    () => [
      {
        headerName: "대상",
        field: "targetType",
        flex: 0.8,
        minWidth: 100,
        valueFormatter: (p) => TARGET_TYPE_LABEL[p.value] ?? p.value,
      },
      {
        headerName: "범위",
        field: "scope",
        flex: 0.7,
        minWidth: 90,
        valueFormatter: (p) => SCOPE_LABEL[p.value] ?? p.value,
      },
      { headerName: "발송 인원", field: "targetCount", flex: 0.7, minWidth: 90, valueFormatter: (p) => `${p.value}명` },
      { headerName: "제목", field: "title", flex: 1.3, minWidth: 160 },
      { headerName: "본문", field: "body", flex: 2, minWidth: 220 },
      { headerName: "발송자", field: "createdBy", flex: 0.8, minWidth: 100, valueFormatter: (p) => p.value ?? "-" },
      {
        headerName: "발송일시",
        field: "createdAt",
        flex: 1,
        minWidth: 140,
        valueFormatter: (p) => formatDateTime(p.value),
      },
    ],
    [],
  );

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-8 py-6">
      <PageBreadcrumb path="/cs/push-broadcast" />

      <div className="flex items-center justify-end rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
        <button
          type="button"
          onClick={() => setSendModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/5 px-4 py-2.5 text-xs font-bold text-primary transition-all hover:bg-primary/10"
        >
          <Plus className="h-3.5 w-3.5" />
          푸시 발송
        </button>
      </div>

      <DataGrid<AdminPushBroadcastListItem>
        columnDefs={columnDefs}
        rowData={rows}
        getRowId={(p) => String(p.data.id)}
        loading={loading}
        emptyMessage="발송 이력이 없습니다."
      />

      {sendModalOpen && (
        <PushBroadcastModal
          onClose={() => setSendModalOpen(false)}
          onDone={(targetCount) => {
            setSendModalOpen(false);
            setToast(`${targetCount}명에게 발송되었습니다.`);
            loadRows();
          }}
        />
      )}

      {toast && (
        <div className="fixed right-6 bottom-6 z-[999] rounded-lg bg-secondary px-4 py-3 text-xs font-bold text-white shadow-xl">
          {toast}
        </div>
      )}
      {globalError && (
        <div className="fixed right-6 bottom-6 z-[999] rounded-lg bg-red-600 px-4 py-3 text-xs font-bold text-white shadow-xl">
          {globalError}
        </div>
      )}
    </div>
  );
}
