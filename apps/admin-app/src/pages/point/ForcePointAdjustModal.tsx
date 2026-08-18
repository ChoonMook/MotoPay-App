// 포인트 강제 부여(AD-PNT-04)/강제 차감(AD-PNT-05) 팝업 — 회원 검색 후 금액·사유 입력해 즉시 반영.
// 회원 검색은 AD-MBR-02(고객 회원 목록) API를 그대로 재사용해 클라이언트에서 이름/휴대폰번호로 필터링.
import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { listMembers, type AdminMemberListItem } from "../../api/adminMembers";
import { forceGrantPoints, forceDeductPoints } from "../../api/points";

const inputClass =
  "w-full rounded-lg border border-[#ced4da] bg-white px-3 py-2 text-xs font-normal outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5";
const labelClass = "ml-0.5 text-[11px] font-bold tracking-widest text-secondary uppercase";

function nfmt(n: number): string {
  return n.toLocaleString("en-US");
}

interface ForcePointAdjustModalProps {
  mode: "grant" | "deduct";
  onClose: () => void;
  onDone: () => void;
}

export default function ForcePointAdjustModal({ mode, onClose, onDone }: ForcePointAdjustModalProps) {
  const [members, setMembers] = useState<AdminMemberListItem[]>([]);
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState<AdminMemberListItem | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listMembers()
      .then(setMembers)
      .catch((err) => setError(err instanceof Error ? err.message : "회원 목록을 불러오지 못했습니다."));
  }, []);

  const matches = useMemo(() => {
    const kw = keyword.trim();
    if (!kw || selected) return [];
    return members
      .filter((m) => m.name.includes(kw) || (m.phone ?? "").includes(kw))
      .slice(0, 6);
  }, [keyword, members, selected]);

  const amountNum = Number(amount);
  const amountValid = amount.trim() !== "" && Number.isInteger(amountNum) && amountNum >= 1;
  const exceedsBalance = mode === "deduct" && selected != null && amountValid && amountNum > selected.pointBalance;
  const canSubmit = !!selected && amountValid && !exceedsBalance && reason.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!selected || !canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const fn = mode === "grant" ? forceGrantPoints : forceDeductPoints;
      await fn({ memberId: selected.id, amount: amountNum, reason: reason.trim() });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "처리에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const title = mode === "grant" ? "포인트 강제 부여" : "포인트 강제 차감";
  const actionLabel = mode === "grant" ? "부여" : "차감";

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-[480px] flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-outline-variant/60 px-6 py-4">
          <h3 className="text-base font-bold text-secondary">{title}</h3>
          <button type="button" onClick={onClose} className="text-outline hover:text-on-surface">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-6 py-6">
          <div className="space-y-1.5">
            <label className={labelClass}>회원 검색</label>
            {selected ? (
              <div className="flex items-center justify-between rounded-lg border border-primary/40 bg-primary/5 px-3 py-2.5">
                <div className="text-xs">
                  <span className="font-bold text-secondary">{selected.name}</span>
                  <span className="ml-2 text-on-surface-variant">{selected.phone ?? "-"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(null);
                    setKeyword("");
                  }}
                  className="text-[11px] font-bold text-primary hover:underline"
                >
                  변경
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-outline" />
                  <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="이름 또는 휴대폰번호"
                    className={`${inputClass} pl-8`}
                  />
                </div>
                {matches.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-outline-variant/40 bg-white shadow-lg">
                    {matches.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSelected(m);
                          setKeyword("");
                        }}
                        className="flex w-full items-center justify-between px-3 py-2.5 text-left text-xs hover:bg-surface-container-low"
                      >
                        <span className="font-semibold text-secondary">{m.name}</span>
                        <span className="text-on-surface-variant">{m.phone ?? "-"}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {mode === "deduct" && selected && (
            <div className="rounded-xl bg-surface-container-low px-4 py-3">
              <div className="text-[11px] text-on-surface-variant">현재 보유포인트</div>
              <div className="mt-0.5 text-xl font-extrabold text-secondary tabular-nums">
                {nfmt(selected.pointBalance)}원
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className={labelClass}>{actionLabel} 포인트</label>
            <div className="relative">
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className={`${inputClass} pr-8 text-base font-bold`}
              />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-on-surface-variant">
                원
              </span>
            </div>
            {exceedsBalance && (
              <p className="text-[11px] text-red-500">보유 포인트({nfmt(selected!.pointBalance)}원)를 초과할 수 없습니다.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>{actionLabel} 사유</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="사유를 입력해 주세요"
              className={`${inputClass} resize-none`}
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-outline-variant/60 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-outline-variant px-4 py-2.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container-low"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
