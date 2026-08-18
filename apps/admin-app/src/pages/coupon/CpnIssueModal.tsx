// 쿠폰 발행(AD-CPN-02) 팝업 — 쿠폰 발행 내역(AD-CPN-03) 화면에서 여는 발행 폼. URL경로가 "-"인 팝업 액션이라
// 독립 메뉴가 아니라 이 화면 상단 버튼으로 노출한다(포인트 강제 부여/차감과 동일한 컨벤션, 2026-08-18 사용자 확정).
// 쿠폰 유형 선택, 대상고객(전체/조건별/개별선택)·유효기간·발행수량(미리보기) 설정 후 발행. 딜러사 요청 프로모션
// 쿠폰도 이 팝업에서 운영사가 대행 발행(발행주체=딜러사 선택).
import { useEffect, useMemo, useState } from "react";
import { Eye, Send, X } from "lucide-react";
import { issueCoupon, previewCouponTargetCount } from "../../api/coupons";
import { getGroup, type CommonCodeDetailApi } from "../../api/commonCodes";
import { listCompanies, type CompanyListItem } from "../../api/companies";
import { listMembers, type AdminMemberListItem } from "../../api/adminMembers";

const inputClass =
  "w-full rounded-lg border border-[#ced4da] bg-white px-3 py-2 text-xs font-normal outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5";
const labelClass = "ml-0.5 text-[11px] font-bold tracking-widest text-secondary uppercase";

const GRADE_META: Record<string, { label: string; color: string }> = {
  GOLD: { label: "골드", color: "#C79A3B" },
  SILVER: { label: "실버", color: "#8B95A3" },
  BRONZE: { label: "브론즈", color: "#A9713F" },
};
const GRADE_ORDER = ["GOLD", "SILVER", "BRONZE"];

interface CpnIssueModalProps {
  onClose: () => void;
  onDone: (issuedCount: number) => void;
}

