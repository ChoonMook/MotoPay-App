// CU-CS-05: 1:1 문의 상세 - 작성한 문의 내용과 답변완료 시 고객센터 답변 확인, 답변 등록 전(PENDING)에는 수정 가능
import CommonHeader from "../common/CommonHeader";
import { InfoIcon } from "./csIcons";
import { toPhotoUrl } from "./csData";
import type { Inquiry } from "./csTypes";

interface InquiryDtlScreenProps {
  onBack: () => void;
  inquiry: Inquiry;
  categoryLabel: (code: string) => string;
  onEdit: () => void;
  onViewPhoto: (url: string) => void;
}

export default function InquiryDtlScreen({ onBack, inquiry, categoryLabel, onEdit, onViewPhoto }: InquiryDtlScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <CommonHeader title="문의 상세" onBack={onBack} />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-5 pb-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11.5px] font-bold text-brand">{categoryLabel(inquiry.cat)}</span>
          <span
            className={`rounded-md px-[9px] py-[3px] text-[10.5px] font-extrabold ${
              inquiry.answered ? "bg-status-success-bg text-green-600" : "bg-accent-subtle text-accent-strong"
            }`}
          >
            {inquiry.answered ? "답변완료" : "답변대기"}
          </span>
        </div>
        <div className="text-[16.5px] font-extrabold text-gray-900">{inquiry.title}</div>
        <div className="mt-1.5 border-b border-gray-100 pb-4 text-[11.5px] text-gray-500">{inquiry.date}</div>
        <div className="mt-4 text-[13.5px] leading-relaxed text-gray-600">{inquiry.body}</div>

        {inquiry.photos.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {inquiry.photos.map((path) => {
              const url = toPhotoUrl(path);
              return (
                <img
                  key={path}
                  src={url}
                  alt="첨부 사진"
                  onClick={() => onViewPhoto(url)}
                  className="h-16 w-16 cursor-pointer rounded-xl object-cover"
                />
              );
            })}
          </div>
        )}

        {inquiry.answered ? (
          <div className="mt-5 rounded-xl bg-brand-subtle p-[15px]">
            <div className="mb-1.5 text-[12.5px] font-extrabold text-brand">모토페이 고객센터 답변</div>
            <div className="text-[13px] leading-relaxed text-gray-600">{inquiry.answer}</div>
          </div>
        ) : (
          <>
            <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-gray-50 px-[15px] py-3.5">
              <span className="mt-px flex-none text-gray-500">
                <InfoIcon />
              </span>
              <div className="text-xs leading-relaxed text-gray-600">
                평균 <b>1~2영업일 이내</b> 답변드려요. 답변이 등록되면 알림으로 안내해 드릴게요.
              </div>
            </div>
            <span
              onClick={onEdit}
              className="mt-4 flex h-12 w-full cursor-pointer items-center justify-center rounded-xl border border-gray-300 text-sm font-bold text-gray-800"
            >
              문의 수정하기
            </span>
          </>
        )}
      </div>
    </div>
  );
}
