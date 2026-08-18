// CU-PNT-07: 회원 등급 혜택 - 현재 등급 히어로(실적 프로그레스) + 등급별 혜택 비교 카드
import CommonHeader from "../common/CommonHeader";
import { InfoIcon } from "./pointIcons";
import { GRADE_COLORS } from "./pointData";
import { nfmt } from "./pointFormat";
import type { MyGradeInfoApi } from "../../api/points";

interface GradeBenefitScreenProps {
  onBack: () => void;
  loading: boolean;
  gradeInfo: MyGradeInfoApi | null;
}

export default function GradeBenefitScreen({ onBack, loading, gradeInfo }: GradeBenefitScreenProps) {
  if (loading || !gradeInfo) {
    return (
      <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
        <CommonHeader title="회원 등급 혜택" onBack={onBack} />
        <div className="flex flex-1 items-center justify-center text-sm text-gray-400">불러오는 중...</div>
      </div>
    );
  }

  const { grade, recentSpend, currentThreshold, nextGrade, nextThreshold, tiers } = gradeInfo;
  const displayGrade = grade ?? "일반";
  const heroColor = grade ? GRADE_COLORS[grade] : "#8B95A3";
  const gradeProgressPct =
    nextThreshold !== null && nextThreshold > currentThreshold
      ? Math.max(0, Math.min(100, Math.round(((recentSpend - currentThreshold) / (nextThreshold - currentThreshold)) * 100)))
      : 100;

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <CommonHeader title="회원 등급 혜택" onBack={onBack} />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-[18px] pb-6">
        <div className="rounded-2xl p-5 text-white shadow-md" style={{ background: heroColor }}>
          <span className="rounded-full bg-white/20 px-[10px] py-[3px] text-[11px] font-extrabold">현재 등급</span>
          <div className="mt-2 text-[28px] font-extrabold tracking-tight">{displayGrade}</div>
          <div className="mt-0.5 text-[12.5px] text-white/85">최근 3개월 결제 실적 {nfmt(recentSpend)}원</div>
          <div className="mt-4">
            <div className="h-2 overflow-hidden rounded-full bg-white/28">
              <div className="h-full rounded-full bg-white" style={{ width: `${gradeProgressPct}%` }} />
            </div>
            <div className="mt-[7px] flex justify-between text-[11px] text-white/85">
              <span>{displayGrade}</span>
              {nextGrade && nextThreshold !== null ? (
                <span>
                  다음 {nextGrade}까지 {nfmt(nextThreshold - recentSpend)}원
                </span>
              ) : (
                <span>최고 등급이에요</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3.5 flex items-center gap-2 rounded-[10px] bg-gray-50 px-[13px] py-[11px]">
          <span className="flex-none text-gray-500">
            <InfoIcon />
          </span>
          <span className="text-xs leading-[1.45] text-gray-600">
            등급은 <b>최근 3개월 결제 금액</b> 기준으로 산정돼요.
          </span>
        </div>

        <div className="mx-0.5 mt-[22px] mb-2.5 text-sm font-extrabold text-gray-900">등급별 혜택</div>
        <div className="flex flex-col gap-2.5">
          {tiers.map((t) => {
            const current = t.gradeCode === grade;
            return (
              <div
                key={t.gradeCode}
                className={`rounded-2xl border-[1.5px] p-4 shadow-sm ${current ? "border-brand bg-brand-subtle" : "border-gray-200 bg-white"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 flex-none rounded-full" style={{ background: GRADE_COLORS[t.gradeCode] }} />
                    <span className="text-[15px] font-extrabold text-gray-900">{t.gradeCode}</span>
                    {current && <span className="rounded-[5px] bg-brand px-[7px] py-[2px] text-[9.5px] font-extrabold text-white">MY</span>}
                  </div>
                  <span className="text-[11.5px] font-bold text-gray-500">{nfmt(t.minSpendAmount)}원 이상</span>
                </div>
                <div className="mt-[11px] flex gap-2">
                  <div className="flex-1 rounded-[10px] bg-gray-50 px-[11px] py-[10px]">
                    <div className="text-[10.5px] text-gray-500">시공 할인권</div>
                    <div className="mt-0.5 text-[13px] font-extrabold text-gray-900">{t.discountRate}%</div>
                  </div>
                  <div className="flex-1 rounded-[10px] bg-gray-50 px-[11px] py-[10px]">
                    <div className="text-[10.5px] text-gray-500">월 금액권</div>
                    <div className="mt-0.5 text-[13px] font-extrabold text-gray-900">{nfmt(t.voucherAmount)}원</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
