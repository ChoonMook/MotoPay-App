// CU-CS-02: FAQ 조회 - 카테고리별 아코디언 리스트, 답변 미해결 시 1:1 문의로 연결
import CommonHeader from "../common/CommonHeader";
import { InfoIcon, ChevronDownIcon } from "./csIcons";
import { FAQ_CATEGORY_META, FAQ_DEFS } from "./csData";

interface FaqScreenProps {
  onBack: () => void;
  cat: string;
  onSelectCat: (cat: string) => void;
  openMap: Record<string, boolean>;
  onToggle: (id: string) => void;
  onOpenInquiryReg: () => void;
}

export default function FaqScreen({ onBack, cat, onSelectCat, openMap, onToggle, onOpenInquiryReg }: FaqScreenProps) {
  const rows = FAQ_DEFS.filter((f) => cat === "all" || f.cat === cat);

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <CommonHeader title="자주 묻는 질문" onBack={onBack} />

      <div className="mp-scroll flex-none overflow-x-auto border-b border-gray-100 bg-white px-5 py-3">
        <div className="flex gap-1.5">
          {FAQ_CATEGORY_META.map((c) => (
            <span
              key={c.key}
              onClick={() => onSelectCat(c.key)}
              className={`flex-none cursor-pointer rounded-full px-3.5 py-2 text-[12.5px] ${
                cat === c.key ? "bg-brand font-extrabold text-white" : "bg-gray-50 font-semibold text-gray-600"
              }`}
            >
              {c.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-2 pb-6">
        <div className="flex flex-col">
          {rows.map((f) => {
            const open = !!openMap[f.id];
            return (
              <div key={f.id} className="border-b border-gray-100">
                <div onClick={() => onToggle(f.id)} className="flex cursor-pointer items-center gap-2.5 py-[15px]">
                  <span className="text-[13px] font-extrabold text-brand">Q</span>
                  <span className="flex-1 text-[13.5px] font-bold text-gray-900">{f.q}</span>
                  <span className={`text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}>
                    <ChevronDownIcon />
                  </span>
                </div>
                {open && (
                  <div className="flex gap-2.5 pb-4">
                    <span className="text-[13px] font-extrabold text-gray-500">A</span>
                    <span className="flex-1 text-[12.5px] leading-relaxed text-gray-600">{f.a}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-[18px] flex items-start gap-2.5 rounded-xl bg-gray-50 px-[15px] py-3.5">
          <span className="mt-px flex-none text-gray-500">
            <InfoIcon />
          </span>
          <div className="text-xs leading-relaxed text-gray-600">
            원하는 답을 찾지 못하셨나요?{" "}
            <span onClick={onOpenInquiryReg} className="cursor-pointer font-bold text-brand">
              1:1 문의
            </span>
            로 남겨주세요.
          </div>
        </div>
      </div>
    </div>
  );
}
