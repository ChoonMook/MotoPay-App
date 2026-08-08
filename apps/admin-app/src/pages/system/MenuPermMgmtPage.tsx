// 메뉴권한관리 (uploads/MotoPay_프로그램목록표_v1_46.xlsx "관리자웹_프로그램" 시트 AD-SYS-05 스펙 이식)
// [구성요소] 좌측 권한그룹 목록(공통코드 PERM_GROUP 재사용) + 우측 메뉴별 권한 매트릭스(체크박스 테이블)
// [인터랙션] 권한그룹 선택 시 우측 매트릭스가 해당 그룹 설정으로 갱신, 체크박스 토글은 로컬 상태에 즉시 반영되고
// "저장" 버튼으로 일괄 저장. 접근권한 미체크 시 읽기·수정·삭제·파일 권한 체크박스는 비활성화되고 값도 초기화된다.
// apps/api(/admin/menu-permissions/*)와 연동된 실 데이터 화면 — 다른 관리자웹 화면과 달리 목업이 아님
// 이번 작업 범위는 매트릭스 관리 화면까지이며, 사이드바 메뉴 숨김·URL 직접 접근 차단 등 실제 권한 적용은 별도 범위
import { Fragment, useEffect, useMemo, useState } from "react";
import type { CellClickedEvent, ColDef } from "ag-grid-community";
import { Plus, X } from "lucide-react";
import {
  createDetail,
  getGroup,
  type CommonCodeDetailApi,
} from "../../api/commonCodes";
import { listMenuPermissions, saveMenuPermissions, type MenuPermissionRow } from "../../api/menuPermissions";
import DataGrid from "../../components/DataGrid";
import PageBreadcrumb from "../../components/PageBreadcrumb";
import { MENU_GROUPS } from "../../lib/menuConfig";

const inputClass =
  "w-full rounded-lg border border-[#ced4da] bg-white px-3 py-2 text-xs font-normal outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5";
const labelClass = "ml-0.5 text-[11px] font-bold tracking-widest text-secondary uppercase";

type PermField = "canAccess" | "canRead" | "canWrite" | "canDelete" | "canFile";

const ALL_MENU_PG_IDS = MENU_GROUPS.flatMap((g) => g.items.map((i) => i.pgId));

function emptyRow(menuPgId: string): MenuPermissionRow {
  return { menuPgId, canAccess: false, canRead: false, canWrite: false, canDelete: false, canFile: false };
}

interface ColumnStat {
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
}

function HeaderCheckbox({ stat, onToggle }: { stat: ColumnStat; onToggle: () => void }) {
  return (
    <input
      type="checkbox"
      checked={stat.checked}
      disabled={stat.disabled}
      ref={(el) => {
        if (el) el.indeterminate = stat.indeterminate;
      }}
      onChange={onToggle}
      className="h-3.5 w-3.5 accent-primary disabled:cursor-not-allowed disabled:opacity-40"
    />
  );
}

function buildFullMatrix(rows: MenuPermissionRow[]): Map<string, MenuPermissionRow> {
  const byId = new Map(rows.map((r) => [r.menuPgId, r]));
  const matrix = new Map<string, MenuPermissionRow>();
  for (const group of MENU_GROUPS) {
    for (const item of group.items) {
      matrix.set(item.pgId, byId.get(item.pgId) ?? emptyRow(item.pgId));
    }
  }
  return matrix;
}

