// 관리자 임의 공지 푸시 발송(AD-CS-04) 팝업 — 푸시 발송 이력(AD-CS-04) 화면 상단 버튼으로 여는 발송 폼.
// 대상 유형(회원/시공업체)과 범위(전체/개별선택)를 고른 뒤 제목·본문을 직접 입력해 발송한다. 쿠폰 발행 팝업
// (CpnIssueModal.tsx)의 "대상 검색 후 칩으로 선택" 패턴을 그대로 재사용하되, 전체 발송은 되돌릴 수 없어 확인
// 단계를 하나 더 둔다(쿠폰 전체발행과 달리 이 기능은 신규라 안전장치를 넣기로 함, 2026-08-20 사용자 확정).
import { useEffect, useMemo, useState } from "react";
import { Send, X } from "lucide-react";
import { sendPushBroadcast } from "../../api/pushBroadcast";
import { listMembers, type AdminMemberListItem } from "../../api/adminMembers";
import { listPartnerUsersForPush, type PartnerUserSearchItem } from "../../api/pushBroadcast";

const inputClass =
  "w-full rounded-lg border border-[#ced4da] bg-white px-3 py-2 text-xs font-normal outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5";
const labelClass = "ml-0.5 text-[11px] font-bold tracking-widest text-secondary uppercase";

interface PushBroadcastModalProps {
  onClose: () => void;
  onDone: (targetCount: number) => void;
}

type TargetType = "USER" | "PARTNER";
type Scope = "ALL" | "INDIVIDUAL";

