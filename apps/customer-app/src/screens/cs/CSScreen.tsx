// CU-CS-01: 고객센터 주화면 - FAQ·1:1문의 등록·문의 처리현황 메뉴 카드, 전화 상담 안내
// 원본 dc.html은 별도 하단내비 없이 디자인 툴의 화면목록으로만 진입/이탈했지만, 실제 앱에서는 마이페이지에서 진입하므로
// 뒤로가기 버튼을 헤더에 추가함(캔버스에 없는 요소지만 모듈을 벗어날 다른 수단이 없어 기능상 반드시 필요)
import { BackIcon } from "../common/commonIcons";
import { FaqIcon, InquiryRegIcon, InquiryStatIcon, PhoneIcon, ChevronRightIcon } from "./csIcons";

interface CSScreenProps {
  onBack: () => void;
  onOpenFaq: () => void;
  onOpenInquiryReg: () => void;
  onOpenInquiryStat: () => void;
}

export default function CSScreen({ onBack, onOpenFaq, onOpenInquiryReg, onOpenInquiryStat }: CSScreenProps) {
  const menuCards = [
    { icon: <FaqIcon />, title: "자주 묻는 질문", desc: "많이 묻는 질문의 답을 바로 확인해보세요", onClick: onOpenFaq },
    { icon: <InquiryRegIcon />, title: "1:1 문의 등록", desc: "궁금한 점을 직접 남기고 답변받아요", onClick: onOpenInquiryReg },
    { icon: <InquiryStatIcon />, title: "문의 처리현황 조회", desc: "남긴 문의의 답변 상태를 확인해요", onClick: onOpenInquiryStat },
  ];

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex h-[98px] flex-none items-center gap-1.5 border-b border-gray-100 bg-white px-2.5 pt-[46px]">
        <span onClick={onBack} className="flex h-9 w-9 cursor-pointer items-center justify-center text-gray-800">
          <BackIcon />
        </span>
        <span className="text-[19px] font-extrabold tracking-tight text-gray-900">고객센터</span>
      </div>

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-3 pb-[26px]">
        <div className="rounded-2xl bg-gradient-to-br from-brand to-brand-strong p-[18px] text-white">
          <div className="text-[15.5px] font-extrabold tracking-tight">무엇을 도와드릴까요?</div>
          <div className="mt-[5px] text-[12.5px] leading-relaxed text-white/88">
            자주 묻는 질문을 먼저 확인하시면
            <br />
            더 빠르게 답을 찾을 수 있어요
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          {menuCards.map((m) => (
            <div key={m.title} onClick={m.onClick} className="flex cursor-pointer items-center gap-[13px] rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-brand-subtle text-brand">{m.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] font-extrabold text-gray-900">{m.title}</div>
                <div className="mt-[3px] text-xs leading-[1.4] text-gray-600">{m.desc}</div>
              </div>
              <span className="flex-none text-gray-500">
                <ChevronRightIcon />
              </span>
            </div>
          ))}
        </div>

        <div className="mt-[22px] flex items-center gap-2.5 rounded-xl bg-gray-50 px-[15px] py-3.5">
          <span className="flex-none text-gray-500">
            <PhoneIcon />
          </span>
          <div className="text-xs leading-relaxed text-gray-600">
            전화 상담 <b className="text-gray-900">1544-0000</b> · 평일 09:00~18:00 (주말·공휴일 휴무)
          </div>
        </div>
      </div>
    </div>
  );
}
