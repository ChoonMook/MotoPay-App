// PT-STL-01: 정산·후기 허브 - 이번 달 정산 예정 금액(완료/대기 구분) + 정산내역·후기조회 진입 메뉴
import { NavHomeIcon, NavResvIcon, NavPayIcon, NavMyIcon } from "../home/homeIcons";
import { won } from "./stlData";
import { HistIcon, ReviewIcon } from "./stlIcons";

const NAV_ITEMS = [
  { key: "home", label: "홈", Icon: NavHomeIcon, active: false },
  { key: "resv", label: "예약관리", Icon: NavResvIcon, active: false },
  { key: "pay", label: "정산", Icon: NavPayIcon, active: true },
  { key: "my", label: "마이", Icon: NavMyIcon, active: false },
];

interface StlMainScreenProps {
  monthTotal: number;
  doneAmount: number;
  waitAmount: number;
  avgRating: string;
  reviewCount: number;
  onOpenHist: () => void;
  onOpenReview: () => void;
  onOpenHome: () => void;
  onOpenRsvc: () => void;
  onOpenMyPage: () => void;
  onPlaceholder: (label: string) => void;
}

export default function StlMainScreen({
  monthTotal,
  doneAmount,
  waitAmount,
  avgRating,
  reviewCount,
  onOpenHist,
  onOpenReview,
  onOpenHome,
  onOpenRsvc,
  onOpenMyPage,
  onPlaceholder,
}: StlMainScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex-none border-b border-gray-100 bg-white pt-[50px] px-[18px] pb-3.5">
        <span className="text-[19px] font-extrabold tracking-tight text-gray-900">정산·후기</span>
      </div>

      <div className="mp-scroll flex-1 overflow-y-auto px-[18px] py-[18px]">
        <div className="mb-[18px] rounded-[18px] border border-gray-200 bg-[linear-gradient(180deg,var(--surface-brand-subtle),var(--surface-card))] px-5 py-[22px]">
          <div className="mb-2 text-[12.5px] font-bold text-brand">이번 달 정산 예정 금액</div>
          <div className="text-[30px] font-extrabold tracking-[-.02em] tabular-nums text-gray-900">{won(monthTotal)}</div>
          <div className="mt-3.5 flex gap-3.5">
            <div className="flex-1">
              <div className="mb-0.5 text-[11.5px] text-gray-500">정산완료</div>
              <div className="text-[15px] font-extrabold tabular-nums text-gray-900">{won(doneAmount)}</div>
            </div>
            <div className="flex-1">
              <div className="mb-0.5 text-[11.5px] text-gray-500">정산대기</div>
              <div className="text-[15px] font-extrabold tabular-nums text-brand">{won(waitAmount)}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <div
            onClick={onOpenHist}
            className="flex cursor-pointer items-center gap-3 rounded-[14px] border border-gray-200 bg-white p-4 shadow-sm"
          >
            <span className="flex-none text-brand">
              <HistIcon />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-gray-900">정산 내역 조회</div>
              <div className="mt-0.5 text-[11.5px] text-gray-500">기간·상태별 조회, 엑셀 다운로드</div>
            </div>
            <span className="text-lg text-gray-500">›</span>
          </div>
          <div
            onClick={onOpenReview}
            className="flex cursor-pointer items-center gap-3 rounded-[14px] border border-gray-200 bg-white p-4 shadow-sm"
          >
            <span className="flex-none text-brand">
              <ReviewIcon />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-gray-900">후기 조회</div>
              <div className="mt-0.5 text-[11.5px] text-gray-500">
                평점 {avgRating} · 후기 {reviewCount}건
              </div>
            </div>
            <span className="text-lg text-gray-500">›</span>
          </div>
        </div>
      </div>

      <div className="flex h-[66px] flex-none border-t border-gray-100 bg-white pb-2">
        {NAV_ITEMS.map(({ key, label, Icon, active }) => (
          <div
            key={key}
            onClick={() =>
              active
                ? undefined
                : key === "home"
                  ? onOpenHome()
                  : key === "resv"
                    ? onOpenRsvc()
                    : key === "my"
                      ? onOpenMyPage()
                      : onPlaceholder(`${label} 탭`)
            }
            className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-1"
          >
            <Icon color={active ? "var(--color-brand)" : "var(--text-tertiary)"} />
            <span className={`text-[10.5px] ${active ? "font-bold text-brand" : "font-medium text-gray-500"}`}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
