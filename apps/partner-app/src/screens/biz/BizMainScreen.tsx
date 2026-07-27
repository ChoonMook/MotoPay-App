// PT-PROF-01: 내 업체 관리 메인 - 업체 프로필 요약 + 4개 메뉴 진입점(기본정보/휴무일/예약가능시간/예약현황) + 부가메뉴(알림함/비밀번호변경/로그아웃)
import type { MyShop } from "../../api/shops";
import { NavHomeIcon, NavResvIcon, NavPayIcon, NavMyIcon, BellIcon } from "../home/homeIcons";
import { BasicInfoIcon, HolidayIcon, AvailTimeIcon, StatIcon, PwdIcon, LogoutIcon } from "./bizIcons";

interface MenuMeta {
  key: string;
  icon: React.ReactNode;
  label: string;
  desc: string;
}

const MAIN_MENUS: MenuMeta[] = [
  { key: "basic", icon: <BasicInfoIcon />, label: "기본정보 관리", desc: "프로필·운영정보" },
  { key: "holiday", icon: <HolidayIcon />, label: "매장 휴무일 설정", desc: "휴무일 캘린더" },
  { key: "availtime", icon: <AvailTimeIcon />, label: "예약 가능 시간 설정", desc: "요일별 정원" },
  { key: "rsvstat", icon: <StatIcon />, label: "예약 현황", desc: "월간·주간 조회" },
];

const NAV_ITEMS = [
  { key: "home", label: "홈", Icon: NavHomeIcon, active: false },
  { key: "resv", label: "예약관리", Icon: NavResvIcon, active: false },
  { key: "pay", label: "정산", Icon: NavPayIcon, active: false },
  { key: "my", label: "마이", Icon: NavMyIcon, active: true },
];

interface BizMainScreenProps {
  shop: MyShop | null;
  onOpenBasicInfo: () => void;
  onOpenHome: () => void;
  onOpenLogoutConfirm: () => void;
  onPlaceholder: (label: string) => void;
}

export default function BizMainScreen({
  shop,
  onOpenBasicInfo,
  onOpenHome,
  onOpenLogoutConfirm,
  onPlaceholder,
}: BizMainScreenProps) {
  return (
    <div className="absolute inset-0 bg-gray-50">
      {/* top app bar */}
      <div className="absolute inset-x-0 top-[46px] z-50 flex h-[52px] items-center gap-2 border-b border-gray-100 bg-white px-[18px]">
        <span className="text-[17px] font-extrabold tracking-tight text-gray-900">내 업체 관리</span>
      </div>

      <div
        className="mp-scroll absolute inset-x-0 top-[98px] bottom-[66px] overflow-y-auto px-[18px] pt-4 pb-6"
        style={{ animation: "mp-screen .32s ease" }}
      >
        {!shop ? (
          <div className="pt-10 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : (
          <>
            {/* 업체 프로필 요약 */}
            <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-[18px] shadow-sm">
              <div className="flex gap-3">
                <span className="flex h-14 w-14 flex-none items-center justify-center rounded-xl bg-gray-100 text-xl text-gray-400">
                  🏪
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[17px] font-extrabold tracking-tight text-gray-900">{shop.name}</div>
                  <div className="mt-[3px] line-clamp-2 text-[12.5px] leading-[1.5] text-gray-500">
                    {shop.intro}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">{shop.address}</div>
                </div>
              </div>
            </div>

            {/* 4 메뉴 진입점 */}
            <div className="mb-4 grid grid-cols-2 gap-2.5">
              {MAIN_MENUS.map((m) => (
                <div
                  key={m.key}
                  onClick={() => (m.key === "basic" ? onOpenBasicInfo() : onPlaceholder(m.label))}
                  className="cursor-pointer rounded-[14px] border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <span className="mb-2.5 inline-flex text-brand">{m.icon}</span>
                  <div className="text-sm font-bold tracking-tight text-gray-900">{m.label}</div>
                  <div className="mt-0.5 text-[11.5px] text-gray-500">{m.desc}</div>
                </div>
              ))}
            </div>

            {/* 부가 메뉴 */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div
                onClick={() => onPlaceholder("알림함")}
                className="flex items-center gap-3 border-b border-gray-100 px-4 py-[15px]"
              >
                <span className="flex-none text-gray-700">
                  <BellIcon />
                </span>
                <span className="flex-1 text-[14.5px] font-semibold text-gray-900">알림함</span>
                <span className="text-lg text-gray-400">›</span>
              </div>
              <div
                onClick={() => onPlaceholder("비밀번호 변경")}
                className="flex items-center gap-3 border-b border-gray-100 px-4 py-[15px]"
              >
                <span className="flex-none text-gray-700">
                  <PwdIcon />
                </span>
                <span className="flex-1 text-[14.5px] font-semibold text-gray-900">비밀번호 변경</span>
                <span className="text-lg text-gray-400">›</span>
              </div>
              <div onClick={onOpenLogoutConfirm} className="flex items-center gap-3 px-4 py-[15px]">
                <span className="flex-none text-status-danger">
                  <LogoutIcon />
                </span>
                <span className="flex-1 text-[14.5px] font-semibold text-status-danger">로그아웃</span>
                <span className="text-lg text-gray-400">›</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* bottom navigation */}
      <div className="absolute inset-x-0 bottom-0 z-50 flex h-[66px] border-t border-gray-100 bg-white pb-2">
        {NAV_ITEMS.map(({ key, label, Icon, active }) => (
          <div
            key={key}
            onClick={() => (active ? undefined : key === "home" ? onOpenHome() : onPlaceholder(`${label} 탭`))}
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
