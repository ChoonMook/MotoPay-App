// CU-PNT-01: 포인트 주화면 - 보유 포인트/등급 히어로, 충전·내역·등급혜택 메뉴, 최근 내역, 하단 내비게이션
import { NavHomeIcon, NavResvIcon, NavShopIcon, NavMyIcon } from "../home/homeIcons";
import { ChargeIcon, HistIcon, GradeIcon } from "./pointIcons";
import { BALANCE, GRADE, ALL_HIST, KIND_META } from "./pointData";
import { nfmt } from "./pointFormat";

const NAV_ITEMS = [
  { key: "home", label: "홈", Icon: NavHomeIcon, active: false },
  { key: "resv", label: "예약시공", Icon: NavResvIcon, active: false },
  { key: "shop", label: "쇼핑몰", Icon: NavShopIcon, active: false },
  { key: "my", label: "내 정보", Icon: NavMyIcon, active: true },
];

interface PtScreenProps {
  onExit: () => void;
  onOpenCharge: () => void;
  onOpenHist: () => void;
  onOpenGrade: () => void;
  onOpenShop: () => void;
  onToast: (label: string) => void;
}

export default function PtScreen({ onExit, onOpenCharge, onOpenHist, onOpenGrade, onOpenShop, onToast }: PtScreenProps) {
  const menus = [
    { label: "포인트 충전", icon: <ChargeIcon />, onClick: onOpenCharge },
    { label: "사용 내역", icon: <HistIcon />, onClick: onOpenHist },
    { label: "등급 혜택", icon: <GradeIcon />, onClick: onOpenGrade },
  ];
  const recent = ALL_HIST.slice(0, 3);

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex h-[98px] flex-none items-center border-b border-gray-100 bg-white px-[18px] pt-[46px]">
        <span className="text-[19px] font-extrabold tracking-tight text-gray-900">포인트</span>
      </div>

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-[18px] pb-[26px]">
        <div className="rounded-2xl bg-brand p-5 pb-[18px] text-white shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] text-white/85">보유 포인트</span>
            <span onClick={onOpenGrade} className="cursor-pointer rounded-full bg-white/20 py-1 pr-[11px] pl-[11px] text-[11px] font-extrabold">
              {GRADE} 등급 ›
            </span>
          </div>
          <div className="mt-2 flex items-end gap-1">
            <span className="text-[34px] font-extrabold tracking-tight tabular-nums">{nfmt(BALANCE)}</span>
            <span className="pb-1 text-[17px] font-bold">P</span>
          </div>
          <div className="mt-3.5 flex gap-5 border-t border-white/20 pt-3.5">
            <div>
              <div className="text-[11px] text-white/75">총 충전 금액</div>
              <div className="mt-0.5 text-[14px] font-extrabold tabular-nums">+800,000</div>
            </div>
            <div>
              <div className="text-[11px] text-white/75">총 사용 금액</div>
              <div className="mt-0.5 text-[14px] font-extrabold tabular-nums">-152,000</div>
            </div>
          </div>
        </div>

        <div className="mt-3.5 grid grid-cols-3 gap-2.5">
          {menus.map((m) => (
            <div
              key={m.label}
              onClick={m.onClick}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-[14px] border border-gray-200 bg-white pt-4 pb-3 shadow-sm"
            >
              <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-brand-subtle text-brand">{m.icon}</span>
              <span className="text-center text-xs font-bold text-gray-800">{m.label}</span>
            </div>
          ))}
        </div>

        <div className="mx-0.5 mt-[22px] mb-3 flex items-center justify-between">
          <span className="text-[15px] font-extrabold text-gray-900">최근 내역</span>
          <span onClick={onOpenHist} className="cursor-pointer text-xs font-bold text-brand">
            전체보기 ›
          </span>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white px-4 shadow-sm">
          {recent.map((r, i) => (
            <div key={r.title + r.date} className={`flex items-center gap-2.5 py-[13px] ${i < recent.length - 1 ? "border-b border-gray-100" : ""}`}>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-bold text-gray-900">{r.title}</div>
                <div className="mt-0.5 text-[11px] text-gray-500">
                  {r.date} · {KIND_META[r.kind].label}
                </div>
              </div>
              <span className={`text-[14.5px] font-extrabold tabular-nums ${r.amt > 0 ? "text-green-600" : "text-gray-900"}`}>
                {r.amt > 0 ? "+" : ""}
                {nfmt(r.amt)}P
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex h-[66px] flex-none border-t border-gray-100 bg-white pb-2">
        {NAV_ITEMS.map(({ key, label, Icon, active }) => (
          <div
            key={key}
            onClick={() =>
              active ? undefined : key === "home" ? onExit() : key === "shop" ? onOpenShop() : onToast(label)
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
