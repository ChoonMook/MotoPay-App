// 공통 코드 관리 (uploads/MotoPay_프로그램목록표_v1_43.xlsx "관리자웹_프로그램" 시트 AD-SYS-03 스펙 이식)
// [구성요소] 좌측 코드그룹 그리드(Master) + 우측 코드값 그리드(Detail) — 둘 다 관리자웹 표준 컴포넌트인
// components/DataGrid.tsx(ag-grid-community 기반)로 구성
// [인터랙션] 좌측에서 코드그룹 선택 시 우측에 해당 그룹의 코드값 표시 / 양쪽 모두 추가·인라인 수정·삭제 가능
// apps/api(/admin/common-codes/*)와 연동된 실 데이터 화면 — 다른 관리자웹 화면과 달리 목업이 아님
import { useEffect, useMemo, useRef, useState } from "react";
import type { AgGridReact } from "ag-grid-react";
import type { CellClickedEvent, CellValueChangedEvent, ColDef, ICellRendererParams } from "ag-grid-community";
import { GripVertical, Plus, Search, Trash2, X } from "lucide-react";
import {
  createDetail,
  createGroup,
  deleteDetail,
  deleteGroup,
  getGroup,
  listGroups,
  updateDetail,
  updateGroup,
  type CommonCodeDetailApi,
  type CommonCodeGroup,
} from "../../api/commonCodes";
import ConfirmModal from "../../components/ConfirmModal";
import DataGrid from "../../components/DataGrid";
import PageBreadcrumb from "../../components/PageBreadcrumb";

const inputClass =
  "w-full rounded-lg border border-[#ced4da] bg-white px-3 py-2 text-xs font-normal outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5";
const labelClass = "ml-0.5 text-[11px] font-bold tracking-widest text-secondary uppercase";

interface EditableGroup extends CommonCodeGroup {
  dirty?: boolean;
}
interface EditableDetail extends CommonCodeDetailApi {
  dirty?: boolean;
}

interface GroupGridContext {
  onDeleteRequest: (code: string) => void;
}
interface DetailGridContext {
  onDeleteRequest: (detailCode: string) => void;
}

function DeleteCellRenderer<T>({ context, onDelete }: { context: unknown; onDelete: (ctx: T) => void } & ICellRendererParams) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onDelete(context as T);
      }}
      className="flex h-full w-full items-center justify-center text-outline transition-colors hover:text-red-500"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}

function GroupDeleteCellRenderer(params: ICellRendererParams<EditableGroup>) {
  const { onDeleteRequest } = params.context as GroupGridContext;
  if (!params.data) return null;
  return <DeleteCellRenderer {...params} context={params.data.code} onDelete={(code) => onDeleteRequest(code as string)} />;
}

function DetailDeleteCellRenderer(params: ICellRendererParams<EditableDetail>) {
  const { onDeleteRequest } = params.context as DetailGridContext;
  if (!params.data) return null;
  return (
    <DeleteCellRenderer {...params} context={params.data.detailCode} onDelete={(detailCode) => onDeleteRequest(detailCode as string)} />
  );
}

function AddGroupModal({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (v: { code: string; name: string }) => Promise<void> }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setError("코드·코드명을 모두 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({ code: code.trim(), name: name.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "코드그룹 추가에 실패했습니다.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="w-full max-w-[360px] rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-bold text-secondary">코드그룹 추가</h3>
          <button type="button" onClick={onCancel} className="text-outline hover:text-on-surface">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <label className={labelClass}>코드</label>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="예: CAR_BRAND" className={`${inputClass} font-mono`} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>코드명</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 차량브랜드" className={inputClass} />
          </div>
          {error && <p className="text-[12px] font-semibold text-red-600">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg bg-surface-container-high px-4 py-2 text-xs font-bold text-on-surface transition-all hover:bg-surface-dim">
            취소
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? "추가 중..." : "추가"}
          </button>
        </div>
      </form>
    </div>
  );
}

