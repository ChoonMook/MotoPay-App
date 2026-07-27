// CU-CS-03: 1:1 문의 등록 - 문의 유형 선택 후 제목·내용·사진 첨부하여 등록
import Button from "../../components/ui/Button";
import CommonHeader from "../common/CommonHeader";
import { PlusIcon } from "./csIcons";
import { INQUIRY_CATEGORIES } from "./csData";

interface InquiryRegScreenProps {
  onBack: () => void;
  cat: string;
  onSelectCat: (cat: string) => void;
  title: string;
  onChangeTitle: (v: string) => void;
  body: string;
  onChangeBody: (v: string) => void;
  onSubmit: () => void;
}

export default function InquiryRegScreen({ onBack, cat, onSelectCat, title, onChangeTitle, body, onChangeBody, onSubmit }: InquiryRegScreenProps) {
  const ok = !!title && !!body;

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <CommonHeader title="1:1 문의 등록" onBack={onBack} />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-5 pb-6">
        <div className="mx-0.5 mb-2.5 text-[13px] font-extrabold text-gray-900">문의 유형</div>
        <div className="flex flex-wrap gap-2">
          {INQUIRY_CATEGORIES.map((c) => {
            const on = cat === c;
            return (
              <span
                key={c}
                onClick={() => onSelectCat(c)}
                className={`cursor-pointer rounded-full px-3.5 py-2 text-[12.5px] ${on ? "bg-brand font-extrabold text-white" : "bg-gray-50 font-semibold text-gray-600"}`}
              >
                {c}
              </span>
            );
          })}
        </div>

        <div className="mx-0.5 mt-5 mb-2 text-[13px] font-extrabold text-gray-900">제목</div>
        <input
          value={title}
          onChange={(e) => onChangeTitle(e.target.value)}
          placeholder="문의 제목을 입력하세요"
          className="w-full rounded-xl border border-gray-400 bg-white px-[15px] py-3.5 text-sm text-gray-900 outline-none"
        />

        <div className="mx-0.5 mt-4 mb-2 text-[13px] font-extrabold text-gray-900">내용</div>
        <textarea
          value={body}
          onChange={(e) => onChangeBody(e.target.value)}
          placeholder="문의 내용을 자세히 알려주세요"
          className="min-h-[140px] w-full resize-none rounded-xl border border-gray-400 bg-white px-3.5 py-[13px] text-[13.5px] leading-relaxed text-gray-900 outline-none placeholder:text-gray-400"
        />

        <div className="mt-3.5 flex items-center gap-2">
          <span className="flex h-16 w-16 flex-none cursor-pointer items-center justify-center rounded-xl border-[1.5px] border-dashed border-gray-400 text-gray-500">
            <PlusIcon />
          </span>
          <span className="text-xs text-gray-500">사진 첨부 · 선택</span>
        </div>
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-6">
        <Button size="xl" disabled={!ok} onClick={onSubmit}>
          {ok ? "문의 등록하기" : "제목과 내용을 입력하세요"}
        </Button>
      </div>
    </div>
  );
}
