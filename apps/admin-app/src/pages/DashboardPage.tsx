// 메인 대시보드 (uploads/MotoPay_프로그램목록표_v1_43.xlsx "관리자웹_프로그램" 시트 AD-DASH-01 스펙 이식)
// [구성요소] 상단 요약 카드 4~6개(그리드) + 하단 서브메뉴(메인대시보드/서비스별통계) — 필드 목록 없음(허브 화면)
// [상태] 로딩 / 표시  [인터랙션] 요약 카드 클릭 시 해당 상세(서비스별 통계)로 이동
// 이번 작업 범위상 실 API 연동 없이 정적 목업 데이터로 구성
import { useEffect, useState } from "react";
import { BarChart3, ClipboardList, Headset, LayoutDashboard, ShoppingBag, TrendingUp, Users, Wallet } from "lucide-react";
import PageBreadcrumb from "../components/PageBreadcrumb";
import { openInParent } from "../lib/parentBridge";
import { findMenuLabel } from "../lib/menuConfig";

interface SummaryCardData {
  label: string;
  value: string;
  icon: typeof Users;
  tone: "blue" | "emerald" | "amber" | "violet" | "rose" | "cyan";
}

const SUMMARY_CARDS: SummaryCardData[] = [
  { label: "오늘 신규 회원", value: "128명", icon: Users, tone: "blue" },
  { label: "오늘 시공 요청", value: "35건", icon: ClipboardList, tone: "violet" },
  { label: "금일 매출", value: "₩12,480,000", icon: TrendingUp, tone: "emerald" },
  { label: "정산 대기", value: "8건", icon: Wallet, tone: "amber" },
  { label: "CS 미처리 문의", value: "3건", icon: Headset, tone: "rose" },
  { label: "쇼핑몰 신규 주문", value: "17건", icon: ShoppingBag, tone: "cyan" },
];

const TONE_CLASS: Record<SummaryCardData["tone"], string> = {
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
  rose: "bg-rose-50 text-rose-600",
  cyan: "bg-cyan-50 text-cyan-600",
};

function SummaryCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
      <div className="mb-4 h-10 w-10 rounded-full bg-surface-container" />
      <div className="mb-2 h-3 w-20 rounded bg-surface-container" />
      <div className="h-6 w-16 rounded bg-surface-container" />
    </div>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, []);

  const goToDetail = () => openInParent("/main/by-svc-stat", findMenuLabel("/main/by-svc-stat"));

  return (
    <div className="flex h-full flex-col gap-8 overflow-y-auto px-8 py-6">
      <PageBreadcrumb path="/main/dash" />

      <div className="grid shrink-0 grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {loading
          ? SUMMARY_CARDS.map((c) => <SummaryCardSkeleton key={c.label} />)
          : SUMMARY_CARDS.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.label}
                  type="button"
                  onClick={goToDetail}
                  className="flex flex-col items-start rounded-xl border border-outline-variant/30 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className={`mb-4 flex h-10 w-10 items-center justify-center rounded-full ${TONE_CLASS[c.tone]}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="mb-1 text-[12px] font-bold text-on-surface-variant">{c.label}</p>
                  <h4 className="text-xl font-black tracking-tight text-on-surface">{c.value}</h4>
                </button>
              );
            })}
      </div>

      <div className="shrink-0">
        <h3 className="mb-3 text-sm font-bold text-on-surface">바로가기</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4 rounded-xl border-2 border-primary bg-primary/5 p-6 shadow-sm">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
              <LayoutDashboard className="h-6 w-6" />
            </span>
            <div>
              <div className="text-sm font-extrabold text-secondary">메인 대시보드</div>
              <p className="mt-0.5 text-[12px] text-on-surface-variant">현재 보고 있는 화면이에요</p>
            </div>
          </div>

          <button
            type="button"
            onClick={goToDetail}
            className="group flex items-center gap-4 rounded-xl border border-outline-variant/30 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-container text-secondary transition-colors group-hover:bg-primary group-hover:text-white">
              <BarChart3 className="h-6 w-6" />
            </span>
            <div>
              <div className="text-sm font-extrabold text-secondary">서비스별 통계</div>
              <p className="mt-0.5 text-[12px] text-on-surface-variant">신차패키지·예약·쇼핑몰 서비스별 기간 통계</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