function AddDetailModal({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (v: { detailCode: string; detailName: string; ref1?: string; ref2?: string }) => Promise<void>;
}) {
  const [detailCode, setDetailCode] = useState("");
  const [detailName, setDetailName] = useState("");
  const [ref1, setRef1] = useState("");
  const [ref2, setRef2] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailCode.trim() || !detailName.trim()) {
      setError("코드값·코드명을 모두 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
        detailCode: detailCode.trim(),
        detailName: detailName.trim(),
        ref1: ref1.trim() || undefined,
        ref2: ref2.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "코드 추가에 실패했습니다.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="w-full max-w-[360px] rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-bold text-secondary">코드 추가</h3>
          <button type="button" onClick={onCancel} className="text-outline hover:text-on-surface">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <label className={labelClass}>코드값</label>
            <input value={detailCode} onChange={(e) => setDetailCode(e.target.value.toUpperCase())} placeholder="예: ETC" className={`${inputClass} font-mono`} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>코드명</label>
            <input value={detailName} onChange={(e) => setDetailName(e.target.value)} placeholder="예: 기타" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelClass}>참조값1</label>
              <input value={ref1} onChange={(e) => setRef1(e.target.value)} placeholder="선택 입력" className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>참조값2</label>
              <input value={ref2} onChange={(e) => setRef2(e.target.value)} placeholder="선택 입력" className={inputClass} />
            </div>
          </div>
          {error && <p className="text-[12px] font-semibold text-red-600">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg bg-surface-container-high px-4 py-2 text-xs font-bold text-on-surface transition-all hover:bg-surface-dim">
            취소
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? "추가 중..." : "추가"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CommonCodeMgmtPage() {
  const [groups, setGroups] = useState<EditableGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupsError, setGroupsError] = useState("");

  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [details, setDetails] = useState<EditableDetail[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  const [keyword, setKeyword] = useState("");
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [showAddDetailModal, setShowAddDetailModal] = useState(false);
  const [pendingDeleteGroup, setPendingDeleteGroup] = useState<string | null>(null);
  const [pendingDeleteDetail, setPendingDeleteDetail] = useState<string | null>(null);
  const [savingGroups, setSavingGroups] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [toast, setToast] = useState("");
  const [globalError, setGlobalError] = useState("");

  const detailGridRef = useRef<AgGridReact<EditableDetail>>(null);

  // 좌우 패널 사이 드래그 리사이즈 - 컨테이너 기준 좌측 패널의 px 너비만 상태로 관리
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const [leftWidth, setLeftWidth] = useState(420);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const next = Math.min(Math.max(e.clientX - rect.left, 280), rect.width - 320);
      setLeftWidth(next);
    };
    const onMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const startSplitDrag = () => {
    isDraggingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const loadGroups = () => {
    setGroupsLoading(true);
    listGroups()
      .then((rows) => {
        setGroups(rows);
        setSelectedCode((prev) => prev ?? (rows.length > 0 ? rows[0].code : null));
      })
      .catch((err) => setGroupsError(err instanceof Error ? err.message : "코드그룹 목록을 불러오지 못했습니다."))
      .finally(() => setGroupsLoading(false));
  };

  useEffect(loadGroups, []);

  const loadDetails = (code: string) => {
    setDetailsLoading(true);
    setDetailsError("");
    getGroup(code)
      .then((group) => setDetails(group.details))
      .catch((err) => setDetailsError(err instanceof Error ? err.message : "코드값 목록을 불러오지 못했습니다."))
      .finally(() => setDetailsLoading(false));
  };

  useEffect(() => {
    if (!selectedCode) {
      setDetails([]);
      return;
    }
    loadDetails(selectedCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCode]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!globalError) return;
    const t = setTimeout(() => setGlobalError(""), 3200);
    return () => clearTimeout(t);
  }, [globalError]);

  // 그룹을 바꾸거나 검색어를 입력해 결과 건수가 줄어들면 이전 페이지가 비어 보일 수 있어 항상 1페이지로 복귀
  useEffect(() => {
    detailGridRef.current?.api?.paginationGoToFirstPage();
  }, [selectedCode, keyword]);

  const filteredDetails = useMemo(() => {
    const kw = keyword.trim();
    if (!kw) return details;
    return details.filter((d) => d.detailName.includes(kw) || d.detailCode.includes(kw.toUpperCase()));
  }, [details, keyword]);

  const groupDirtyCount = groups.filter((g) => g.dirty).length;
  const detailDirtyCount = details.filter((d) => d.dirty).length;

  // ---- 코드그룹(좌측) ----
  const onGroupCellClicked = (e: CellClickedEvent<EditableGroup>) => {
    if (e.colDef.colId === "actions" || !e.data) return;
    setSelectedCode(e.data.code);
  };

  const onGroupCellValueChanged = (e: CellValueChangedEvent<EditableGroup>) => {
    if (!e.data) return;
    setGroups((prev) => prev.map((g) => (g.code === e.data!.code ? { ...e.data!, dirty: true } : g)));
  };

  const groupColumnDefs = useMemo<ColDef<EditableGroup>[]>(
    () => [
      { headerName: "코드", field: "code", flex: 1, minWidth: 140, cellClass: "font-mono" },
      { headerName: "코드명", field: "name", flex: 1.3, minWidth: 160, editable: true },
      {
        headerName: "사용",
        field: "useYn",
        width: 70,
        editable: true,
        cellRenderer: "agCheckboxCellRenderer",
      },
      {
        headerName: "관리",
        colId: "actions",
        width: 64,
        sortable: false,
        resizable: false,
        cellRenderer: GroupDeleteCellRenderer,
        cellClass: "flex items-center justify-center",
      },
    ],
    [],
  );

  const groupContext = useMemo<GroupGridContext>(() => ({ onDeleteRequest: setPendingDeleteGroup }), []);

  const handleAddGroup = async (v: { code: string; name: string }) => {
    const created = await createGroup(v);
    setGroups((prev) => [...prev, created]);
    setSelectedCode(created.code);
    setShowAddGroupModal(false);
    setToast("코드그룹을 추가했습니다.");
  };

  const handleSaveGroups = async () => {
    const dirty = groups.filter((g) => g.dirty);
    if (dirty.length === 0) return;
    setSavingGroups(true);
    setGlobalError("");
    try {
      await Promise.all(dirty.map((g) => updateGroup(g.code, { name: g.name, useYn: g.useYn })));
      setGroups((prev) => prev.map((g) => ({ ...g, dirty: false })));
      setToast("코드그룹 변경사항을 저장했습니다.");
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "코드그룹 저장에 실패했습니다.");
    } finally {
      setSavingGroups(false);
    }
  };

  const confirmDeleteGroup = async () => {
    if (!pendingDeleteGroup) return;
    const code = pendingDeleteGroup;
    setPendingDeleteGroup(null);
    try {
      await deleteGroup(code);
      setGroups((prev) => prev.filter((g) => g.code !== code));
      if (selectedCode === code) {
        setSelectedCode(null);
      }
      setToast("코드그룹을 삭제했습니다.");
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "코드그룹 삭제에 실패했습니다.");
    }
  };

  // ---- 상세코드(우측) ----
  const patchLocalDetail = (detailCode: string, patch: Partial<EditableDetail>) => {
    setDetails((prev) => prev.map((d) => (d.detailCode === detailCode ? { ...d, ...patch, dirty: true } : d)));
  };

  const onDetailCellValueChanged = (e: CellValueChangedEvent<EditableDetail>) => {
    if (!e.data) return;
    patchLocalDetail(e.data.detailCode, e.data);
  };

  const detailColumnDefs = useMemo<ColDef<EditableDetail>[]>(
    () => [
      { headerName: "코드값", field: "detailCode", flex: 1, minWidth: 120, cellClass: "font-mono" },
      { headerName: "코드명", field: "detailName", flex: 1.2, minWidth: 140, editable: true },
      { headerName: "참조값1", field: "ref1", flex: 1, minWidth: 110, editable: true },
      { headerName: "참조값2", field: "ref2", flex: 1, minWidth: 110, editable: true },
      {
        headerName: "정렬순서",
        field: "sortOrder",
        width: 100,
        editable: true,
        cellEditor: "agNumberCellEditor",
        cellEditorParams: { precision: 0 },
        // 숫자 에디터를 거치지 않고 값이 들어오는 경로(붙여넣기 등) 대비 - 숫자가 아니면 기존 값 유지
        valueParser: (p) => {
          const n = Number(p.newValue);
          return Number.isNaN(n) ? p.oldValue : n;
        },
      },
      { headerName: "사용", field: "useYn", width: 70, editable: true, cellRenderer: "agCheckboxCellRenderer" },
      {
        headerName: "관리",
        colId: "actions",
        width: 64,
        sortable: false,
        resizable: false,
        cellRenderer: DetailDeleteCellRenderer,
        cellClass: "flex items-center justify-center",
      },
    ],
    [],
  );

  const detailContext = useMemo<DetailGridContext>(() => ({ onDeleteRequest: setPendingDeleteDetail }), []);

  const handleAddDetail = async (v: { detailCode: string; detailName: string; ref1?: string; ref2?: string }) => {
    if (!selectedCode) return;
    const created = await createDetail(selectedCode, v);
    setDetails((prev) => [...prev, created]);
    setShowAddDetailModal(false);
    setToast("코드를 추가했습니다.");
  };

  const handleSaveDetails = async () => {
    if (!selectedCode) return;
    const dirty = details.filter((d) => d.dirty);
    if (dirty.length === 0) return;
    setSavingDetails(true);
    setGlobalError("");
    try {
      await Promise.all(
        dirty.map((d) =>
          updateDetail(selectedCode, d.detailCode, {
            detailName: d.detailName,
            ref1: d.ref1 ?? undefined,
            ref2: d.ref2 ?? undefined,
            sortOrder: d.sortOrder,
            useYn: d.useYn,
          }),
        ),
      );
      setDetails((prev) => prev.map((d) => ({ ...d, dirty: false })));
      setToast("상세 코드 변경사항을 저장했습니다.");
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "상세 코드 저장에 실패했습니다.");
    } finally {
      setSavingDetails(false);
    }
  };

  const confirmDeleteDetail = async () => {
    if (!pendingDeleteDetail || !selectedCode) return;
    const detailCode = pendingDeleteDetail;
    setPendingDeleteDetail(null);
    try {
      await deleteDetail(selectedCode, detailCode);
      setDetails((prev) => prev.filter((d) => d.detailCode !== detailCode));
      setToast("코드를 삭제했습니다.");
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "코드 삭제에 실패했습니다.");
    }
  };

  const selectedGroup = groups.find((g) => g.code === selectedCode) ?? null;

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-8 py-6">
      <PageBreadcrumb path="/system/common-code-mgmt" />

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {/* 상단: 그룹/상세 헤더(타이틀+액션) - 그리드 행과 동일한 leftWidth로 나눠 정렬만 맞춤 */}
        <div className="flex shrink-0">
          <div className="flex items-center justify-between" style={{ width: leftWidth, flex: "0 0 auto" }}>
            <h3 className="text-sm font-extrabold text-on-surface">코드그룹</h3>
            <button
              type="button"
              onClick={() => setShowAddGroupModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[11px] font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              그룹 추가
            </button>
          </div>
          <div className="mx-3 w-0.5 shrink-0" />
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-on-surface">{selectedGroup?.name ?? "-"}</h3>
              <p className="font-mono text-[11px] text-on-surface-variant">{selectedCode ?? "코드그룹을 선택하세요"}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-outline" />
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="코드명 검색"
                  className={`${inputClass} w-44 pl-8`}
                />
              </div>
              <button
                type="button"
                onClick={() => setShowAddDetailModal(true)}
                disabled={!selectedCode}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                코드 추가
              </button>
            </div>
          </div>
        </div>

        {/* 중단: 그리드 두 개 + 그 사이의 드래그 리사이즈 핸들(그리드 높이에만 걸치도록 이 행 안에만 둠) */}
        <div ref={splitContainerRef} className="flex min-h-0 flex-1">
          <div className="flex min-h-0 flex-col" style={{ width: leftWidth, flex: "0 0 auto" }}>
            {groupsError ? (
              <p className="px-2 py-6 text-center text-[12px] font-semibold text-red-600">{groupsError}</p>
            ) : (
              <DataGrid<EditableGroup>
                columnDefs={groupColumnDefs}
                rowData={groups}
                getRowId={(p) => p.data.code}
                context={groupContext}
                onCellClicked={onGroupCellClicked}
                onCellValueChanged={onGroupCellValueChanged}
                rowClass="cursor-pointer"
                rowSelection={{ mode: "singleRow", checkboxes: false, enableClickSelection: true }}
                loading={groupsLoading}
                emptyMessage="등록된 코드그룹이 없습니다."
              />
            )}
          </div>

          <div
            onMouseDown={startSplitDrag}
            className="relative mx-3 h-1/3 w-0.5 shrink-0 cursor-col-resize self-center bg-primary/25 transition-colors hover:bg-primary/60"
          >
            <div className="absolute top-1/2 left-1/2 flex h-8 w-3.5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-outline-variant bg-white shadow-sm">
              <GripVertical className="h-3 w-3 text-outline" />
            </div>
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {detailsError ? (
              <p className="px-2 py-6 text-center text-[12px] font-semibold text-red-600">{detailsError}</p>
            ) : (
              <DataGrid<EditableDetail>
                ref={detailGridRef}
                columnDefs={detailColumnDefs}
                rowData={filteredDetails}
                getRowId={(p) => p.data.detailCode}
                context={detailContext}
                onCellValueChanged={onDetailCellValueChanged}
                loading={detailsLoading}
                emptyMessage={!selectedCode ? "코드그룹을 선택하세요." : "조건에 맞는 코드가 없습니다."}
              />
            )}
          </div>
        </div>

        {/* 하단: 그룹/상세 저장 버튼 - 헤더와 동일하게 leftWidth로 나눠 정렬만 맞춤 */}
        <div className="flex shrink-0">
          <div className="flex items-center justify-end gap-3" style={{ width: leftWidth, flex: "0 0 auto" }}>
            {groupDirtyCount > 0 && <span className="text-[11px] font-bold text-primary">{groupDirtyCount}건 변경됨</span>}
            <button
              type="button"
              onClick={handleSaveGroups}
              disabled={groupDirtyCount === 0 || savingGroups}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-40"
            >
              {savingGroups ? "저장 중..." : "저장"}
            </button>
          </div>
          <div className="mx-3 w-0.5 shrink-0" />
          <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
            {detailDirtyCount > 0 && <span className="text-[11px] font-bold text-primary">{detailDirtyCount}건 변경됨</span>}
            <button
              type="button"
              onClick={handleSaveDetails}
              disabled={detailDirtyCount === 0 || savingDetails}
              className="rounded-lg bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-40"
            >
              {savingDetails ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      </div>

      {showAddGroupModal && <AddGroupModal onCancel={() => setShowAddGroupModal(false)} onSubmit={handleAddGroup} />}
      {showAddDetailModal && <AddDetailModal onCancel={() => setShowAddDetailModal(false)} onSubmit={handleAddDetail} />}
      {pendingDeleteGroup && (
        <ConfirmModal
          title="코드그룹 삭제"
          message={`"${pendingDeleteGroup}" 코드그룹을 삭제하시겠습니까? 상세 코드값이 남아있으면 삭제할 수 없습니다.`}
          onCancel={() => setPendingDeleteGroup(null)}
          onConfirm={confirmDeleteGroup}
        />
      )}
      {pendingDeleteDetail && (
        <ConfirmModal
          title="코드 삭제"
          message={`"${pendingDeleteDetail}" 코드를 삭제하시겠습니까?`}
          onCancel={() => setPendingDeleteDetail(null)}
          onConfirm={confirmDeleteDetail}
        />
      )}

      {globalError && (
        <div className="fixed right-6 bottom-20 z-[999] rounded-lg bg-red-500 px-4 py-3 text-xs font-bold text-white shadow-xl">{globalError}</div>
      )}
      {toast && (
        <div className="fixed right-6 bottom-6 z-[999] rounded-lg bg-secondary px-4 py-3 text-xs font-bold text-white shadow-xl">{toast}</div>
      )}
    </div>
  );
}
