// PT-STL-01~03 정산·후기 상태 컨테이너 - 허브↔정산내역조회/후기조회 흐름을 엮음
// 후기 조회(PT-STL-03)는 /shops/me/reviews 실 API 연동, 정산내역조회는 백엔드에 정산 모델이 아직 없어 로컬 state 목업 유지
import { useEffect, useState } from "react";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../components/ui/useToast";
import { pushBackAction } from "../../native/backHandler";
import { listMyReviews, type ShopReviewItem as ApiReview } from "../../api/shops";
import { INITIAL_SETTLEMENTS } from "./stlData";
import type { Review } from "./stlTypes";
import StlMainScreen from "./StlMainScreen";
import StlHistScreen from "./StlHistScreen";
import StlReviewScreen from "./StlReviewScreen";
import StlDateRangeSheet from "./StlDateRangeSheet";

const REVIEW_PAGE_SIZE = 5;

function formatReviewDate(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, ".");
}

function toReviewRow(r: ApiReview): Review {
  return {
    id: String(r.id),
    rating: r.rating,
    content: r.content,
    customer: r.reviewerName,
    car: r.car ?? "-",
    date: formatReviewDate(r.createdAt),
  };
}

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
  const [showDatePop, setShowDatePop] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [customLabel, setCustomLabel] = useState("");

  const [settlements] = useState(INITIAL_SETTLEMENTS);
  const [reviewRows, setReviewRows] = useState<Review[]>([]);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [avgRatingNum, setAvgRatingNum] = useState(0);

  useEffect(() => {
    listMyReviews(0, REVIEW_PAGE_SIZE)
      .then((page) => {
        setReviewRows(page.items.map(toReviewRow));
        setReviewTotal(page.total);
        setAvgRatingNum(page.avgRating ?? 0);
      })
      .catch((err) => showToast(err instanceof Error ? err.message : "후기를 불러오지 못했어요", "danger"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const done = settlements.filter((s) => s.status === "done" && s.period === "this");
  const wait = settlements.filter((s) => s.status === "wait" && s.period === "this");
  const monthTotal = [...done, ...wait].reduce((a, s) => a + s.amount, 0);
  const doneAmount = done.reduce((a, s) => a + s.amount, 0);
  const waitAmount = wait.reduce((a, s) => a + s.amount, 0);

  const avgRating = avgRatingNum.toFixed(1);
  const reviewCount = reviewTotal;

  const histRows = settlements.filter((s) => (period === "all" || s.period === period) && (status === "all" || s.status === status));

  // 하드웨어 백버튼: 화면 상단 '‹' 버튼의 onBack과 동일한 대상으로 이동. 루트 화면(main)에서는 등록하지 않아
  // 상위(App.tsx)의 "홈으로" 처리로 자연스럽게 넘어감
  useEffect(() => {
    if (showDatePop) return pushBackAction(() => setShowDatePop(false));
    if (screen === "main") return;
    return pushBackAction(() => setScreen("main"));
  }, [screen, showDatePop]);

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
          onLoadMore={async () => {
            if (reviewRows.length >= reviewTotal) {
              showToast("더 이상 후기가 없어요");
              return;
            }
            try {
              const page = await listMyReviews(reviewRows.length, REVIEW_PAGE_SIZE);
              setReviewRows((prev) => [...prev, ...page.items.map(toReviewRow)]);
            } catch (err) {
              showToast(err instanceof Error ? err.message : "후기를 더 불러오지 못했어요", "danger");
            }
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