function AddPermGroupModal({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (v: { code: string; name: string }) => Promise<void> }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setError("권한그룹코드·권한그룹명을 모두 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({ code: code.trim().toUpperCase(), name: name.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "권한그룹 추가에 실패했습니다.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="w-full max-w-[380px] rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-bold text-secondary">권한그룹 추가</h3>
          <button type="button" onClick={onCancel} className="text-outline hover:text-on-surface">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <label className={labelClass}>권한그룹코드</label>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="예: OPS_MD" className={`${inputClass} font-mono`} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>권한그룹명</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 운영 MD" className={inputClass} />
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

export default function MenuPermMgmtPage() {
  const [permGroups, setPermGroups] = useState<CommonCodeDetailApi[]>([]);
  const [permGroupsLoading, setPermGroupsLoading] = useState(true);

  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [matrix, setMatrix] = useState<Map<string, MenuPermissionRow>>(new Map());
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState("");
  const [globalError, setGlobalError] = useState("");

  const loadPermGroups = () => {
    setPermGroupsLoading(true);
    getGroup("PERM_GROUP")
      .then((group) => {
        setPermGroups(group.details);
        setSelectedCode((prev) => prev ?? (group.details.length > 0 ? group.details[0].detailCode : null));
      })
      .catch((err) => setGlobalError(err instanceof Error ? err.message : "권한그룹 목록을 불러오지 못했습니다."))
      .finally(() => setPermGroupsLoading(false));
  };

  useEffect(loadPermGroups, []);

  useEffect(() => {
    if (!selectedCode) {
      setMatrix(new Map());
      return;
    }
    setMatrixLoading(true);
    listMenuPermissions(selectedCode)
      .then((rows) => setMatrix(buildFullMatrix(rows)))
      .catch((err) => setGlobalError(err instanceof Error ? err.message : "메뉴 권한을 불러오지 못했습니다."))
      .finally(() => setMatrixLoading(false));
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

  const toggleField = (menuPgId: string, field: PermField) => {
    setMatrix((prev) => {
      const next = new Map(prev);
      const row = next.get(menuPgId) ?? emptyRow(menuPgId);
      const nextValue = !row[field];
      if (field === "canAccess" && !nextValue) {
        next.set(menuPgId, { ...row, canAccess: false, canRead: false, canWrite: false, canDelete: false, canFile: false });
      } else {
        next.set(menuPgId, { ...row, [field]: nextValue });
      }
      return next;
    });
  };

  const columnStats = useMemo<Record<PermField, ColumnStat>>(() => {
    const fields: PermField[] = ["canAccess", "canRead", "canWrite", "canDelete", "canFile"];
    const stats = {} as Record<PermField, ColumnStat>;
    for (const field of fields) {
      const eligibleIds = field === "canAccess" ? ALL_MENU_PG_IDS : ALL_MENU_PG_IDS.filter((id) => (matrix.get(id) ?? emptyRow(id)).canAccess);
      const checkedCount = eligibleIds.filter((id) => (matrix.get(id) ?? emptyRow(id))[field]).length;
      stats[field] = {
        checked: eligibleIds.length > 0 && checkedCount === eligibleIds.length,
        indeterminate: checkedCount > 0 && checkedCount < eligibleIds.length,
        disabled: field !== "canAccess" && eligibleIds.length === 0,
      };
    }
    return stats;
  }, [matrix]);

  const toggleAllField = (field: PermField) => {
    const stat = columnStats[field];
    const nextValue = !stat.checked;
    setMatrix((prev) => {
      const next = new Map(prev);
      for (const pgId of ALL_MENU_PG_IDS) {
        const row = next.get(pgId) ?? emptyRow(pgId);
        if (field === "canAccess") {
          next.set(pgId, nextValue ? { ...row, canAccess: true } : emptyRow(pgId));
        } else if (row.canAccess) {
          next.set(pgId, { ...row, [field]: nextValue });
        }
      }
      return next;
    });
  };

  const handleAddPermGroup = async (v: { code: string; name: string }) => {
    const created = await createDetail("PERM_GROUP", { detailCode: v.code, detailName: v.name });
    setPermGroups((prev) => [...prev, created]);
    setSelectedCode(created.detailCode);
    setShowAddModal(false);
    setToast("권한그룹을 추가했습니다.");
  };

  const handleSave = async () => {
    if (!selectedCode) return;
    setSaving(true);
    try {
      const rows = Array.from(matrix.values());
      const saved = await saveMenuPermissions(selectedCode, rows);
      setMatrix(buildFullMatrix(saved));
      setToast("메뉴 권한을 저장했습니다.");
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "메뉴 권한 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const permGroupColumnDefs = useMemo<ColDef<CommonCodeDetailApi>[]>(
    () => [
      { headerName: "권한그룹코드", field: "detailCode", flex: 1, minWidth: 120 },
      { headerName: "권한그룹명", field: "detailName", flex: 1, minWidth: 120 },
    ],
    [],
  );

  const onPermGroupCellClicked = (e: CellClickedEvent<CommonCodeDetailApi>) => {
    if (!e.data) return;
    setSelectedCode(e.data.detailCode);
  };

  const selectedGroupName = permGroups.find((g) => g.detailCode === selectedCode)?.detailName ?? null;

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-8 py-6">
      <PageBreadcrumb path="/system/menu-perm-mgmt" />

      <div className="flex min-h-0 flex-1 gap-4">
        <div className="flex w-[320px] shrink-0 flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-secondary">권한그룹</h3>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              권한그룹 추가
            </button>
          </div>
          <DataGrid<CommonCodeDetailApi>
            columnDefs={permGroupColumnDefs}
            rowData={permGroups}
            getRowId={(p) => p.data.detailCode}
            onCellClicked={onPermGroupCellClicked}
            rowClass="cursor-pointer"
            rowSelection={{ mode: "singleRow", checkboxes: false, enableClickSelection: true }}
            loading={permGroupsLoading}
            emptyMessage="등록된 권한그룹이 없습니다."
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-secondary">
              {selectedGroupName ? `${selectedGroupName} 메뉴 권한` : "권한그룹을 선택하세요"}
            </h3>
            <button
              type="button"
              onClick={handleSave}
              disabled={!selectedCode || saving}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-[#e3e5ec] bg-white shadow-sm">
            {!selectedCode ? (
              <div className="flex h-full items-center justify-center text-xs font-medium text-on-surface-variant">
                좌측에서 권한그룹을 선택하세요.
              </div>
            ) : matrixLoading ? (
              <div className="flex h-full items-center justify-center text-xs font-medium text-on-surface-variant">불러오는 중...</div>
            ) : (
              <table className="w-full border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-surface-container-low">
                  <tr>
                    <th className="border-b border-outline-variant px-4 py-2.5 text-left text-[13px] font-bold text-on-surface-variant">메뉴명</th>
                    {(
                      [
                        ["canAccess", "접근"],
                        ["canRead", "읽기"],
                        ["canWrite", "수정"],
                        ["canDelete", "삭제"],
                        ["canFile", "파일"],
                      ] as const
                    ).map(([field, label]) => (
                      <th key={field} className="w-24 border-b border-outline-variant px-2 py-2.5 text-center text-[13px] font-bold text-on-surface-variant">
                        <div className="flex items-center justify-center gap-2">
                          <HeaderCheckbox stat={columnStats[field]} onToggle={() => toggleAllField(field)} />
                          <span>{label}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MENU_GROUPS.map((group) => (
                    <Fragment key={group.key}>
                      <tr className="bg-surface-container-low">
                        <td colSpan={6} className="border-b border-outline-variant px-4 py-1.5 text-[11px] font-bold text-on-surface-variant">
                          {group.label}
                        </td>
                      </tr>
                      {group.items.map((item) => {
                        const row = matrix.get(item.pgId) ?? emptyRow(item.pgId);
                        return (
                          <tr key={item.pgId} className="border-b border-outline-variant/60 hover:bg-surface-container-low/50">
                            <td className="py-2 pr-4 pl-8 text-on-surface">{item.label}</td>
                            <td className="px-2 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={row.canAccess}
                                onChange={() => toggleField(item.pgId, "canAccess")}
                                className="h-3.5 w-3.5 accent-primary"
                              />
                            </td>
                            {(["canRead", "canWrite", "canDelete", "canFile"] as const).map((field) => (
                              <td key={field} className="px-2 py-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={row[field]}
                                  disabled={!row.canAccess}
                                  onChange={() => toggleField(item.pgId, field)}
                                  className="h-3.5 w-3.5 accent-primary disabled:cursor-not-allowed disabled:opacity-40"
                                />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showAddModal && <AddPermGroupModal onCancel={() => setShowAddModal(false)} onSubmit={handleAddPermGroup} />}

      {(toast || globalError) && (
        <div
          className={`fixed right-6 bottom-6 z-[999] rounded-lg px-4 py-3 text-xs font-bold text-white shadow-xl ${
            globalError ? "bg-red-600" : "bg-secondary"
          }`}
        >
          {globalError || toast}
        </div>
      )}
    </div>
  );
}
