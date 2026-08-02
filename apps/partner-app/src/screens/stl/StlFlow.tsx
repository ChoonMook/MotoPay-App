// PT-STL-01~03 정산·후기 상태 컨테이너 - 허브↔정산내역조회/후기조회 흐름을 엮음
// 백엔드에 정산/후기 모델이 아직 없어 로컬 state 목업으로만 시연 (rsvc 모듈과 동일한 패턴)
import { useState } from "react";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../components/ui/useToast";
import { INITIAL_REVIEWS, INITIAL_SETTLEMENTS } from "./stlData";
import StlMainScreen from "./StlMainScreen";
import StlHistScreen from "./StlHistScreen";
import StlReviewScreen from "./StlReviewScreen";
import StlDateRangeSheet from "./StlDateRangeSheet";

type Screen = "main" | "hist" | "review";
type PeriodFilter = "all" | "this" | "last" | "custom";
type StatusFilter = "all" | "wait" | "done" | "hold";

interface StlFlowProps {
  onExit: () => void;
  onOpenRsvc: () => void;
  onOpenMyPage: () => void;
}

export default function StlFlow({ onExit, onOpenRsvc, onOpenMyPage }: StlFlowProps) {
  const { toast, showToast } = useToast();
  const [screen, setScreen] = useState<Screen>("main");
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [reviewShown, setReviewShown] = useState(3);
  const [showDatePop, setShowDatePop] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [customLabel, setCustomLabel] = useState("");

  const [settlements] = useState(INITIAL_SETTLEMENTS);
  const [reviews] = useState(INITIAL_REVIEWS);

  const done = settlements.filter((s) => s.status === "done" && s.period === "this");
  const wait = settlements.filter((s) => s.status === "wait" && s.period === "this");
  const monthTotal = [...done, ...wait].reduce((a, s) => a + s.amount, 0);
  const doneAmount = done.reduce((a, s) => a + s.amount, 0);
  const waitAmount = wait.reduce((a, s) => a + s.amount, 0);

  const avgRatingNum = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  const avgRating = avgRatingNum.toFixed(1);
  const reviewCount = reviews.length;

  const histRows = settlements.filter((s) => (period === "all" || s.period === period) && (status === "all" || s.status === status));
  const reviewRows = reviews.slice(0, reviewShown);

  return (
    <div className="absolute inset-0 bg-gray-50">
      {screen === "main" && (
        <StlMainScreen
          monthTotal={monthTotal}
          doneAmount={doneAmount}
          waitAmount={waitAmount}
          avgRating={avgRating}
          reviewCount={reviewCount}
          onOpenHist={() => setScreen("hist")}
          onOpenReview={() => setScreen("review")}
          onOpenHome={onExit}
          onOpenRsvc={onOpenRsvc}
          onOpenMyPage={onOpenMyPage}
          onPlaceholder={(label) => showToast(`${label}으로 이동해요`)}
        />
      )}

      {screen === "hist" && (
        <StlHistScreen
          rows={histRows}
          period={period}
          onChangePeriod={setPeriod}
          customLabel={customLabel}
          status={status}
          onChangeStatus={setStatus}
          onBack={() => setScreen("main")}
          onDownload={() => showToast("현재 필터 기준 엑셀 파일을 생성했어요", "success")}
          onOpenCustomPeriod={() => setShowDatePop(true)}
        />
      )}

      {showDatePop && (
        <StlDateRangeSheet
          dateFrom={dateFrom}
          onChangeDateFrom={setDateFrom}
          dateTo={dateTo}
          onChangeDateTo={setDateTo}
          onClose={() => setShowDatePop(false)}
          onApply={() => {
            setShowDatePop(false);
            setPeriod("custom");
            setCustomLabel(`${dateFrom} ~ ${dateTo}`);
          }}
        />
      )}

      {screen === "review" && (
        <StlReviewScreen
          avgRating={avgRating}
          avgRatingRounded={Math.round(avgRatingNum)}
          reviewCount={reviewCount}
          reviewRows={reviewRows}
          onBack={() => setScreen("main")}
          onLoadMore={() => {
            if (reviewShown >= reviews.length) {
              showToast("더 이상 후기가 없어요");
              return;
            }
            setReviewShown((prev) => Math.min(prev + 2, reviews.length));
          }}
        />
      )}

      {toast && (
        <div className="absolute inset-x-0 bottom-10 z-[90] flex justify-center px-6">
          <Toast tone={toast.tone}>{toast.message}</Toast>
        </div>
      )}
    </div>
  );
}
