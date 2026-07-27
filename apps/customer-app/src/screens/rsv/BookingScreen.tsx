// CU-RSVC-01: 예약시공 주화면 - 진행중인 요청 카드 목록 + 새 견적 요청하기 CTA + 하단 내비게이션
import Button from "../../components/ui/Button";
import { NavHomeIcon, NavResvIcon, NavShopIcon, NavMyIcon } from "../home/homeIcons";

interface ReqCardDef {
  title: string;
  sub: string;
  stage: string;
  tone: "amber" | "brand" | "green" | "purple";
  metaLabel: string;
  action: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const TONE_STYLE: Record<ReqCardDef["tone"], string> = {
  amber: "text-status-warning bg-status-warning-bg",
  brand: "text-brand bg-brand-subtle",
  green: "text-green-600 bg-status-success-bg",
  purple: "text-[#7C5CFF] bg-[#F1EEFF]",
};

const BidIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <rect x="7" y="10" width="3" height="7" />
    <rect x="12" y="6" width="3" height="11" />
    <rect x="17" y="13" width="3" height="4" />
  </svg>
);
const RecoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2 15 8l6 .9-4.5 4.3 1 6.1L12 16.6 6.5 19.3l1-6.1L3 8.9 9 8z" />
  </svg>
);
const UndercoatIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 17h14M6 17l1-5h10l1 5M8 12V9h8v3" />
  </svg>
);
const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const NAV_ITEMS = [
  { key: "home", label: "홈", Icon: NavHomeIcon, active: false },
  { key: "resv", label: "예약시공", Icon: NavResvIcon, active: true },
  { key: "shop", label: "쇼핑몰", Icon: NavShopIcon, active: false },
  { key: "my", label: "내 정보", Icon: NavMyIcon, active: false },
];

interface BookingScreenProps {
  onStartRequest: () => void;
  onOpenBid: () => void;
  onOpenPlanCmp: () => void;
  onOpenBookingDtl: () => void;
  onOpenHandover: () => void;
  onExit: () => void;
  onOpenShop: () => void;
  onOpenMyPage: () => void;
  onNavToast: (label: string) => void;
}

export default function BookingScreen({
  onStartRequest,
  onOpenBid,
  onOpenPlanCmp,
  onOpenBookingDtl,
  onOpenHandover,
  onExit,
  onOpenShop,
  onOpenMyPage,
  onNavToast,
}: BookingScreenProps) {
  const reqCards: ReqCardDef[] = [
    { title: "썬팅 · 블랙박스 · 일반 입찰", sub: "요청 03.18 · 입찰 마감 D-1", stage: "입찰중", tone: "amber", metaLabel: "도착한 입찰 3건", action: "입찰 비교", icon: <BidIcon />, onClick: onOpenBid },
    { title: "유리막 코팅 · 전문가 추천", sub: "요청 03.15 · 예산 30만원", stage: "선정 대기", tone: "brand", metaLabel: "추천 업체 2곳", action: "추천 비교", icon: <RecoIcon />, onClick: onOpenPlanCmp },
    { title: "하부 언더코팅 · 일반 입찰", sub: "강남 카프로 · 03.20 시공중", stage: "시공중", tone: "green", metaLabel: "선정 완료 · 시공 진행중", action: "진행 상황", icon: <UndercoatIcon />, onClick: onOpenBookingDtl },
    { title: "썬팅 · 전문가 추천", sub: "역삼 카케어 · 03.14 시공완료", stage: "시공완료", tone: "purple", metaLabel: "인수확인 대기", action: "인수확인", icon: <CheckIcon />, onClick: onOpenHandover },
  ];

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex h-[98px] flex-none items-center bg-white px-[18px] pt-[46px]">
        <span className="text-[19px] font-extrabold tracking-tight text-gray-900">예약시공</span>
      </div>

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-5 pb-[26px]">
        <div className="mx-0.5 mb-3 flex items-center justify-between">
          <span className="text-[15px] font-extrabold text-gray-900">진행중인 요청</span>
          <span className="text-xs font-bold text-gray-500">{reqCards.length}건</span>
        </div>
        <div className="flex flex-col gap-3">
          {reqCards.map((c) => (
            <div key={c.title} onClick={c.onClick} className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-2.5">
                <span className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[11px] bg-brand-subtle text-brand">
                  {c.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] font-bold text-gray-900">{c.title}</div>
                  <div className="mt-[3px] text-[11.5px] text-gray-500">{c.sub}</div>
                </div>
                <span className={`flex-none rounded-md px-[9px] py-1 text-[10.5px] font-extrabold ${TONE_STYLE[c.tone]}`}>{c.stage}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                <span className="text-xs text-gray-600">{c.metaLabel}</span>
                <span className="text-xs font-bold text-brand">{c.action} ›</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-[18px] rounded-xl bg-gray-100 p-3.5 text-[12.5px] leading-relaxed text-gray-600">
          직접 항목·제품을 고르는 <b>일반 입찰</b>과, 예산만 알려주면 전문가가 추천하는 <b>전문가 추천</b> 중 선택할 수 있어요.
        </div>
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 py-3">
        <Button size="xl" onClick={onStartRequest}>
          새 견적 요청하기
        </Button>
      </div>

      <div className="flex h-[66px] flex-none border-t border-gray-100 bg-white pb-2">
        {NAV_ITEMS.map(({ key, label, Icon, active }) => (
          <div
            key={key}
            onClick={() =>
              active
                ? undefined
                : key === "home"
                  ? onExit()
                  : key === "shop"
                    ? onOpenShop()
                    : key === "my"
                      ? onOpenMyPage()
                      : onNavToast(label)
            }
            className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-1"
          >
            <Icon color={active ? "var(--color-brand)" : "var(--text-tertiary)"} />
            <span className={`text-[10.5px] ${active ? "font-bold text-brand" : "font-medium text-gray-500"}`}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
