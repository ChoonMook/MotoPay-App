// 사용자 계정 관리 (uploads/MotoPay_프로그램목록표_v1_43.xlsx "관리자웹_프로그램" 시트 AD-SYS-04 스펙 이식)
// [구성요소] 상단 필터 바(이름·아이디 검색/권한그룹/상태) + 하단 목록 테이블(페이징) — 대상은 업체에 속하지 않는
// 운영사 자체 직원 계정만(업체 소속 계정은 AD-CO-05에서 별도 관리)
// [인터랙션] 계정 추가 시 임시비밀번호 발급 후 안내 / 행 클릭 시 계정 상세 수정 팝업(권한그룹 변경 포함) /
// 비활성화는 즉시 토글 적용
// apps/api(/admin/accounts/*)와 연동된 실 데이터 화면이며, 권한그룹은 공통코드(PERM_GROUP)의 상세코드값을 저장한다
// 목록 그리드는 관리자웹 표준 컴포넌트인 components/DataGrid.tsx(ag-grid-community 기반)를 사용한다
import { useEffect, useMemo, useRef, useState } from "react";
import type { AgGridReact } from "ag-grid-react";
import type { CellClickedEvent, ColDef, ICellRendererParams } from "ag-grid-community";
import { Copy, Download, Plus, Search, X } from "lucide-react";
import {
  checkUsernameAvailable,
  createAccount,
  listAccounts,
  updateAccount,
  type AdminAccountListItem,
} from "../../api/adminAccounts";
import { getGroup, type CommonCodeDetailApi } from "../../api/commonCodes";
import DataGrid from "../../components/DataGrid";
import ExcelActionButton from "../../components/ExcelActionButton";
import { exportRowsAsXlsx } from "../../lib/exportXlsx";
import PageBreadcrumb from "../../components/PageBreadcrumb";

const inputClass =
  "w-full rounded-lg border border-[#ced4da] bg-white px-3 py-2 text-xs font-normal outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5";
const labelClass = "ml-0.5 text-[11px] font-bold tracking-widest text-secondary uppercase";

function formatDateTime(value: string | null): string {
  if (!value) return "-";
  return value.replace("T", " ").slice(0, 16);
}

interface GridContext {
  onToggleStatus: (target: AdminAccountListItem) => void;
  permGroupLabel: (code: string) => string;
}

function ActionsCellRenderer({ data, context }: ICellRendererParams<AdminAccountListItem>) {
  if (!data) return null;
  const { onToggleStatus } = context as GridContext;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggleStatus(data);
      }}
      className={`text-[12px] font-bold underline-offset-2 transition-colors hover:underline ${
        data.useYn ? "text-on-surface-variant hover:text-on-surface" : "text-primary hover:text-primary/80"
      }`}
    >
      {data.useYn ? "비활성화" : "활성화"}
    </button>
  );
}

interface AccountFormValue {
  name: string;
  email: string;
  phone: string;
  accountType: string;
  permGroup: string;
  useYn: boolean;
}

