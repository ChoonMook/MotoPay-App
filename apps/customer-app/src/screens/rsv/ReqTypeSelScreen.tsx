// CU-RSVC-02: 요청유형 선택(팝업) - 일반 입찰/전문가 추천 분기
import BottomSheet from "../../components/ui/BottomSheet";
import { CloseIcon, ChevronRightIcon } from "./rsvIcons";

const BidIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <rect x="7" y="10" width="3" height="7" />
    <rect x="12" y="6" width="3" height="11" />
  </svg>
);
const RecoIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2 15 8l6 .9-4.5 4.3 1 6.1L12 16.6 6.5 19.3l1-6.1L3 8.9 9 8z" />
  </svg>
);

interface ReqTypeSelScreenProps {
  onClose: () => void;
  onSelectGeneral: () => void;
  onSelectExpert: () => void;
}

export default function ReqTypeSelScreen({ onClose, onSelectGeneral, onSelectExpert }: ReqTypeSelScreenProps) {
  const types = [
    { title: "일반 입찰", desc: "원하는 시공 항목·제품을 직접 고르고 여러 업체의 입찰을 받아 비교해요.", Icon: BidIcon, onClick: onSelectGeneral },
    { title: "전문가 추천", desc: "카테고리와 예산만 알려주면 전문가가 맞춤 견적을 추천해줘요.", Icon: RecoIcon, onClick: onSelectExpert },
  ];

  return (
    <BottomSheet onClose={onClose}>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-lg font-extrabold text-gray-900">어떻게 요청할까요?</span>
        <span onClick={onClose} className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center text-gray-500">
          <CloseIcon />
        </span>
      </div>
      <div className="mb-4 text-[12.5px] text-gray-600">요청 방식을 선택하면 이후 단계가 달라져요.</div>
      <div className="flex flex-col gap-3">
        {types.map((t) => (
          <div
            key={t.title}
            onClick={t.onClick}
            className="flex cursor-pointer items-start gap-3.5 rounded-2xl border-[1.5px] border-gray-200 p-[18px] hover:border-brand hover:bg-brand-subtle"
          >
            <span className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-xl bg-brand-subtle text-brand">
              <t.Icon />
            </span>
            <div className="flex-1">
              <span className="text-[15.5px] font-extrabold text-gray-900">{t.title}</span>
              <div className="mt-1 text-[12.5px] leading-relaxed text-gray-600">{t.desc}</div>
            </div>
            <span className="mt-3 flex-none text-gray-500">
              <ChevronRightIcon />
            </span>
          </div>
        ))}
      </div>
    </BottomSheet>
  );
}
