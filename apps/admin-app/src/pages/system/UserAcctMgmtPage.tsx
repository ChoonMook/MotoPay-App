// 사용자 계정 관리 (uploads/MotoPay_프로그램목록표_v1_43.xlsx "관리자웹_프로그램" 시트 AD-SYS-04 스펙 이식)
// [구성요소] 상단 필터 바(이름·아이디 검색/권한그룹/상태) + 하단 목록 테이블(페이징) — 대상은 업체에 속하지 않는
// 운영사 자체 직원 계정만(업체 소속 계정은 AD-CO-05에서 별도 관리)
// [인터랙션] 계정 추가 시 임시비밀번호 발급 후 안내 / 행 클릭 시 계정 상세 수정 팝업(권한그룹 변경 포함) /
// 비활성화는 즉시 토글 적용
// 이번 작업 범위상 실 API 연동 없이 정적 목업 데이터로 구성
// 목록 그리드는 관리자웹 표준 컴포넌트인 components/DataGrid.tsx(ag-grid-community 기반)를 사용한다
import { useEffect, useMemo, useRef, useState } from "react";
import type { AgGridReact } from "ag-grid-react";
import type { CellClickedEvent, ColDef, ICellRendererParams } from "ag-grid-community";
import { Copy, Download, Plus, Search, X } from "lucide-react";
import DataGrid from "../../components/DataGrid";
import ExcelActionButton from "../../components/ExcelActionButton";
import { exportRowsAsXlsx } from "../../lib/exportXlsx";
import PageBreadcrumb from "../../components/PageBreadcrumb";

type AcctStatus = "active" | "inactive";

interface UserAccount {
  id: string;
  name: string;
  username: string;
  email: string;
  permGroup: string;
  status: AcctStatus;
  lastLoginAt: string | null;
}

// 권한 관리(AD-CO-06)에서 정의하는 권한그룹과 동일한 값을 참조 — 로그인 화면(AD-AUTH-01) 설계 고려사항의
// "슈퍼관리자/MD/CS 등" 예시를 그대로 목업 그룹으로 사용
const PERMISSION_GROUPS = ["슈퍼관리자", "운영 MD", "CS 운영자", "정산 담당자"];

const MOCK_ACCOUNTS: UserAccount[] = [
  { id: "1", name: "김도현", username: "dhkim", email: "dhkim@motopay.co.kr", permGroup: "슈퍼관리자", status: "active", lastLoginAt: "2026-08-07 08:52" },
  { id: "2", name: "이서연", username: "syeon.lee", email: "syeon.lee@motopay.co.kr", permGroup: "운영 MD", status: "active", lastLoginAt: "2026-08-06 17:10" },
  { id: "3", name: "박준서", username: "jspark", email: "jspark@motopay.co.kr", permGroup: "CS 운영자", status: "active", lastLoginAt: "2026-08-06 09:41" },
  { id: "4", name: "최민아", username: "mina.choi", email: "mina.choi@motopay.co.kr", permGroup: "정산 담당자", status: "inactive", lastLoginAt: "2026-06-11 14:02" },
  { id: "5", name: "정하윤", username: "hayoon.jung", email: "hayoon.jung@motopay.co.kr", permGroup: "운영 MD", status: "active", lastLoginAt: "2026-08-05 11:27" },
  { id: "6", name: "강태오", username: "taeoh.kang", email: "taeoh.kang@motopay.co.kr", permGroup: "CS 운영자", status: "active", lastLoginAt: null },
  { id: "7", name: "윤소율", username: "soyul.yoon", email: "soyul.yoon@motopay.co.kr", permGroup: "정산 담당자", status: "active", lastLoginAt: "2026-08-04 16:33" },
  { id: "8", name: "장민준", username: "minjun.jang", email: "minjun.jang@motopay.co.kr", permGroup: "운영 MD", status: "inactive", lastLoginAt: "2026-05-02 10:15" },
  { id: "9", name: "임채원", username: "chaewon.lim", email: "chaewon.lim@motopay.co.kr", permGroup: "CS 운영자", status: "active", lastLoginAt: "2026-08-07 07:58" },
  { id: "10", name: "한지호", username: "jiho.han", email: "jiho.han@motopay.co.kr", permGroup: "슈퍼관리자", status: "active", lastLoginAt: "2026-08-03 13:44" },
];

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

const inputClass =
  "w-full rounded-lg border border-[#ced4da] bg-white px-3 py-2 text-xs font-normal outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5";
const labelClass = "ml-0.5 text-[11px] font-bold tracking-widest text-secondary uppercase";

interface GridContext {
  onToggleStatus: (target: UserAccount) => void;
}

