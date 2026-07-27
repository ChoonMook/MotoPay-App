// 고객앱 "고객센터" 5개 화면(CU-CS-01~05)을 엮는 상태 컨테이너 (RsvFlow.tsx와 동일 패턴)
import { useEffect, useState } from "react";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../components/ui/useToast";
import { pushBackAction } from "../../native/backHandler";
import CSScreen from "./CSScreen";
import FaqScreen from "./FaqScreen";
import InquiryRegScreen from "./InquiryRegScreen";
import InquiryProcStatScreen from "./InquiryProcStatScreen";
import InquiryDtlScreen from "./InquiryDtlScreen";
import { INITIAL_INQUIRIES, INQUIRY_CATEGORIES } from "./csData";
import type { CsScreenId, Inquiry } from "./csTypes";

interface CsFlowProps {
  onExit: () => void;
}

export default function CsFlow({ onExit }: CsFlowProps) {
  const [screen, setScreen] = useState<CsScreenId>("main");
  const [faqCat, setFaqCat] = useState("all");
  const [faqOpen, setFaqOpen] = useState<Record<string, boolean>>({});
  const [inqCat, setInqCat] = useState(INQUIRY_CATEGORIES[0]);
  const [inqTitleVal, setInqTitleVal] = useState("");
  const [inqBodyVal, setInqBodyVal] = useState("");
  const [inquiries, setInquiries] = useState<Inquiry[]>(INITIAL_INQUIRIES);
  const [inquiryDtlId, setInquiryDtlId] = useState("q1");

  const { toast, showToast } = useToast();

  const goMain = () => setScreen("main");
  const goInquiryReg = () => {
    setInqTitleVal("");
    setInqBodyVal("");
    setScreen("inquiryreg");
  };

  const curInquiry = inquiries.find((q) => q.id === inquiryDtlId) || inquiries[0];

  // 하드웨어 백버튼: 각 화면 상단 '‹' 버튼의 onBack과 동일한 대상으로 이동.
  // main은 등록하지 않아도 App.tsx의 기본 백핸들러(view==="cs" → myp)가 onBack={onExit}와 동일하게 동작함
  useEffect(() => {
    switch (screen) {
      case "faq":
      case "inquiryreg":
      case "inquirystat":
        return pushBackAction(goMain);
      case "inquirydtl":
        return pushBackAction(() => setScreen("inquirystat"));
      default:
        return;
    }
  }, [screen]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {screen === "main" && (
        <CSScreen
          onBack={onExit}
          onOpenFaq={() => setScreen("faq")}
          onOpenInquiryReg={goInquiryReg}
          onOpenInquiryStat={() => setScreen("inquirystat")}
        />
      )}

      {screen === "faq" && (
        <FaqScreen
          onBack={goMain}
          cat={faqCat}
          onSelectCat={setFaqCat}
          openMap={faqOpen}
          onToggle={(id) => setFaqOpen((prev) => ({ ...prev, [id]: !prev[id] }))}
          onOpenInquiryReg={goInquiryReg}
        />
      )}

      {screen === "inquiryreg" && (
        <InquiryRegScreen
          onBack={goMain}
          cat={inqCat}
          onSelectCat={setInqCat}
          title={inqTitleVal}
          onChangeTitle={setInqTitleVal}
          body={inqBodyVal}
          onChangeBody={setInqBodyVal}
          onSubmit={() => {
            if (!inqTitleVal || !inqBodyVal) return;
            const id = `q${Date.now()}`;
            setInquiries((prev) => [...prev, { id, cat: inqCat, title: inqTitleVal, date: "2026.07.22", answered: false, body: inqBodyVal }]);
            setInqTitleVal("");
            setInqBodyVal("");
            showToast("문의가 등록됐어요", "success");
            setScreen("inquirystat");
          }}
        />
      )}

      {screen === "inquirystat" && (
        <InquiryProcStatScreen
          onBack={goMain}
          inquiries={inquiries}
          onOpenItem={(id) => {
            setInquiryDtlId(id);
            setScreen("inquirydtl");
          }}
          onWriteNew={goInquiryReg}
        />
      )}

      {screen === "inquirydtl" && <InquiryDtlScreen onBack={() => setScreen("inquirystat")} inquiry={curInquiry} />}

      {toast && (
        <div className="absolute inset-x-0 bottom-10 z-[90] flex justify-center px-6">
          <Toast tone={toast.tone}>{toast.message}</Toast>
        </div>
      )}
    </div>
  );
}
