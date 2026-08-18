// 고객앱 "고객센터" 5개 화면(CU-CS-01~05)을 엮는 상태 컨테이너 (RsvFlow.tsx와 동일 패턴)
import { useEffect, useState } from "react";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../components/ui/useToast";
import PhotoLightbox from "../../components/ui/PhotoLightbox";
import { pushBackAction } from "../../native/backHandler";
import { getCommonCodeDetails, type CommonCodeDetailApi } from "../../api/commonCodes";
import { createInquiry, listMyInquiries, updateInquiry } from "../../api/inquiries";
import { listFaqs } from "../../api/faqs";
import CSScreen from "./CSScreen";
import FaqScreen from "./FaqScreen";
import InquiryRegScreen from "./InquiryRegScreen";
import InquiryProcStatScreen from "./InquiryProcStatScreen";
import InquiryDtlScreen from "./InquiryDtlScreen";
import { formatDotDate, fromPhotoUrl, toPhotoUrl, type FaqItem } from "./csData";
import type { CsScreenId, Inquiry } from "./csTypes";

interface CsFlowProps {
  onExit: () => void;
}

export default function CsFlow({ onExit }: CsFlowProps) {
  const [screen, setScreen] = useState<CsScreenId>("main");
  const [faqCat, setFaqCat] = useState("all");
  const [faqOpen, setFaqOpen] = useState<Record<string, boolean>>({});
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [inquiryCategories, setInquiryCategories] = useState<CommonCodeDetailApi[]>([]);
  const [inqCat, setInqCat] = useState("");
  const [inqTitleVal, setInqTitleVal] = useState("");
  const [inqBodyVal, setInqBodyVal] = useState("");
  const [inqPhotos, setInqPhotos] = useState<string[]>([]);
  const [editTargetNo, setEditTargetNo] = useState<string | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [inquiryDtlId, setInquiryDtlId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);

  const { toast, showToast } = useToast();

  const categoryLabel = (code: string): string =>
    inquiryCategories.find((c) => c.detailCode === code)?.detailName ?? code;

  const toUiInquiry = (row: {
    inquiryNo: string;
    category: string;
    title: string;
    content: string;
    status: string;
    answer: string | null;
    createdAt: string;
    photos: string[];
  }): Inquiry => ({
    id: row.inquiryNo,
    cat: row.category,
    title: row.title,
    date: formatDotDate(row.createdAt),
    answered: row.status === "ANSWERED",
    body: row.content,
    answer: row.answer ?? undefined,
    photos: row.photos,
  });

  useEffect(() => {
    getCommonCodeDetails("INQUIRY_CATEGORY")
      .then((rows) => {
        setInquiryCategories(rows);
        setInqCat((prev) => prev || rows[0]?.detailCode || "");
      })
      .catch((err) => showToast(err instanceof Error ? err.message : "문의 유형 정보를 불러오지 못했어요", "danger"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFaqs = () => {
    listFaqs()
      .then((rows) => setFaqs(rows.map((r) => ({ id: String(r.id), cat: r.category, q: r.question, a: r.answer }))))
      .catch((err) => showToast(err instanceof Error ? err.message : "FAQ를 불러오지 못했어요", "danger"));
  };

  const loadInquiries = () => {
    listMyInquiries()
      .then((rows) => setInquiries(rows.map(toUiInquiry)))
      .catch((err) => showToast(err instanceof Error ? err.message : "문의 내역을 불러오지 못했어요", "danger"));
  };

  const goMain = () => setScreen("main");
  // 매번 최신 데이터를 다시 조회 — 이전 진입 때 불러온 목록이 그대로 남아있지 않도록
  const goFaq = () => {
    setScreen("faq");
    loadFaqs();
  };
  const goInquiryStat = () => {
    setScreen("inquirystat");
    loadInquiries();
  };
  const goInquiryReg = () => {
    setEditTargetNo(null);
    setInqCat((prev) => prev || inquiryCategories[0]?.detailCode || "");
    setInqTitleVal("");
    setInqBodyVal("");
    setInqPhotos([]);
    setScreen("inquiryreg");
  };
  const goInquiryEdit = (inquiry: Inquiry) => {
    setEditTargetNo(inquiry.id);
    setInqCat(inquiry.cat);
    setInqTitleVal(inquiry.title);
    setInqBodyVal(inquiry.body);
    setInqPhotos(inquiry.photos.map(toPhotoUrl));
    setScreen("inquiryreg");
  };

  const curInquiry = inquiries.find((q) => q.id === inquiryDtlId) || inquiries[0];

  // 하드웨어 백버튼: 각 화면 상단 '‹' 버튼의 onBack과 동일한 대상으로 이동.
  // main은 등록하지 않아도 App.tsx의 기본 백핸들러(view==="cs" → myp)가 onBack={onExit}와 동일하게 동작함
  useEffect(() => {
    switch (screen) {
      case "faq":
      case "inquirystat":
        return pushBackAction(goMain);
      case "inquiryreg":
        return pushBackAction(() => setScreen(editTargetNo ? "inquirydtl" : "main"));
      case "inquirydtl":
        return pushBackAction(goInquiryStat);
      default:
        return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, editTargetNo]);

  const submitInquiry = async () => {
    if (!inqTitleVal || !inqBodyVal || submitting) return;
    setSubmitting(true);
    try {
      if (editTargetNo) {
        const updated = await updateInquiry(editTargetNo, {
          category: inqCat,
          title: inqTitleVal,
          content: inqBodyVal,
          photos: inqPhotos.map(fromPhotoUrl),
        });
        setInquiries((prev) => prev.map((q) => (q.id === editTargetNo ? toUiInquiry(updated) : q)));
        showToast("문의가 수정됐어요", "success");
        setInquiryDtlId(editTargetNo);
        setScreen("inquirydtl");
      } else {
        await createInquiry({ category: inqCat, title: inqTitleVal, content: inqBodyVal, photos: inqPhotos });
        showToast("문의가 등록됐어요", "success");
        goInquiryStat();
      }
      setInqTitleVal("");
      setInqBodyVal("");
      setInqPhotos([]);
      setEditTargetNo(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "처리에 실패했어요", "danger");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden">
      {screen === "main" && (
        <CSScreen
          onBack={onExit}
          onOpenFaq={goFaq}
          onOpenInquiryReg={goInquiryReg}
          onOpenInquiryStat={goInquiryStat}
        />
      )}

      {screen === "faq" && (
        <FaqScreen
          onBack={goMain}
          faqs={faqs}
          cat={faqCat}
          onSelectCat={setFaqCat}
          openMap={faqOpen}
          onToggle={(id) => setFaqOpen((prev) => ({ ...prev, [id]: !prev[id] }))}
          onOpenInquiryReg={goInquiryReg}
        />
      )}

      {screen === "inquiryreg" && (
        <InquiryRegScreen
          onBack={() => setScreen(editTargetNo ? "inquirydtl" : "main")}
          editing={!!editTargetNo}
          categories={inquiryCategories}
          cat={inqCat}
          onSelectCat={setInqCat}
          title={inqTitleVal}
          onChangeTitle={setInqTitleVal}
          body={inqBodyVal}
          onChangeBody={setInqBodyVal}
          photos={inqPhotos}
          onAddPhoto={(dataUri) => setInqPhotos((prev) => (prev.length < 5 ? [...prev, dataUri] : prev))}
          onRemovePhoto={(i) => setInqPhotos((prev) => prev.filter((_, idx) => idx !== i))}
          onViewPhoto={setViewingPhotoUrl}
          onError={(msg) => showToast(msg, "danger")}
          onSubmit={submitInquiry}
          submitting={submitting}
        />
      )}

      {screen === "inquirystat" && (
        <InquiryProcStatScreen
          onBack={goMain}
          inquiries={inquiries}
          categoryLabel={categoryLabel}
          onOpenItem={(id) => {
            setInquiryDtlId(id);
            setScreen("inquirydtl");
          }}
          onWriteNew={goInquiryReg}
        />
      )}

      {screen === "inquirydtl" && curInquiry && (
        <InquiryDtlScreen
          onBack={goInquiryStat}
          inquiry={curInquiry}
          categoryLabel={categoryLabel}
          onEdit={() => goInquiryEdit(curInquiry)}
          onViewPhoto={setViewingPhotoUrl}
        />
      )}

      <PhotoLightbox photoUrl={viewingPhotoUrl} onClose={() => setViewingPhotoUrl(null)} />

      {toast && (
        <div className="absolute inset-x-0 bottom-10 z-[90] flex justify-center px-6">
          <Toast tone={toast.tone}>{toast.message}</Toast>
        </div>
      )}
    </div>
  );
}