function ActionsCellRenderer({ data, context }: ICellRendererParams<UserAccount>) {
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
        data.status === "active" ? "text-on-surface-variant hover:text-on-surface" : "text-primary hover:text-primary/80"
      }`}
    >
      {data.status === "active" ? "비활성화" : "활성화"}
    </button>
  );
}

interface AccountFormValue {
  name: string;
  email: string;
  permGroup: string;
  status: AcctStatus;
}

function AddAccountModal({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (v: { name: string; username: string; email: string; permGroup: string }) => void }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [permGroup, setPermGroup] = useState(PERMISSION_GROUPS[0]);
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !email.trim()) {
      setError("이름·아이디·이메일을 모두 입력해주세요.");
      return;
    }
    onSubmit({ name: name.trim(), username: username.trim(), email: email.trim(), permGroup });
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
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="로그인 아이디를 입력하세요" className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>이메일</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@motopay.co.kr" className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>권한그룹</label>
            <select value={permGroup} onChange={(e) => setPermGroup(e.target.value)} className={inputClass}>
              {PERMISSION_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
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
          <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90">
            추가
          </button>
        </div>
      </form>
    </div>
  );
}

function EditAccountModal({ account, onCancel, onSave }: { account: UserAccount; onCancel: () => void; onSave: (v: AccountFormValue) => void }) {
  const [name, setName] = useState(account.name);
  const [email, setEmail] = useState(account.email);
  const [permGroup, setPermGroup] = useState(account.permGroup);
  const [status, setStatus] = useState<AcctStatus>(account.status);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name: name.trim(), email: email.trim(), permGroup, status });
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
            <label className={labelClass}>권한그룹</label>
            <select value={permGroup} onChange={(e) => setPermGroup(e.target.value)} className={inputClass}>
              {PERMISSION_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>상태</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as AcctStatus)} className={inputClass}>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg bg-surface-container-high px-4 py-2 text-xs font-bold text-on-surface transition-all hover:bg-surface-dim">
            취소
          </button>
          <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90">
            저장
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
  const gridRef = useRef<AgGridReact<UserAccount>>(null);

  const [accounts, setAccounts] = useState<UserAccount[]>(MOCK_ACCOUNTS);
  const [keyword, setKeyword] = useState("");
  const [permFilter, setPermFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<UserAccount | null>(null);
  const [issued, setIssued] = useState<{ username: string; tempPassword: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    const kw = keyword.trim();
    return accounts.filter((a) => {
      const matchesKeyword = !kw || a.name.includes(kw) || a.username.includes(kw);
      const matchesPerm = permFilter === "all" || a.permGroup === permFilter;
      const matchesStatus = statusFilter === "all" || a.status === statusFilter;
      return matchesKeyword && matchesPerm && matchesStatus;
    });
  }, [accounts, keyword, permFilter, statusFilter]);

  // 필터가 바뀌어 결과 건수가 줄어들면 이전 페이지가 비어 보일 수 있어 항상 1페이지로 복귀
  useEffect(() => {
    gridRef.current?.api?.paginationGoToFirstPage();
  }, [keyword, permFilter, statusFilter]);

  const toggleStatus = (target: UserAccount) => {
    const next: AcctStatus = target.status === "active" ? "inactive" : "active";
    setAccounts((prev) => prev.map((a) => (a.id === target.id ? { ...a, status: next } : a)));
    setToast(`${target.name} 계정을 ${next === "active" ? "활성화" : "비활성화"}했습니다.`);
  };

  const gridContext = useMemo<GridContext>(() => ({ onToggleStatus: toggleStatus }), []);

  const columnDefs = useMemo<ColDef<UserAccount>[]>(
    () => [
      { headerName: "이름", field: "name", flex: 1, minWidth: 110 },
      { headerName: "아이디", field: "username", flex: 1, minWidth: 120 },
      { headerName: "이메일", field: "email", flex: 1.4, minWidth: 200 },
      { headerName: "권한그룹", field: "permGroup", flex: 1, minWidth: 120 },
      {
        headerName: "상태",
        field: "status",
        flex: 0.7,
        minWidth: 100,
        valueFormatter: (p) => (p.value === "active" ? "활성" : "비활성"),
      },
      {
        headerName: "최근 로그인 일시",
        field: "lastLoginAt",
        flex: 1,
        minWidth: 160,
        valueFormatter: (p) => p.value ?? "-",
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
    [],
  );

  const onCellClicked = (e: CellClickedEvent<UserAccount>) => {
    if (e.colDef.colId === "actions" || !e.data) return;
    setEditingAccount(e.data);
  };

  const handleAdd = (v: { name: string; username: string; email: string; permGroup: string }) => {
    const newAccount: UserAccount = { id: `${Date.now()}`, ...v, status: "active", lastLoginAt: null };
    setAccounts((prev) => [newAccount, ...prev]);
    setShowAddModal(false);
    setIssued({ username: v.username, tempPassword: generateTempPassword() });
  };

  const handleSaveEdit = (v: AccountFormValue) => {
    if (!editingAccount) return;
    setAccounts((prev) => prev.map((a) => (a.id === editingAccount.id ? { ...a, ...v } : a)));
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
        { header: "권한그룹", key: "permGroup", width: 14 },
        { header: "상태", key: "status", width: 10 },
        { header: "최근 로그인 일시", key: "lastLoginAt", width: 20 },
      ],
      rows: filtered.map((a) => ({
        name: a.name,
        username: a.username,
        email: a.email,
        permGroup: a.permGroup,
        status: a.status === "active" ? "활성" : "비활성",
        lastLoginAt: a.lastLoginAt ?? "-",
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
            <label className={labelClass}>권한그룹</label>
            <select value={permFilter} onChange={(e) => setPermFilter(e.target.value)} className={`${inputClass} w-36`}>
              <option value="all">전체</option>
              {PERMISSION_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
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
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" />
            계정 추가
          </button>
        </div>
      </div>

      <DataGrid<UserAccount>
        ref={gridRef}
        columnDefs={columnDefs}
        rowData={filtered}
        getRowId={(p) => p.data.id}
        context={gridContext}
        onCellClicked={onCellClicked}
        rowClass="cursor-pointer"
        emptyMessage="조건에 맞는 계정이 없습니다."
      />

      {showAddModal && <AddAccountModal onCancel={() => setShowAddModal(false)} onSubmit={handleAdd} />}
      {editingAccount && <EditAccountModal account={editingAccount} onCancel={() => setEditingAccount(null)} onSave={handleSaveEdit} />}
      {issued && <IssuedPasswordModal username={issued.username} tempPassword={issued.tempPassword} onClose={() => setIssued(null)} />}

      {toast && (
        <div className="fixed right-6 bottom-6 z-[999] rounded-lg bg-secondary px-4 py-3 text-xs font-bold text-white shadow-xl">{toast}</div>
      )}
    </div>
  );
}
