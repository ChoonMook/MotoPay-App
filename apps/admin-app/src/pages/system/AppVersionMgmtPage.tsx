// 앱버전관리(AD-SYS-06) — 플랫폼별 최소 지원 버전을 관리해, 그 미만 버전을 쓰는 고객은 앱 강제 업데이트 화면으로 차단
// [구성요소] 플랫폼(현재 ANDROID)별 카드 1개 — 사용여부 토글 + 최소/최신 버전 + 다운로드 URL + 안내 문구
// apps/api(/admin/app-version-policies/*)와 연동된 실 데이터 화면
import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { listAppVersionPolicies, updateAppVersionPolicy, type AppVersionPolicy } from "../../api/appVersion";
import PageBreadcrumb from "../../components/PageBreadcrumb";

const inputClass =
  "w-full rounded-lg border border-[#ced4da] bg-white px-3 py-2 text-xs font-normal outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5";
const labelClass = "ml-0.5 text-[11px] font-bold tracking-widest text-secondary uppercase";

interface EditableForm {
  minVersionCode: string;
  minVersionName: string;
  latestVersionCode: string;
  latestVersionName: string;
  downloadUrl: string;
  message: string;
  useYn: boolean;
}

function toForm(p: AppVersionPolicy): EditableForm {
  return {
    minVersionCode: String(p.minVersionCode),
    minVersionName: p.minVersionName,
    latestVersionCode: p.latestVersionCode !== null ? String(p.latestVersionCode) : "",
    latestVersionName: p.latestVersionName ?? "",
    downloadUrl: p.downloadUrl,
    message: p.message,
    useYn: p.useYn,
  };
}

function PolicyCard({ policy, onSaved }: { policy: AppVersionPolicy; onSaved: (p: AppVersionPolicy) => void }) {
  const [form, setForm] = useState<EditableForm>(() => toForm(policy));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const patch = (v: Partial<EditableForm>) => setForm((prev) => ({ ...prev, ...v }));

  const save = async () => {
    const minVersionCode = Number(form.minVersionCode);
    if (!Number.isInteger(minVersionCode) || minVersionCode < 0) {
      setError("최소 지원 버전코드는 0 이상의 정수여야 합니다.");
      return;
    }
    if (!form.minVersionName.trim()) {
      setError("최소 지원 버전명을 입력해주세요.");
      return;
    }
    if (!form.message.trim()) {
      setError("안내 문구를 입력해주세요.");
      return;
    }
    const latestVersionCode = form.latestVersionCode.trim() ? Number(form.latestVersionCode) : null;
    if (form.latestVersionCode.trim() && !Number.isInteger(latestVersionCode)) {
      setError("최신 버전코드는 정수여야 합니다.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const updated = await updateAppVersionPolicy(policy.platform, {
        minVersionCode,
        minVersionName: form.minVersionName.trim(),
        latestVersionCode,
        latestVersionName: form.latestVersionName.trim() || null,
        downloadUrl: form.downloadUrl.trim(),
        message: form.message.trim(),
        useYn: form.useYn,
      });
      onSaved(updated);
      setForm(toForm(updated));
      setToast("저장했습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="rounded-md bg-secondary px-2.5 py-1 text-[11px] font-extrabold tracking-widest text-white">
            {policy.platform}
          </span>
          <h3 className="text-sm font-extrabold text-on-surface">강제 업데이트 정책</h3>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-on-surface">
          <input type="checkbox" checked={form.useYn} onChange={(e) => patch({ useYn: e.target.checked })} className="h-4 w-4 accent-primary" />
          강제 업데이트 사용
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className={labelClass}>최소 지원 버전코드</label>
          <input
            value={form.minVersionCode}
            onChange={(e) => patch({ minVersionCode: e.target.value })}
            placeholder="예: 3"
            className={`${inputClass} font-mono`}
          />
          <p className="ml-0.5 text-[11px] text-on-surface-variant">이 값 미만(versionCode)으로 접속하면 강제 업데이트 화면을 띄웁니다.</p>
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>최소 지원 버전명</label>
          <input
            value={form.minVersionName}
            onChange={(e) => patch({ minVersionName: e.target.value })}
            placeholder="예: 0.0.0.3"
            className={`${inputClass} font-mono`}
          />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>최신 버전코드(참고용)</label>
          <input
            value={form.latestVersionCode}
            onChange={(e) => patch({ latestVersionCode: e.target.value })}
            placeholder="선택 입력"
            className={`${inputClass} font-mono`}
          />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>최신 버전명(참고용)</label>
          <input
            value={form.latestVersionName}
            onChange={(e) => patch({ latestVersionName: e.target.value })}
            placeholder="선택 입력"
            className={`${inputClass} font-mono`}
          />
        </div>
        <div className="col-span-2 space-y-1.5">
          <label className={labelClass}>다운로드 URL</label>
          <input
            value={form.downloadUrl}
            onChange={(e) => patch({ downloadUrl: e.target.value })}
            placeholder="예: http://221.141.3.91:8092/uploads/motopay-app/motopay-latest.apk"
            className={`${inputClass} font-mono`}
          />
          <p className="ml-0.5 text-[11px] text-on-surface-variant">
            아직 스토어에 출시되지 않아 직접 배포 중 — 강제 업데이트 화면의 "업데이트" 버튼이 이 URL을 엽니다.
          </p>
        </div>
        <div className="col-span-2 space-y-1.5">
          <label className={labelClass}>안내 문구</label>
          <textarea
            value={form.message}
            onChange={(e) => patch({ message: e.target.value })}
            rows={3}
            placeholder="예: 새로운 버전이 있어요. 계속 이용하시려면 앱을 업데이트해주세요."
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      {error && <p className="mt-4 text-[12px] font-semibold text-red-600">{error}</p>}

      <div className="mt-5 flex items-center justify-between">
        <p className="text-[11px] text-on-surface-variant">
          {policy.updatedBy ? `최종 수정: ${policy.updatedBy} · ${new Date(policy.updatedAt).toLocaleString("ko-KR")}` : "아직 수정 이력이 없습니다."}
        </p>
        <div className="flex items-center gap-3">
          {toast && <span className="text-[11px] font-bold text-primary">{toast}</span>}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-40"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppVersionMgmtPage() {
  const [policies, setPolicies] = useState<AppVersionPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listAppVersionPolicies()
      .then(setPolicies)
      .catch((err) => setError(err instanceof Error ? err.message : "버전 정책을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  const handleSaved = (updated: AppVersionPolicy) => {
    setPolicies((prev) => prev.map((p) => (p.platform === updated.platform ? updated : p)));
  };

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-8 py-6">
      <PageBreadcrumb path="/system/app-version-mgmt" />

      <div className="flex max-w-2xl flex-col gap-4">
        {loading && <p className="py-10 text-center text-[12px] text-on-surface-variant">불러오는 중...</p>}
        {error && <p className="py-10 text-center text-[12px] font-semibold text-red-600">{error}</p>}
        {!loading && !error && policies.map((p) => <PolicyCard key={p.platform} policy={p} onSaved={handleSaved} />)}
      </div>
    </div>
  );
}
