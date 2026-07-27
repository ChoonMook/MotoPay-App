// CU-CS-04: 문의 처리현황 조회 - 등록한 문의 이력 목록(답변대기/답변완료 배지), 신규 문의 작성 진입
import Button from "../../components/ui/Button";
import CommonHeader from "../common/CommonHeader";
import type { Inquiry } from "./csTypes";

interface InquiryProcStatScreenProps {
  onBack: () => void;
  inquiries: Inquiry[];
  onOpenItem: (id: string) => void;
  onWriteNew: () => void;
}

export default function InquiryProcStatScreen({ onBack, inquiries, onOpenItem, onWriteNew }: InquiryProcStatScreenProps) {
  const cards = [...inquiries].reverse();

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <CommonHeader title="문의 처리현황" onBack={onBack} />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-4 pb-6">
        <div className="flex flex-col gap-[11px]">
          {cards.map((q) => (
            <div key={q.id} onClick={() => onOpenItem(q.id)} className="cursor-pointer rounded-[14px] border border-gray-200 bg-white p-3.5 shadow-sm">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-bold text-brand">{q.cat}</span>
                <span
                  className={`rounded-md px-[9px] py-[3px] text-[10.5px] font-extrabold ${
                    q.answered ? "bg-status-success-bg text-green-600" : "bg-accent-subtle text-accent-strong"
                  }`}
                >
                  {q.answered ? "답변완료" : "답변대기"}
                </span>
              </div>
              <div className="text-sm font-bold text-gray-800">{q.title}</div>
              <div className="mt-1.5 text-[11.5px] text-gray-500">{q.date}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-6">
        <Button size="xl" onClick={onWriteNew}>
          문의하기
        </Button>
      </div>
    </div>
  );
}