export default function CpnIssueModal({ onClose, onDone }: CpnIssueModalProps) {
  const [couponTypes, setCouponTypes] = useState<CommonCodeDetailApi[]>([]);
  const [issuerTypes, setIssuerTypes] = useState<CommonCodeDetailApi[]>([]);
  const [targetTypes, setTargetTypes] = useState<CommonCodeDetailApi[]>([]);
  const [dealers, setDealers] = useState<CompanyListItem[]>([]);
  const [members, setMembers] = useState<AdminMemberListItem[]>([]);

  const [name, setName] = useState("");
  const [couponType, setCouponType] = useState("DISCOUNT");
  const [discountValue, setDiscountValue] = useState("");
  const [issuerType, setIssuerType] = useState("OPERATOR");
  const [issuerCompanyId, setIssuerCompanyId] = useState("");
  const [targetType, setTargetType] = useState("ALL");
  const [targetGrade, setTargetGrade] = useState("GOLD");
  const [memberKeyword, setMemberKeyword] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<AdminMemberListItem[]>([]);
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");

  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      getGroup("COUPON_TYPE"),
      getGroup("COUPON_ISSUER_TYPE"),
      getGroup("COUPON_TARGET_TYPE"),
      listCompanies(),
      listMembers(),
    ])
      .then(([ct, it, tt, companies, mem]) => {
        setCouponTypes(ct.details.filter((d) => d.useYn));
        setIssuerTypes(it.details.filter((d) => d.useYn));
        setTargetTypes(tt.details.filter((d) => d.useYn));
        setDealers(companies.filter((c) => c.coType === "DEALER" && c.useYn));
        setMembers(mem);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "기초 데이터를 불러오지 못했습니다."));
  }, []);

  useEffect(() => {
    setPreviewCount(null);
  }, [targetType, targetGrade]);

  const memberMatches = useMemo(() => {
    const kw = memberKeyword.trim();
    if (!kw) return [];
    const selectedIds = new Set(selectedMembers.map((m) => m.id));
    return members
      .filter((m) => !selectedIds.has(m.id) && (m.name.includes(kw) || (m.phone ?? "").includes(kw)))
      .slice(0, 6);
  }, [memberKeyword, members, selectedMembers]);

  const addMember = (m: AdminMemberListItem) => {
    setSelectedMembers((prev) => [...prev, m]);
    setMemberKeyword("");
  };
  const removeMember = (id: string) => {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const discountValueValid =
    couponType === "EXCHANGE" ||
    (discountValue.trim() !== "" && Number.isInteger(Number(discountValue)) && Number(discountValue) >= 1);
  const dealerValid = issuerType !== "DEALER" || issuerCompanyId !== "";
  const targetValid =
    targetType === "ALL" ||
    (targetType === "CONDITION" && !!targetGrade) ||
    (targetType === "INDIVIDUAL" && selectedMembers.length > 0);
  const dateValid = !!validFrom && !!validTo && validFrom <= validTo;
  const canSubmit =
    name.trim().length > 0 && discountValueValid && dealerValid && targetValid && dateValid && !submitting;

  const handlePreview = async () => {
    if (targetType === "INDIVIDUAL") return;
    setPreviewing(true);
    try {
      const count = await previewCouponTargetCount(targetType, targetType === "CONDITION" ? targetGrade : undefined);
      setPreviewCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "미리보기에 실패했습니다.");
    } finally {
      setPreviewing(false);
    }
  };

  const displayCount = targetType === "INDIVIDUAL" ? selectedMembers.length : previewCount;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await issueCoupon({
        name: name.trim(),
        couponType,
        discountValue: couponType === "EXCHANGE" ? undefined : Number(discountValue),
        issuerType,
        issuerCompanyId: issuerType === "DEALER" ? Number(issuerCompanyId) : undefined,
        targetType,
        targetGrade: targetType === "CONDITION" ? targetGrade : undefined,
        memberIds: targetType === "INDIVIDUAL" ? selectedMembers.map((m) => m.id) : undefined,
        validFrom,
        validTo,
      });
      onDone(result.issuedCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "발행에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
      <div className="flex h-full max-h-[85vh] w-full max-w-[560px] flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-outline-variant/60 px-6 py-4">
          <h3 className="text-base font-bold text-secondary">쿠폰 발행</h3>
          <button type="button" onClick={onClose} className="text-outline hover:text-on-surface">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-5">
            <div className="space-y-1.5">
              <label className={labelClass}>쿠폰명</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="쿠폰명을 입력해 주세요" className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>쿠폰유형</label>
                <select value={couponType} onChange={(e) => setCouponType(e.target.value)} className={inputClass}>
                  {couponTypes.map((t) => (
                    <option key={t.detailCode} value={t.detailCode}>
                      {t.detailName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>{couponType === "AMOUNT" ? "할인 금액" : "할인율"}</label>
                {couponType === "EXCHANGE" ? (
                  <div className="flex h-[34px] items-center text-xs text-on-surface-variant">교환권은 별도 입력이 필요 없어요</div>
                ) : (
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder="0"
                      className={`${inputClass} pr-8`}
                    />
                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-on-surface-variant">
                      {couponType === "AMOUNT" ? "원" : "%"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>발행주체</label>
                <select value={issuerType} onChange={(e) => setIssuerType(e.target.value)} className={inputClass}>
                  {issuerTypes.map((t) => (
                    <option key={t.detailCode} value={t.detailCode}>
                      {t.detailName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>딜러사</label>
                <select
                  value={issuerCompanyId}
                  onChange={(e) => setIssuerCompanyId(e.target.value)}
                  disabled={issuerType !== "DEALER"}
                  className={`${inputClass} disabled:opacity-40`}
                >
                  <option value="">선택하세요</option>
                  {dealers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>대상고객</label>
              <select value={targetType} onChange={(e) => setTargetType(e.target.value)} className={inputClass}>
                {targetTypes.map((t) => (
                  <option key={t.detailCode} value={t.detailCode}>
                    {t.detailName}
                  </option>
                ))}
              </select>
            </div>

            {targetType === "CONDITION" && (
              <div className="space-y-1.5">
                <label className={labelClass}>대상 등급</label>
                <select value={targetGrade} onChange={(e) => setTargetGrade(e.target.value)} className={inputClass}>
                  {GRADE_ORDER.map((g) => (
                    <option key={g} value={g}>
                      {GRADE_META[g].label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {targetType === "INDIVIDUAL" && (
              <div className="space-y-1.5">
                <label className={labelClass}>대상 회원 검색</label>
                <div className="relative">
                  <input
                    value={memberKeyword}
                    onChange={(e) => setMemberKeyword(e.target.value)}
                    placeholder="이름 또는 휴대폰번호"
                    className={inputClass}
                  />
                  {memberMatches.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-outline-variant/40 bg-white shadow-lg">
                      {memberMatches.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => addMember(m)}
                          className="flex w-full items-center justify-between px-3 py-2.5 text-left text-xs hover:bg-surface-container-low"
                        >
                          <span className="font-semibold text-secondary">{m.name}</span>
                          <span className="text-on-surface-variant">{m.phone ?? "-"}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedMembers.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedMembers.map((m) => (
                      <span
                        key={m.id}
                        className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary"
                      >
                        {m.name}
                        <button type="button" onClick={() => removeMember(m.id)}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>유효기간(시작)</label>
                <input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>유효기간(종료)</label>
                <input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} className={inputClass} />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-3">
              <div>
                <div className="text-[11px] text-on-surface-variant">예상 발행 인원</div>
                <div className="text-lg font-extrabold text-secondary tabular-nums">
                  {displayCount !== null ? `${displayCount.toLocaleString("en-US")}명` : "-"}
                </div>
              </div>
              {targetType !== "INDIVIDUAL" && (
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={previewing || (targetType === "CONDITION" && !targetGrade)}
                  className="flex items-center gap-1.5 rounded-lg border border-outline-variant px-4 py-2.5 text-xs font-bold text-on-surface-variant hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Eye className="h-3.5 w-3.5" />
                  대상고객 미리보기
                </button>
              )}
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-outline-variant/60 px-6 py-4">
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
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
            발행
          </button>
        </div>
      </div>
    </div>
  );
}
