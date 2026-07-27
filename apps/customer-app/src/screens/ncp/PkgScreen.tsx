// CU-NCPK-01: 신차패키지 주화면 - 진행중 시공 예약 카드 + 플로우 소개 + 보유 패키지 확인 CTA + 하단 내비게이션
import Button from "../../components/ui/Button";
import carImg from "../../assets/images/car.png";
import { NavHomeIcon, NavResvIcon, NavShopIcon, NavMyIcon } from "../home/homeIcons";
import { CheckCircleIcon, ShopIcon, CalendarIcon } from "./ncpIcons";

const INTRO_STEPS = [
  { n: 1, title: "보유 패키지 확인", desc: "차량에 매핑된 시공 항목 확인", Icon: CheckCircleIcon },
  { n: 2, title: "시공업체 선택", desc: "딜러사 지정 업체 중 선택", Icon: ShopIcon },
  { n: 3, title: "일정 예약", desc: "희망 날짜·시간 예약", Icon: CalendarIcon },
  { n: 4, title: "시공 · 인수확인", desc: "완료 사진 확인 후 인수", Icon: CheckCircleIcon },
];

const NAV_ITEMS = [
  { key: "home", label: "홈", Icon: NavHomeIcon, active: true },
  { key: "resv", label: "예약시공", Icon: NavResvIcon, active: false },
  { key: "shop", label: "쇼핑몰", Icon: NavShopIcon, active: false },
  { key: "my", label: "내 정보", Icon: NavMyIcon, active: false },
];

export interface PkgActiveBooking {
  itemSummaryLabel: string;
  shopName: string;
  dateLabel: string;
  /** true면 시공완료·인수확인 단계(초록 배지), false면 시공예정 단계(브랜드색 배지) */
  done: boolean;
}

interface PkgScreenProps {
  onCheckPkg: () => void;
  onTapResvCard: () => void;
  onNavHome: () => void;
  onNavToast: (label: string) => void;
  /** 진행중인 시공 예약이 없으면 null — 카드 자체를 숨김(디자인 스펙의 "진행중 예약 없음(소개형)" 상태) */
  booking: PkgActiveBooking | null;
}

export default function PkgScreen({ onCheckPkg, onTapResvCard, onNavHome, onNavToast, booking }: PkgScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex h-[98px] flex-none items-center bg-white px-[18px] pt-[46px]">
        <span className="text-[19px] font-extrabold tracking-tight text-gray-900">신차패키지</span>
      </div>

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-5 pb-[26px]">
        {booking && (
          <div
            onClick={onTapResvCard}
            className={`mb-4 cursor-pointer rounded-2xl border bg-white p-4 shadow-sm ${booking.done ? "border-green-500" : "border-brand"}`}
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-[42px] w-[42px] flex-none items-center justify-center overflow-hidden rounded-[11px] bg-gray-100">
                <img src={carImg} alt="차량" className="w-9" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-gray-900">{booking.itemSummaryLabel} · 신차패키지</div>
                <div className="mt-0.5 text-[11.5px] text-gray-500">
                  {booking.shopName} · {booking.dateLabel}
                </div>
              </div>
              <span
                className={`flex-none rounded-md px-[9px] py-1 text-[10.5px] font-extrabold ${
                  booking.done ? "bg-status-success-bg text-green-600" : "bg-brand-subtle text-brand"
                }`}
              >
                {booking.done ? "시공 완료" : "시공 예정"}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
              <span className="text-xs text-gray-600">진행중인 시공 예약</span>
              <span className="text-xs font-bold text-brand">{booking.done ? "인수 확인하기" : "진행현황"} ›</span>
            </div>
          </div>
        )}

        <div
          className="relative overflow-hidden rounded-[20px] px-[22px] py-[26px] text-white"
          style={{ background: "linear-gradient(160deg,var(--color-brand),#1450c8)" }}
        >
          <div className="inline-flex items-center gap-1 rounded-full bg-white/20 px-[11px] py-1 text-[11px] font-bold">
            NEW CAR CARE
          </div>
          <div className="mt-3.5 text-[23px] leading-[1.3] font-extrabold tracking-tight">
            새 차를 위한
            <br />
            패키지 케어가 준비됐어요
          </div>
          <div className="mt-2 text-[13.5px] leading-relaxed text-white/85">
            딜러사가 매핑한 시공 항목을 확인하고
            <br />
            지정 업체에서 한 번에 예약하세요.
          </div>
          <div className="absolute top-[-30px] right-[-30px] h-[120px] w-[120px] rounded-full bg-white/12" />
        </div>

        <div className="mx-0.5 mt-6 mb-3.5 text-sm font-extrabold text-gray-900">이렇게 진행돼요</div>
        <div className="flex flex-col gap-3">
          {INTRO_STEPS.map((s) => (
            <div key={s.n} className="flex items-center gap-3.5 rounded-[14px] border border-gray-200 bg-white px-4 py-3.5">
              <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px] bg-brand-subtle text-brand text-[15px] font-extrabold">
                {s.n}
              </span>
              <div className="flex-1">
                <div className="text-[14.5px] font-bold text-gray-900">{s.title}</div>
                <div className="mt-px text-xs text-gray-500">{s.desc}</div>
              </div>
              <span className="text-brand">
                <s.Icon />
              </span>
            </div>
          ))}
        </div>

        <div className="mt-[18px] rounded-xl bg-gray-100 p-3.5 text-[12.5px] leading-relaxed text-gray-600">
          신차 구매 정보로 자동 매핑된 패키지예요. 보유 항목은 다음 화면에서 확인할 수 있어요.
        </div>
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 py-3">
        <Button size="xl" onClick={onCheckPkg}>
          보유 패키지 확인하기
        </Button>
      </div>

      <div className="flex h-14 flex-none border-t border-gray-100 bg-white">
        {NAV_ITEMS.map(({ key, label, Icon, active }) => (
          <div
            key={key}
            onClick={() => (active ? onNavHome() : onNavToast(label))}
            className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5"
          >
            <Icon color={active ? "var(--color-brand)" : "var(--text-tertiary)"} />
            <span className={`text-[10px] ${active ? "font-bold text-brand" : "font-medium text-gray-500"}`}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
