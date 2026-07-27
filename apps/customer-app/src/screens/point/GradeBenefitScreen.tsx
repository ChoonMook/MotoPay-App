// CU-PNT-07: 회원 등급 혜택 - 현재 등급 히어로(실적 프로그레스) + 등급별 혜택 비교 카드
import CommonHeader from "../common/CommonHeader";
import { InfoIcon } from "./pointIcons";
import { GRADE, NEXT_GRADE, NEXT_THRESHOLD, RECENT_SPEND, GRADE_COLORS, TIERS } from "./pointData";
import { nfmt } from "./pointFormat";

const gradeProgressPct = Math.round(((RECENT_SPEND - 2000000) / (NEXT_THRESHOLD - 2000000)) * 100);

interface GradeBenefitScreenProps {
  onBack: () => void;
}

export default function GradeBenefitScreen({ onBack }: GradeBenefitScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <CommonHeader title="회원 등급 혜택" onBack={onBack} />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-[18px] pb-6">
        <div className="rounded-2xl p-5 text-white shadow-md" style={{ background: GRADE_COLORS[GRADE] }}>
          <span className="rounded-full bg-white/20 px-[10px] py-[3px] text-[11px] font-extrabold">현재 등급</span>
          <div className="mt-2 text-[28px] font-extrabold tracking-tight">{GRADE}</div>
          <div className="mt-0.5 text-[12.5px] text-white/85">최근 3개월 사용 실적 {nfmt(RECENT_SPEND)}원</div>
          <div className="mt-4">
            <div className="h-2 overflow-hidden rounded-full bg-white/28">
              <div className="h-full rounded-full bg-white" style={{ width: `${gradeProgressPct}%` }} />
            </div>
            <div className="mt-[7px] flex justify-between text-[11px] text-white/85">
              <span>{GRADE}</span>
              <span>
                다음 {NEXT_GRADE}까지 {nfmt(NEXT_THRESHOLD - RECENT_SPEND)}원
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3.5 flex items-center gap-2 rounded-[10px] bg-gray-50 px-[13px] py-[11px]">
          <span className="flex-none text-gray-500">
            <InfoIcon />
          </span>
          <span className="text-xs leading-[1.45] text-gray-600">
            등급은 <b>최근 3개월 포인트 사용금액</b> 기준으로 매월 산정돼요.
          </span>
        </div>

        <div className="mx-0.5 mt-[22px] mb-2.5 text-sm font-extrabold text-gray-900">등급별 혜택</div>
        <div className="flex flex-col gap-2.5">
          {TIERS.map((t) => {
            const current = t.name === GRADE;
            return (
              <div
                key={t.name}
                className={`rounded-2xl border-[1.5px] p-4 shadow-sm ${current ? "border-brand bg-brand-subtle" : "border-gray-200 bg-white"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 flex-none rounded-full" style={{ background: GRADE_COLORS[t.name] }} />
                    <span className="text-[15px] font-extrabold text-gray-900">{t.name}</span>
                    {current && <span className="rounded-[5px] bg-brand px-[7px] py-[2px] text-[9.5px] font-extrabold text-white">MY</span>}
                  </div>
                  <span className="text-[11.5px] font-bold text-gray-500">{t.cond}</span>
                </div>
                <div className="mt-[11px] flex gap-2">
                  {t.perks.map((p) => (
                    <div key={p.label} className="flex-1 rounded-[10px] bg-gray-50 px-[11px] py-[10px]">
                      <div className="text-[10.5px] text-gray-500">{p.label}</div>
                      <div className="mt-0.5 text-[13px] font-extrabold text-gray-900">{p.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
