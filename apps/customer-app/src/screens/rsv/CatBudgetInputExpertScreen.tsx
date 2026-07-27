// CU-RSVC-07: 카테고리+예산 입력(전문가 추천) - 카테고리 다중 선택 + 전체 예산 입력 + 요청사항(선택)
import Button from "../../components/ui/Button";
import RsvHeader from "./RsvHeader";
import { CAT_DEFS } from "./rsvTypes";
import { nfmt, parseDigits } from "./rsvFormat";

const STEP_LABELS = ["항목 선택", "조건 입력", "입찰 비교"];
const BUDGET_CHIPS: Array<[number, string]> = [
  [200000, "20만"],
  [300000, "30만"],
  [500000, "50만"],
  [1000000, "100만"],
];

interface CatBudgetInputExpertScreenProps {
  catCats: Record<string, boolean>;
  budget: number;
  catReq: string;
  onToggleCat: (name: string) => void;
  onBudgetChange: (n: number) => void;
  onCatReqChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function CatBudgetInputExpertScreen({
  catCats,
  budget,
  catReq,
  onToggleCat,
  onBudgetChange,
  onCatReqChange,
  onBack,
  onNext,
}: CatBudgetInputExpertScreenProps) {
  const catOk = Object.values(catCats).some(Boolean) && budget > 0;

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <RsvHeader title="전문가 추천 요청" onBack={onBack} steps={STEP_LABELS} current={0} />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-[18px] pb-6">
        <div className="mb-4 rounded-[10px] bg-gray-100 px-[13px] py-[11px] text-[13px] leading-[1.45] text-gray-600">
          전문가 추천은 개별 제품이 아닌 <b>카테고리와 예산</b> 기준으로 요청해요. 예산에 맞춰 전문가가 견적을 추천해드려요.
        </div>

        <div className="mx-0.5 mb-2.5 text-sm font-extrabold text-gray-900">
          관심 카테고리 <span className="text-[11px] font-bold text-brand">· 복수 선택</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {CAT_DEFS.map((name) => {
            const on = !!catCats[name];
            return (
              <span
                key={name}
                onClick={() => onToggleCat(name)}
                className={`cursor-pointer rounded-full px-[15px] py-[9px] text-[13px] ${
                  on ? "bg-brand font-extrabold text-white" : "bg-gray-100 font-semibold text-gray-600"
                }`}
              >
                {name}
              </span>
            );
          })}
        </div>

        <div className="mx-0.5 mt-[22px] mb-2.5 text-sm font-extrabold text-gray-900">전체 예산</div>
        <div className="flex items-center gap-2 rounded-xl border border-gray-400 bg-white px-3.5">
          <input
            value={nfmt(budget)}
            onChange={(e) => onBudgetChange(parseDigits(e.target.value))}
            inputMode="numeric"
            className="flex-1 border-none bg-transparent py-[13px] text-base font-bold text-gray-900 tabular-nums outline-none"
          />
          <span className="text-sm font-bold text-gray-500">원</span>
        </div>
        <div className="mt-[9px] flex gap-[7px]">
          {BUDGET_CHIPS.map(([v, label]) => {
            const on = budget === v;
            return (
              <span
                key={v}
                onClick={() => onBudgetChange(v)}
                className={`flex-1 rounded-[9px] py-[9px] text-center text-[12.5px] font-semibold ${
                  on ? "bg-brand-subtle font-extrabold text-brand ring-[1.5px] ring-brand ring-inset" : "bg-gray-100 text-gray-600"
                }`}
              >
                {label}
              </span>
            );
          })}
        </div>

        <div className="mx-0.5 mt-[22px] mb-2.5 flex items-center gap-1.5 text-sm font-extrabold text-gray-900">
          요청사항 <span className="text-[11px] font-semibold text-gray-500">· 선택</span>
        </div>
        <textarea
          value={catReq}
          onChange={(e) => onCatReqChange(e.target.value)}
          placeholder="예) 수입차 전용 제품 위주로 추천해주세요"
          className="min-h-[88px] w-full resize-none rounded-xl border border-gray-400 bg-white px-3.5 py-[13px] text-[13.5px] leading-relaxed text-gray-900 outline-none placeholder:text-gray-400"
        />
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-6">
        <Button size="xl" disabled={!catOk} onClick={onNext}>
          {catOk ? "조건 입력으로" : "카테고리·예산을 입력하세요"}
        </Button>
      </div>
    </div>
  );
}