function AddAccountModal({
  permGroups,
  coTypes,
  onCancel,
  onSubmit,
}: {
  permGroups: CommonCodeDetailApi[];
  coTypes: CommonCodeDetailApi[];
  onCancel: () => void;
  onSubmit: (v: {
    name: string;
    username: string;
    email: string;
    phone: string;
    accountType: string;
    permGroup: string;
  }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [checkedUsername, setCheckedUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [accountType, setAccountType] = useState(coTypes[0]?.detailCode ?? "");
  const [permGroup, setPermGroup] = useState(permGroups[0]?.detailCode ?? "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleUsernameChange = (v: string) => {
    setUsername(v);
    setUsernameStatus("idle");
  };

  const handleCheckUsername = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setError("아이디를 입력해주세요.");
      return;
    }
    setUsernameStatus("checking");
    setError("");
    try {
      const { available } = await checkUsernameAvailable(trimmed);
      setUsernameStatus(available ? "available" : "taken");
      setCheckedUsername(trimmed);
    } catch (err) {
      setUsernameStatus("idle");
      setError(err instanceof Error ? err.message : "중복 확인에 실패했습니다.");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !email.trim() || !permGroup) {
      setError("이름·아이디·이메일·권한그룹을 모두 입력해주세요.");
      return;
    }
    if (usernameStatus !== "available" || checkedUsername !== username.trim()) {
      setError("아이디 중복확인을 완료해주세요.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        phone: phone.trim(),
        accountType,
        permGroup,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "계정 추가에 실패했습니다.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="w-full max-w-[380px] rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-bold text-secondary">계정 추가</h3>
          <button type="button" onClick={onCancel} className="text-outline hover:text-on-surface">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <label className={labelClass}>이름</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="이름을 입력하세요" className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>아이디</label>
            <div className="flex gap-2">
              <input
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="로그인 아이디를 입력하세요"
                className={inputClass}
              />
              <button
                type="button"
                onClick={handleCheckUsername}
                disabled={usernameStatus === "checking" || !username.trim()}
                className="shrink-0 rounded-lg border border-primary px-3 py-2 text-[11px] font-bold whitespace-nowrap text-primary transition-all hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {usernameStatus === "checking" ? "확인 중..." : "중복확인"}
              </button>
            </div>
            {usernameStatus === "available" && checkedUsername === username.trim() && (
              <p className="text-[11px] font-semibold text-emerald-600">사용 가능한 아이디입니다.</p>
            )}
            {usernameStatus === "taken" && checkedUsername === username.trim() && (
              <p className="text-[11px] font-semibold text-red-600">이미 사용 중인 아이디입니다.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>이메일</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@motopay.co.kr" className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>휴대폰번호</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-1234-5678" className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>사용자유형</label>
            <select value={accountType} onChange={(e) => setAccountType(e.target.value)} className={inputClass}>
              {coTypes.map((t) => (
                <option key={t.detailCode} value={t.detailCode}>
                  {t.detailName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>권한그룹</label>
            <select value={permGroup} onChange={(e) => setPermGroup(e.target.value)} className={inputClass}>
              {permGroups.map((g) => (
                <option key={g.detailCode} value={g.detailCode}>
                  {g.detailName}
                </option>
              ))}
            </select>
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

function EditAccountModal({
  account,
  permGroups,
  coTypes,
  onCancel,
  onSave,
}: {
  account: AdminAccountListItem;
  permGroups: CommonCodeDetailApi[];
  coTypes: CommonCodeDetailApi[];
  onCancel: () => void;
  onSave: (v: AccountFormValue) => Promise<void>;
}) {
  const [name, setName] = useState(account.name);
  const [email, setEmail] = useState(account.email ?? "");
  const [phone, setPhone] = useState(account.phone ?? "");
  const [accountType, setAccountType] = useState(account.accountType);
  const [permGroup, setPermGroup] = useState(account.permGroup);
  const [useYn, setUseYn] = useState(account.useYn);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await onSave({ name: name.trim(), email: email.trim(), phone: phone.trim(), accountType, permGroup, useYn });
    } catch (err) {
      setError(err instanceof Error ? err.message : "계정 저장에 실패했습니다.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="w-full max-w-[380px] rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-bold text-secondary">계정 상세</h3>
          <button type="button" onClick={onCancel} className="text-outline hover:text-on-surface">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <label className={labelClass}>아이디</label>
            <input value={account.username} disabled className={`${inputClass} cursor-not-allowed bg-surface-container-low text-on-surface-variant`} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>이름</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>이메일</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>휴대폰번호</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-1234-5678" className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>사용자유형</label>
            <select value={accountType} onChange={(e) => setAccountType(e.target.value)} className={inputClass}>
              {coTypes.map((t) => (
                <option key={t.detailCode} value={t.detailCode}>
                  {t.detailName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>권한그룹</label>
            <select value={permGroup} onChange={(e) => setPermGroup(e.target.value)} className={inputClass}>
              {permGroups.map((g) => (
                <option key={g.detailCode} value={g.detailCode}>
                  {g.detailName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>상태</label>
            <select value={useYn ? "active" : "inactive"} onChange={(e) => setUseYn(e.target.value === "active")} className={inputClass}>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
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
            {submitting ? "저장 중..." : "저장"}
          </button>
        </div>
      </form>
    </div>
  );
}

function IssuedPasswordModal({ username, tempPassword, onClose }: { username: string; tempPassword: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[340px] rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="mb-2 text-base font-bold text-secondary">임시 비밀번호 발급</h3>
        <p className="mb-4 text-xs font-medium text-on-surface-variant">
          <span className="font-bold text-on-surface">{username}</span> 계정이 등록되었습니다. 아래 임시 비밀번호를 계정 담당자에게 전달해주세요.
        </p>
        <div className="mb-6 flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3">
          <span className="font-mono text-sm font-bold tracking-widest text-secondary">{tempPassword}</span>
          <button type="button" onClick={copy} className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline">
            <Copy className="h-3.5 w-3.5" />
            {copied ? "복사됨" : "복사"}
          </button>
        </div>
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90">
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserAcctMgmtPage() {
  const gridRef = useRef<AgGridReact<AdminAccountListItem>>(null);

  const [accounts, setAccounts] = useState<AdminAccountListItem[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [permGroups, setPermGroups] = useState<CommonCodeDetailApi[]>([]);
  const [coTypes, setCoTypes] = useState<CommonCodeDetailApi[]>([]);

  const [keyword, setKeyword] = useState("");
  const [accountTypeFilter, setAccountTypeFilter] = useState("all");
  const [permFilter, setPermFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AdminAccountListItem | null>(null);
  const [issued, setIssued] = useState<{ username: string; tempPassword: string } | null>(null);
  const [toast, setToast] = useState("");
  const [globalError, setGlobalError] = useState("");

  const loadAccounts = () => {
    setAccountsLoading(true);
    listAccounts()
      .then(setAccounts)
      .catch((err) => setGlobalError(err instanceof Error ? err.message : "계정 목록을 불러오지 못했습니다."))
      .finally(() => setAccountsLoading(false));
  };

  useEffect(loadAccounts, []);

  useEffect(() => {
    getGroup("PERM_GROUP")
      .then((group) => setPermGroups(group.details.filter((d) => d.useYn)))
      .catch((err) => setGlobalError(err instanceof Error ? err.message : "권한그룹 목록을 불러오지 못했습니다."));
    getGroup("CO_TYPE")
      .then((group) => setCoTypes(group.details.filter((d) => d.useYn)))
      .catch((err) => setGlobalError(err instanceof Error ? err.message : "사용자유형 목록을 불러오지 못했습니다."));
  }, []);

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

  const permGroupLabelMap = useMemo(() => {
    const map = new Map(permGroups.map((g) => [g.detailCode, g.detailName]));
    return (code: string) => map.get(code) ?? code;
  }, [permGroups]);

  const coTypeLabelMap = useMemo(() => {
    const map = new Map(coTypes.map((t) => [t.detailCode, t.detailName]));
    return (code: string) => map.get(code) ?? code;
  }, [coTypes]);

  // SHOP(시공업체)은 PartnerUser 전용 계정이라 관리자 계정의 사용자유형 선택지에서는 제외
  const accountTypeOptions = useMemo(() => coTypes.filter((t) => t.detailCode !== "SHOP"), [coTypes]);

  const filtered = useMemo(() => {
    const kw = keyword.trim();
    return accounts.filter((a) => {
      const matchesKeyword = !kw || a.name.includes(kw) || a.username.includes(kw);
      const matchesAccountType = accountTypeFilter === "all" || a.accountType === accountTypeFilter;
      const matchesPerm = permFilter === "all" || a.permGroup === permFilter;
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? a.useYn : !a.useYn);
      return matchesKeyword && matchesAccountType && matchesPerm && matchesStatus;
    });
  }, [accounts, keyword, accountTypeFilter, permFilter, statusFilter]);

  // 필터가 바뀌어 결과 건수가 줄어들면 이전 페이지가 비어 보일 수 있어 항상 1페이지로 복귀
  useEffect(() => {
    gridRef.current?.api?.paginationGoToFirstPage();
  }, [keyword, accountTypeFilter, permFilter, statusFilter]);

  const toggleStatus = (target: AdminAccountListItem) => {
    const nextUseYn = !target.useYn;
    updateAccount(target.id, { useYn: nextUseYn })
      .then((updated) => {
        setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        setToast(`${target.name} 계정을 ${nextUseYn ? "활성화" : "비활성화"}했습니다.`);
      })
      .catch((err) => setGlobalError(err instanceof Error ? err.message : "상태 변경에 실패했습니다."));
  };

  const gridContext = useMemo<GridContext>(
    () => ({ onToggleStatus: toggleStatus, permGroupLabel: permGroupLabelMap }),
    [permGroupLabelMap],
  );

  const columnDefs = useMemo<ColDef<AdminAccountListItem>[]>(
    () => [
      { headerName: "이름", field: "name", flex: 1, minWidth: 110 },
      { headerName: "아이디", field: "username", flex: 1, minWidth: 120 },
      { headerName: "이메일", field: "email", flex: 1.4, minWidth: 200, valueFormatter: (p) => p.value ?? "-" },
      { headerName: "휴대폰번호", field: "phone", flex: 1, minWidth: 130, valueFormatter: (p) => p.value ?? "-" },
      {
        headerName: "사용자유형",
        field: "accountType",
        flex: 0.9,
        minWidth: 110,
        valueFormatter: (p) => coTypeLabelMap(p.value),
      },
      {
        headerName: "권한그룹",
        field: "permGroup",
        flex: 1,
        minWidth: 120,
        valueFormatter: (p) => (p.value ? permGroupLabelMap(p.value) : "-"),
      },
      {
        headerName: "상태",
        colId: "useYnStatus",
        flex: 0.7,
        minWidth: 100,
        // useYn(boolean)에 field를 그대로 바인딩하면 ag-grid가 자동으로 체크박스 셀로 렌더링해버려
        // valueFormatter로 텍스트를 지정해도 무시된다 — valueGetter로 문자열을 직접 반환해 우회
        valueGetter: (p) => (p.data ? (p.data.useYn ? "활성" : "비활성") : ""),
      },
      {
        headerName: "최근 로그인 일시",
        field: "lastLoginAt",
        flex: 1,
        minWidth: 160,
        valueFormatter: (p) => formatDateTime(p.value ?? null),
      },
      {
        headerName: "관리",
        colId: "actions",
        flex: 0.8,
        minWidth: 110,
        sortable: false,
        resizable: false,
        cellRenderer: ActionsCellRenderer,
        cellClass: "flex items-center justify-end",
      },
    ],
    [permGroupLabelMap, coTypeLabelMap],
  );

  const onCellClicked = (e: CellClickedEvent<AdminAccountListItem>) => {
    if (e.colDef.colId === "actions" || !e.data) return;
    setEditingAccount(e.data);
  };

  const handleAdd = async (v: {
    name: string;
    username: string;
    email: string;
    phone: string;
    accountType: string;
    permGroup: string;
  }) => {
    const { account, tempPassword } = await createAccount({ ...v, phone: v.phone || undefined });
    setAccounts((prev) => [account, ...prev]);
    setShowAddModal(false);
    setIssued({ username: account.username, tempPassword });
  };

  const handleSaveEdit = async (v: AccountFormValue) => {
    if (!editingAccount) return;
    const updated = await updateAccount(editingAccount.id, { ...v, phone: v.phone || undefined });
    setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setEditingAccount(null);
    setToast("계정 정보를 저장했습니다.");
  };

  const handleExcelDownload = () => {
    exportRowsAsXlsx({
      fileName: `사용자_계정_목록_${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: "사용자 계정",
      columns: [
        { header: "이름", key: "name", width: 12 },
        { header: "아이디", key: "username", width: 16 },
        { header: "이메일", key: "email", width: 28 },
        { header: "휴대폰번호", key: "phone", width: 16 },
        { header: "사용자유형", key: "accountType", width: 12 },
        { header: "권한그룹", key: "permGroup", width: 14 },
        { header: "상태", key: "status", width: 10 },
        { header: "최근 로그인 일시", key: "lastLoginAt", width: 20 },
      ],
      rows: filtered.map((a) => ({
        name: a.name,
        username: a.username,
        email: a.email ?? "-",
        phone: a.phone ?? "-",
        accountType: coTypeLabelMap(a.accountType),
        permGroup: permGroupLabelMap(a.permGroup),
        status: a.useYn ? "활성" : "비활성",
        lastLoginAt: formatDateTime(a.lastLoginAt),
      })),
    });
  };

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-8 py-6">
      <PageBreadcrumb path="/system/user-acct-mgmt" />

      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label className={labelClass}>이름·아이디 검색</label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-outline" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="이름 또는 아이디"
                className={`${inputClass} w-56 pl-8`}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>사용자유형</label>
            <select
              value={accountTypeFilter}
              onChange={(e) => setAccountTypeFilter(e.target.value)}
              className={`${inputClass} w-32`}
            >
              <option value="all">전체</option>
              {accountTypeOptions.map((t) => (
                <option key={t.detailCode} value={t.detailCode}>
                  {t.detailName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>권한그룹</label>
            <select value={permFilter} onChange={(e) => setPermFilter(e.target.value)} className={`${inputClass} w-36`}>
              <option value="all">전체</option>
              {permGroups.map((g) => (
                <option key={g.detailCode} value={g.detailCode}>
                  {g.detailName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>상태</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputClass} w-28`}>
              <option value="all">전체</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ExcelActionButton icon={Download} label="엑셀 다운로드" onClick={handleExcelDownload} />
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            disabled={permGroups.length === 0 || accountTypeOptions.length === 0}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-3.5 w-3.5" />
            계정 추가
          </button>
        </div>
      </div>

      <DataGrid<AdminAccountListItem>
        ref={gridRef}
        columnDefs={columnDefs}
        rowData={filtered}
        getRowId={(p) => p.data.id}
        context={gridContext}
        onCellClicked={onCellClicked}
        rowClass="cursor-pointer"
        loading={accountsLoading}
        emptyMessage="조건에 맞는 계정이 없습니다."
      />

      {showAddModal && (
        <AddAccountModal
          permGroups={permGroups}
          coTypes={accountTypeOptions}
          onCancel={() => setShowAddModal(false)}
          onSubmit={handleAdd}
        />
      )}
      {editingAccount && (
        <EditAccountModal
          account={editingAccount}
          permGroups={permGroups}
          coTypes={accountTypeOptions}
          onCancel={() => setEditingAccount(null)}
          onSave={handleSaveEdit}
        />
      )}
      {issued && <IssuedPasswordModal username={issued.username} tempPassword={issued.tempPassword} onClose={() => setIssued(null)} />}

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
