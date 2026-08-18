// CU-CS-03: 1:1 문의 등록/수정 - 문의 유형 선택 후 제목·내용·사진 첨부, 답변 등록 전(PENDING)에는 같은 화면으로 수정
import Button from "../../components/ui/Button";
import CommonHeader from "../common/CommonHeader";
import PhotoUploadGrid from "../../components/ui/PhotoUploadGrid";
import type { CommonCodeDetailApi } from "../../api/commonCodes";

interface InquiryRegScreenProps {
  onBack: () => void;
  editing: boolean;
  categories: CommonCodeDetailApi[];
  cat: string;
  onSelectCat: (cat: string) => void;
  title: string;
  onChangeTitle: (v: string) => void;
  body: string;
  onChangeBody: (v: string) => void;
  photos: string[];
  onAddPhoto: (dataUri: string) => void;
  onRemovePhoto: (index: number) => void;
  onViewPhoto: (url: string) => void;
  onError: (message: string) => void;
  onSubmit: () => void;
  submitting?: boolean;
}

export default function InquiryRegScreen({
  onBack,
  editing,
  categories,
  cat,
  onSelectCat,
  title,
  onChangeTitle,
  body,
  onChangeBody,
  photos,
  onAddPhoto,
  onRemovePhoto,
  onViewPhoto,
  onError,
  onSubmit,
  submitting = false,
}: InquiryRegScreenProps) {
  const ok = !!title && !!body && !submitting;

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <CommonHeader title={editing ? "1:1 문의 수정" : "1:1 문의 등록"} onBack={onBack} />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-5 pb-6">
        <div className="mx-0.5 mb-2.5 text-[13px] font-extrabold text-gray-900">문의 유형</div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const on = cat === c.detailCode;
            return (
              <span
                key={c.detailCode}
                onClick={() => onSelectCat(c.detailCode)}
                className={`cursor-pointer rounded-full px-3.5 py-2 text-[12.5px] ${on ? "bg-brand font-extrabold text-white" : "bg-gray-50 font-semibold text-gray-600"}`}
              >
                {c.detailName}
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

        <div className="mx-0.5 mt-4 mb-2 text-[13px] font-extrabold text-gray-900">사진 첨부 (선택, 최대 5장)</div>
        <PhotoUploadGrid photos={photos} onAddPhoto={onAddPhoto} onRemovePhoto={onRemovePhoto} onViewPhoto={onViewPhoto} onError={onError} />
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-6">
        <Button size="xl" disabled={!ok} onClick={onSubmit}>
          {submitting ? "처리 중..." : ok ? (editing ? "수정 완료" : "문의 등록하기") : "제목과 내용을 입력하세요"}
        </Button>
      </div>
    </div>
  );
}
