// 회원 등급 기준 설정(AD-PNT-07) — GOLD/SILVER/BRONZE 등급별 산정기준금액·혜택(할인권/금액권) 설정.
// 회원 등급을 실제로 계산·부여하는 산정 엔진은 아직 없어 이 화면은 설정값 저장 전용이다(2026-08-18 사용자 확정) —
// 나중에 산정 로직을 구현할 때 이 값을 참조한다.
import { useEffect, useMemo, useState } from "react";
import { Check, Save } from "lucide-react";
import { listMemberGradeRules, updateMemberGradeRule, type MemberGradeRuleApi } from "../../api/memberGradeRules";
import PageBreadcrumb from "../../components/PageBreadcrumb";

const labelClass = "ml-0.5 text-[11px] font-bold tracking-widest text-secondary uppercase";

// customer-app pointData.ts GRADE_COLORS와 동일한 값(등급 체계 색상 통일)
const GRADE_META: Record<string, { label: string; color: string }> = {
  GOLD: { label: "골드", color: "#C79A3B" },
  SILVER: { label: "실버", color: "#8B95A3" },
  BRONZE: { label: "브론즈", color: "#A9713F" },
};
const GRADE_ORDER = ["GOLD", "SILVER", "BRONZE"];

interface RowState {
  gradeCode: string;
  minSpendAmount: string;
  discountRate: string;
  voucherAmount: string;
}

function toRowState(r: MemberGradeRuleApi): RowState {
  return {
    gradeCode: r.gradeCode,
    minSpendAmount: String(r.minSpendAmount),
    discountRate: String(r.discountRate),
    voucherAmount: String(r.voucherAmount),
  };
}

function isValidInt(v: string): boolean {
  return v.trim() !== "" && Number.isInteger(Number(v)) && Number(v) >= 0;
}

export default function GradeRuleSetPage() {
  const [original, setOriginal] = useState<MemberGradeRuleApi[]>([]);
  const [rows, setRows] = useState<RowState[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const load = () => {
    setLoading(true);
    listMemberGradeRules()
      .then((list) => {
        const sorted = [...list].sort(
          (a, b) => GRADE_ORDER.indexOf(a.gradeCode) - GRADE_ORDER.indexOf(b.gradeCode),
        );
        setOriginal(sorted);
        setRows(sorted.map(toRowState));
      })
      .catch((err) => setErrorMsg(err instanceof Error ? err.message : "설정을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!errorMsg) return;
    const t = setTimeout(() => setErrorMsg(""), 3200);
    return () => clearTimeout(t);
  }, [errorMsg]);

  const invalidCodes = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      if (!isValidInt(r.minSpendAmount) || !isValidInt(r.discountRate) || !isValidInt(r.voucherAmount)) {
        set.add(r.gradeCode);
      }
    }
    return set;
  }, [rows]);

  const updateRow = (gradeCode: string, patch: Partial<RowState>) => {
    setRows((prev) => prev.map((r) => (r.gradeCode === gradeCode ? { ...r, ...patch } : r)));
  };

  const isDirty = useMemo(() => {
    if (rows.length !== original.length) return false;
    return rows.some((r) => {
      const src = original.find((o) => o.gradeCode === r.gradeCode);
      if (!src) return false;
      return (
        String(src.minSpendAmount) !== r.minSpendAmount ||
        String(src.discountRate) !== r.discountRate ||
        String(src.voucherAmount) !== r.voucherAmount
      );
    });
  }, [rows, original]);

  const handleSave = async () => {
    if (invalidCodes.size > 0) {
      setErrorMsg("모든 값을 0 이상의 숫자로 입력해 주세요.");
      return;
    }
    setSaving(true);
    try {
      await Promise.all(
        rows.map((r) =>
          updateMemberGradeRule(r.gradeCode, {
            minSpendAmount: Number(r.minSpendAmount),
            discountRate: Number(r.discountRate),
            voucherAmount: Number(r.voucherAmount),
          }),
        ),
      );
      setToast("저장되었습니다.");
      load();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-8 py-6">
      <PageBreadcrumb path="/point/mbr-grade-rule-cfg" />

      <div className="flex items-center justify-between">
        <p className="text-xs text-on-surface-variant">등급별 산정 기준금액과 혜택(시공 할인권·월 금액권)을 설정합니다.</p>
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || saving || !isDirty}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Save className="h-3.5 w-3.5" />
          저장
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-on-surface-variant">불러오는 중...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {rows.map((r) => {
            const meta = GRADE_META[r.gradeCode] ?? { label: r.gradeCode, color: "#8B95A3" };
            const invalid = invalidCodes.has(r.gradeCode);
            return (
              <div
                key={r.gradeCode}
                className="flex flex-col gap-4 rounded-2xl border-t-4 bg-white p-5 shadow-sm"
                style={{ borderTopColor: meta.color }}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                  <span className="text-base font-extrabold text-secondary">{meta.label}</span>
                  <span className="text-[11px] text-on-surface-variant">({r.gradeCode})</span>
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>산정 기준금액</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      value={r.minSpendAmount}
                      onChange={(e) => updateRow(r.gradeCode, { minSpendAmount: e.target.value })}
                      className="w-full rounded-lg border border-[#ced4da] bg-white px-3 py-2 pr-8 text-xs outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
                    />
                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-on-surface-variant">
                      원
                    </span>
                  </div>
                  <p className="text-[10.5px] text-on-surface-variant">최근 3개월 누적 지출 기준</p>
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>혜택 · 시공 할인권</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      value={r.discountRate}
                      onChange={(e) => updateRow(r.gradeCode, { discountRate: e.target.value })}
                      className="w-full rounded-lg border border-[#ced4da] bg-white px-3 py-2 pr-8 text-xs outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
                    />
                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-on-surface-variant">
                      %
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>혜택 · 월 금액권</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      value={r.voucherAmount}
                      onChange={(e) => updateRow(r.gradeCode, { voucherAmount: e.target.value })}
                      className="w-full rounded-lg border border-[#ced4da] bg-white px-3 py-2 pr-8 text-xs outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
                    />
                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-on-surface-variant">
                      원
                    </span>
                  </div>
                </div>

                {invalid && <p className="text-[11px] text-red-500">모든 값을 0 이상의 숫자로 입력해 주세요.</p>}
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <div className="fixed right-6 bottom-6 z-[999] flex items-center gap-1.5 rounded-lg bg-secondary px-4 py-3 text-xs font-bold text-white shadow-xl">
          <Check className="h-3.5 w-3.5" />
          {toast}
        </div>
      )}
      {errorMsg && (
        <div className="fixed right-6 bottom-6 z-[999] rounded-lg bg-red-600 px-4 py-3 text-xs font-bold text-white shadow-xl">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