export default function PushBroadcastModal({ onClose, onDone }: PushBroadcastModalProps) {
  const [members, setMembers] = useState<AdminMemberListItem[]>([]);
  const [partnerUsers, setPartnerUsers] = useState<PartnerUserSearchItem[]>([]);

  const [targetType, setTargetType] = useState<TargetType>("USER");
  const [scope, setScope] = useState<Scope>("ALL");
  const [keyword, setKeyword] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<AdminMemberListItem[]>([]);
  const [selectedPartners, setSelectedPartners] = useState<PartnerUserSearchItem[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [confirmingAll, setConfirmingAll] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([listMembers(), listPartnerUsersForPush()])
      .then(([mem, ptn]) => {
        setMembers(mem);
        setPartnerUsers(ptn);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "기초 데이터를 불러오지 못했습니다."));
  }, []);

  const switchTargetType = (t: TargetType) => {
    setTargetType(t);
    setKeyword("");
    setConfirmingAll(false);
  };

  const memberMatches = useMemo(() => {
    const kw = keyword.trim();
    if (!kw || targetType !== "USER") return [];
    const selectedIds = new Set(selectedMembers.map((m) => m.id));
    return members
      .filter((m) => !selectedIds.has(m.id) && (m.name.includes(kw) || (m.phone ?? "").includes(kw)))
      .slice(0, 6);
  }, [keyword, members, selectedMembers, targetType]);

  const partnerMatches = useMemo(() => {
    const kw = keyword.trim();
    if (!kw || targetType !== "PARTNER") return [];
    const selectedIds = new Set(selectedPartners.map((p) => p.id));
    return partnerUsers
      .filter((p) => !selectedIds.has(p.id) && (p.name.includes(kw) || p.phone.includes(kw) || p.shopName.includes(kw)))
      .slice(0, 6);
  }, [keyword, partnerUsers, selectedPartners, targetType]);

  const selectedCount = targetType === "USER" ? selectedMembers.length : selectedPartners.length;
  const targetValid = scope === "ALL" || selectedCount > 0;
  const canSubmit = title.trim().length > 0 && body.trim().length > 0 && targetValid && !submitting;

  const handleSubmitClick = () => {
    if (!canSubmit) return;
    if (scope === "ALL" && !confirmingAll) {
      setConfirmingAll(true);
      return;
    }
    void doSubmit();
  };

  const doSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const result = await sendPushBroadcast({
        targetType,
        scope,
        ids:
          scope === "INDIVIDUAL"
            ? targetType === "USER"
              ? selectedMembers.map((m) => m.id)
              : selectedPartners.map((p) => p.id)
            : undefined,
        title: title.trim(),
        body: body.trim(),
      });
      onDone(result.targetCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "발송에 실패했습니다.");
      setConfirmingAll(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
      <div className="flex h-full max-h-[85vh] w-full max-w-[560px] flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-outline-variant/60 px-6 py-4">
          <h3 className="text-base font-bold text-secondary">푸시 발송</h3>
          <button type="button" onClick={onClose} className="text-outline hover:text-on-surface">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-5">
            <div className="space-y-1.5">
              <label className={labelClass}>대상 유형</label>
              <div className="flex gap-2">
                {(["USER", "PARTNER"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => switchTargetType(t)}
                    className={`flex-1 rounded-lg border px-3 py-2.5 text-xs font-bold transition-all ${
                      targetType === t
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
                    }`}
                  >
                    {t === "USER" ? "회원" : "시공업체 사용자"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>발송 범위</label>
              <div className="flex gap-2">
                {(["ALL", "INDIVIDUAL"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setScope(s);
                      setConfirmingAll(false);
                    }}
                    className={`flex-1 rounded-lg border px-3 py-2.5 text-xs font-bold transition-all ${
                      scope === s
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
                    }`}
                  >
                    {s === "ALL" ? "전체" : "개별 선택"}
                  </button>
                ))}
              </div>
            </div>

            {scope === "INDIVIDUAL" && (
              <div className="space-y-1.5">
                <label className={labelClass}>대상 검색</label>
                <div className="relative">
                  <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder={targetType === "USER" ? "이름 또는 휴대폰번호" : "이름·휴대폰번호·업체명"}
                    className={inputClass}
                  />
                  {targetType === "USER" && memberMatches.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-outline-variant/40 bg-white shadow-lg">
                      {memberMatches.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setSelectedMembers((prev) => [...prev, m]);
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
                  {targetType === "PARTNER" && partnerMatches.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-outline-variant/40 bg-white shadow-lg">
                      {partnerMatches.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedPartners((prev) => [...prev, p]);
                            setKeyword("");
                          }}
                          className="flex w-full items-center justify-between px-3 py-2.5 text-left text-xs hover:bg-surface-container-low"
                        >
                          <span className="font-semibold text-secondary">
                            {p.name} <span className="font-normal text-on-surface-variant">({p.shopName})</span>
                          </span>
                          <span className="text-on-surface-variant">{p.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {targetType === "USER" && selectedMembers.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedMembers.map((m) => (
                      <span
                        key={m.id}
                        className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary"
                      >
                        {m.name}
                        <button type="button" onClick={() => setSelectedMembers((prev) => prev.filter((x) => x.id !== m.id))}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {targetType === "PARTNER" && selectedPartners.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedPartners.map((p) => (
                      <span
                        key={p.id}
                        className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary"
                      >
                        {p.name}
                        <button type="button" onClick={() => setSelectedPartners((prev) => prev.filter((x) => x.id !== p.id))}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <label className={labelClass}>제목</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="알림 제목" className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>본문</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="알림 본문 내용을 입력해 주세요"
                rows={4}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-3">
              <div className="text-[11px] text-on-surface-variant">발송 대상</div>
              <div className="text-sm font-extrabold text-secondary">
                {scope === "ALL" ? (targetType === "USER" ? "전체 회원" : "전체 시공업체 사용자") : `${selectedCount.toLocaleString("en-US")}명`}
              </div>
            </div>

            {confirmingAll && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
                {targetType === "USER" ? "전체 회원" : "전체 시공업체 사용자"}에게 발송합니다. 되돌릴 수 없으니 내용을 다시 확인해 주세요.
              </div>
            )}

            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-outline-variant/60 px-6 py-4">
          <button
            type="button"
            onClick={confirmingAll ? () => setConfirmingAll(false) : onClose}
            className="rounded-lg border border-outline-variant px-4 py-2.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container-low"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmitClick}
            disabled={!canSubmit}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
            {confirmingAll ? "발송 확정" : "발송"}
          </button>
        </div>
      </div>
    </div>
  );
}
