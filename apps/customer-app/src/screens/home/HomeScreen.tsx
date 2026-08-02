// CU-HOME-01: 로그인 후 진입하는 서비스 홈 - 상태별 배너(3종) + 빠른메뉴 + 예약시공 진행현황 + 프로모션 + 하단 내비게이션
import { useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../components/ui/useToast";
import carImg from "../../assets/images/car.png";
import shopThumb from "../../assets/images/shop.png";
import zicM7 from "../../assets/images/zic-m7.png";
import { listMyCars } from "../../api/cars";
import { listMyReservations } from "../../api/reservations";
import { listShops } from "../../api/shops";
import {
  NavHomeIcon,
  NavResvIcon,
  NavShopIcon,
  NavMyIcon,
  PointIcon,
  CouponIcon,
  PayIcon,
  CsIcon,
} from "./homeIcons";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

interface NcpkBooking {
  shopName: string;
  dateLabel: string;
  /** 파트너앱에서 실제로 기록하는 진행상태(progressStatus)가 DONE이면 true — 인수확인 단계로 안내 */
  done: boolean;
}

interface Quote {
  name: string;
  official: boolean;
  rating: string;
  dist: string;
  price: string;
}

const QUOTES: Quote[] = [
  { name: "강남 오토바디", official: true, rating: "4.9", dist: "2.1km", price: "1,240,000" },
  { name: "역삼 카케어", official: false, rating: "4.8", dist: "3.4km", price: "1,090,000" },
  { name: "서초 바디샵", official: false, rating: "4.7", dist: "4.0km", price: "980,000" },
];

const QUICK_MENU = [
  { key: "point", label: "포인트", icon: <PointIcon /> },
  { key: "coupon", label: "쿠폰함", icon: <CouponIcon /> },
  { key: "order", label: "주문내역", icon: <PayIcon /> },
  { key: "cs", label: "고객센터", icon: <CsIcon /> },
];

const RESV_STEPS = [
  { label: "예약", done: true, cur: false },
  { label: "방문", done: true, cur: false },
  { label: "시공중", done: false, cur: true },
  { label: "완료", done: false, cur: false },
];

const NAV_ITEMS = [
  { key: "home", label: "홈", Icon: NavHomeIcon, active: true },
  { key: "resv", label: "예약시공", Icon: NavResvIcon, active: false },
  { key: "shop", label: "쇼핑몰", Icon: NavShopIcon, active: false },
  { key: "my", label: "내 정보", Icon: NavMyIcon, active: false },
];

interface HomeScreenProps {
  name: string;
  onOpenNcpk: () => void;
  onOpenNcpkHandover: () => void;
  onOpenNcpkBookingDtl: () => void;
  onOpenRsv: () => void;
  onOpenPoint: () => void;
  onOpenShop: () => void;
  onOpenMyPage: () => void;
  onOpenCouponBox: () => void;
  onOpenOrderHist: () => void;
  onOpenCs: () => void;
}

export default function HomeScreen({
  name,
  onOpenNcpk,
  onOpenNcpkHandover,
  onOpenNcpkBookingDtl,
  onOpenRsv,
  onOpenPoint,
  onOpenShop,
  onOpenMyPage,
  onOpenCouponBox,
  onOpenOrderHist,
  onOpenCs,
}: HomeScreenProps) {
  const { toast, showToast } = useToast();

  // CU-HOME-01 신차패키지 배너 — 매핑된 패키지가 있고 아직 신청 전이면 상단 배너, 신청(예약 확정) 후에는
  // 하단 카드로 전환해 진행상태(방문 전) 또는 인수확인(방문일 도래)을 안내
  const [hasEligiblePackage, setHasEligiblePackage] = useState(false);
  const [ncpkBooking, setNcpkBooking] = useState<NcpkBooking | null>(null);

  useEffect(() => {
    Promise.all([listMyCars(), listMyReservations(), listShops()])
      .then(([cars, reservations, shops]) => {
        const defaultCar = cars.find((c) => c.isDefault) ?? cars[0];

        const activePkgRes = reservations
          .filter((r) => r.reservationType === "PKG" && r.status === "CONFIRMED")
          .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
        if (!activePkgRes) {
          setHasEligiblePackage(!!defaultCar?.packageCode);
          setNcpkBooking(null);
          return;
        }

        // 인수확인까지 끝난 예약이면 더 안내할 게 없으니 배너·카드 모두 노출하지 않음(3일 미확인 자동확정도 반영)
        const autoConfirmed =
          !!activePkgRes.completedAt &&
          Date.now() - new Date(activePkgRes.completedAt).getTime() >= 3 * 24 * 60 * 60 * 1000;
        const handoverClosed =
          activePkgRes.progressStatus === "DONE" && (!!activePkgRes.handoverConfirmedAt || autoConfirmed);
        if (handoverClosed) {
          setHasEligiblePackage(false);
          setNcpkBooking(null);
          return;
        }

        setHasEligiblePackage(!!defaultCar?.packageCode);
        const [y, m, d] = activePkgRes.date.split("-").map(Number);
        const wd = WEEKDAY_LABELS[new Date(y, m - 1, d).getDay()];
        setNcpkBooking({
          shopName: shops.find((s) => s.shopCode === activePkgRes.shopCode)?.name ?? "선정 업체",
          dateLabel: `${activePkgRes.date.replaceAll("-", ".")}(${wd}) ${activePkgRes.time}`,
          done: activePkgRes.progressStatus === "DONE",
        });
      })
      .catch((err) => showToast(err instanceof Error ? err.message : "신차패키지 정보를 불러오지 못했어요", "danger"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="absolute inset-0 bg-gray-50">
      {/* top app bar (상태바 46px 아래부터 시작) */}
      <div className="absolute inset-x-0 top-[46px] z-50 flex h-[52px] items-center gap-2 border-b border-gray-100 bg-white px-[18px]">
        <span className="text-[21px] font-extrabold tracking-tight text-gray-900">
          Moto<span className="text-brand">Pay</span>
        </span>
        <span className="flex-1" />
        <span
          onClick={() => showToast("보유 포인트 5,000P · 적립/사용 내역")}
          className="flex cursor-pointer items-center gap-1.5 rounded-full bg-brand-subtle px-[11px] py-[5px]"
        >
          <span className="flex h-[14px] w-[14px] items-center justify-center rounded-full bg-brand text-[9px] font-extrabold text-white">
            P
          </span>
          <span className="text-[12.5px] font-bold text-brand tabular-nums">5,000</span>
        </span>
        <span
          onClick={() => showToast("알림함으로 이동해요")}
          className="relative inline-flex cursor-pointer text-gray-700"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
          <span className="absolute top-[-1px] right-0 h-[7px] w-[7px] rounded-full border-[1.5px] border-white bg-status-danger" />
        </span>
      </div>

      {/* scroll body */}
      <div
        className="mp-scroll absolute inset-x-0 top-[98px] bottom-[66px] overflow-y-auto px-[18px] pt-4 pb-6"
        style={{ animation: "mp-screen .32s ease" }}
      >
        {/* greeting */}
        <div className="mx-0.5 mb-3.5">
          <div className="text-xl font-extrabold tracking-tight text-gray-900">{name}님, 안녕하세요</div>
          <div className="mt-[3px] text-[13.5px] text-gray-600">내 차를 위한 오늘의 케어를 확인해 보세요.</div>
        </div>

        {/* ===== 신차패키지 배너 — 매핑된 패키지가 있고 아직 신청 전일 때만 노출 ===== */}
        {hasEligiblePackage && !ncpkBooking && (
          <div
            onClick={onOpenNcpk}
            className="relative cursor-pointer overflow-hidden rounded-2xl bg-brand p-[18px]"
            style={{ animation: "mp-fade .3s ease", boxShadow: "0 8px 22px -8px rgba(27,100,242,.5)" }}
          >
              <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/20 py-[3px] pr-[10px] pl-2 text-[11px] font-bold text-white">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="8" width="18" height="4" rx="1" />
                  <path d="M12 8v13M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
                  <path d="M12 8S10.5 3 8 3a2.5 2.5 0 0 0 0 5M12 8s1.5-5 4-5a2.5 2.5 0 0 1 0 5" />
                </svg>
                신차패키지
              </div>
              <div className="text-lg font-extrabold tracking-tight text-white">대기 중인 신차패키지가 있어요</div>
              <div className="mt-1.5 text-[13px] text-white/85">지금 첫 시공을 예약하고 케어를 시작하세요.</div>
              <div className="mt-3 flex items-center gap-1.5 rounded-[9px] bg-white/15 px-[11px] py-2 text-xs font-semibold text-white">
                신차 구매정보로 자동 매핑된 패키지예요
              </div>
              <div className="mt-3.5 inline-flex items-center gap-1 rounded-[10px] bg-white px-4 py-2.5 text-[13.5px] font-bold text-brand">
                패키지 확인하기 ›
              </div>
          </div>
        )}

        {/* ===== 신차패키지 진행중 예약 카드 — 신청(예약 확정) 후에만 노출. 방문일 도래 전엔 진행상태, 도래 후엔 인수확인 ===== */}
        {ncpkBooking &&
          (ncpkBooking.done ? (
            <div className="mt-3 rounded-2xl border border-green-500 bg-status-success-bg p-[18px]" style={{ animation: "mp-fade .3s ease" }}>
              <div className="mb-2.5 flex items-center gap-2">
                <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-status-success">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span className="text-xs font-extrabold text-green-600">시공 완료</span>
              </div>
              <div className="text-lg font-extrabold tracking-tight text-gray-900">시공이 완료되었어요</div>
              <div className="mt-1.5 text-[13px] text-gray-600">
                {ncpkBooking.shopName} · {ncpkBooking.dateLabel}
              </div>
              <div className="mt-3 flex items-center gap-1.5 rounded-[9px] bg-white/60 px-[11px] py-2 text-xs font-semibold text-green-600">
                차량 인수 후 7일 이내 인수 확인이 필요해요
              </div>
              <div className="mt-3.5">
                <Button size="lg" onClick={onOpenNcpkHandover}>
                  인수 확인하기
                </Button>
              </div>
            </div>
          ) : (
            <div
              onClick={onOpenNcpkBookingDtl}
              className="mt-3 cursor-pointer rounded-2xl border border-brand bg-brand-subtle p-[18px]"
              style={{ animation: "mp-fade .3s ease" }}
            >
              <div className="mb-2.5 flex items-center gap-2">
                <span className="rounded-md bg-brand px-[9px] py-1 text-[10.5px] font-extrabold text-white">시공 예정</span>
              </div>
              <div className="text-lg font-extrabold tracking-tight text-gray-900">신차패키지 예약이 확정됐어요</div>
              <div className="mt-1.5 text-[13px] text-gray-600">
                {ncpkBooking.shopName} · {ncpkBooking.dateLabel}
              </div>
              <div className="mt-3.5">
                <Button size="lg" variant="secondary" onClick={onOpenNcpkBookingDtl}>
                  진행 상황 확인하기
                </Button>
              </div>
            </div>
          ))}

        <div
          className="mt-3 rounded-2xl border border-gray-200 bg-white p-[18px] shadow-sm"
          style={{ animation: "mp-fade .3s ease" }}
        >
          <div className="mb-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span className="text-xs font-extrabold text-accent-strong">견적 도착 · 외장수리</span>
          </div>
          <div className="text-lg font-extrabold tracking-tight text-gray-900">
            업체 <span className="text-brand">3곳</span>의 견적서가 도착했어요
          </div>
          <div className="mt-[5px] mb-3.5 text-[13px] text-gray-600">틴팅 외2 · 요청 후 6시간 경과</div>
          <div className="mb-3.5 flex flex-col gap-2">
            {QUOTES.map((q, i) => (
              <div
                key={q.name}
                onClick={() => showToast(`${q.name} 견적서를 확인해요`)}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-2.5 py-[9px] ${
                  i === 0 ? "border-brand bg-brand-subtle" : "border-gray-200 bg-white"
                }`}
              >
                <span className="h-9 w-9 flex-none overflow-hidden rounded-[10px] bg-gray-100">
                  <img src={shopThumb} alt={q.name} className="block h-full w-full object-cover" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[13.5px] font-bold text-gray-900">{q.name}</span>
                    {q.official && (
                      <span className="rounded bg-brand-subtle px-[5px] py-[1.5px] text-[9.5px] font-extrabold text-brand">
                        공식
                      </span>
                    )}
                  </div>
                  <div className="mt-px text-[11.5px] text-gray-500">
                    ★ {q.rating} · {q.dist}
                  </div>
                </div>
                <span className="text-[15px] font-extrabold tracking-tight text-gray-900 tabular-nums">
                  {q.price}
                  <span className="text-[11px] font-semibold">원</span>
                </span>
              </div>
            ))}
          </div>
          <Button size="lg" onClick={() => showToast("업체 3곳 견적 비교 화면으로 이동해요")}>
            견적 3곳 비교하기
          </Button>
        </div>

        {/* ===== quick menu ===== */}
        <div className="mt-5 grid grid-cols-4 gap-1.5">
          {QUICK_MENU.map((m) => (
            <div
              key={m.key}
              onClick={() =>
                m.key === "point"
                  ? onOpenPoint()
                  : m.key === "coupon"
                    ? onOpenCouponBox()
                    : m.key === "order"
                      ? onOpenOrderHist()
                      : m.key === "cs"
                        ? onOpenCs()
                        : showToast(`${m.label}(으)로 이동해요`)
              }
              className="flex cursor-pointer flex-col items-center gap-2 rounded-[14px] border border-gray-200 bg-white pt-4 pb-3"
            >
              <span className="text-brand">{m.icon}</span>
              <span className="text-xs font-semibold text-gray-800">{m.label}</span>
            </div>
          ))}
        </div>

        {/* ===== 예약시공 진행현황 ===== */}
        <div className="mx-0.5 mt-6 mb-2.5 flex items-center justify-between">
          <span className="text-base font-extrabold tracking-tight text-gray-900">예약시공 진행현황</span>
          <span
            onClick={() => showToast("예약시공 전체 목록으로 이동해요")}
            className="cursor-pointer text-[12.5px] text-gray-500"
          >
            전체보기 ›
          </span>
        </div>
        <div
          onClick={() => showToast("예약시공 상세로 이동해요")}
          className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-[18px] shadow-sm"
        >
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-11 w-11 flex-none items-center justify-center overflow-hidden rounded-xl bg-gray-100">
              <img src={carImg} alt="차량" className="h-10 w-auto object-contain" />
            </span>
            <div className="flex-1">
              <div className="text-[14.5px] font-bold text-gray-900">틴팅 · 블랙박스</div>
              <div className="mt-0.5 text-xs text-gray-500">강남 오토바디 · 3.14(목) 방문 예정</div>
            </div>
            <span className="rounded-md bg-brand-subtle px-[9px] py-1 text-[11px] font-extrabold text-brand">
              시공 중
            </span>
          </div>
          <div className="flex items-center">
            {RESV_STEPS.map((s, i) => {
              const on = s.done || s.cur;
              return (
                <div key={s.label} className="contents">
                  {i > 0 && (
                    <span
                      className={`h-0.5 flex-1 ${
                        RESV_STEPS[i].done || RESV_STEPS[i].cur ? "bg-brand" : "bg-gray-100"
                      }`}
                    />
                  )}
                  <div className="flex w-[52px] flex-none flex-col items-center gap-1.5">
                    <span
                      className={`flex h-[26px] w-[26px] items-center justify-center rounded-full text-xs font-extrabold ${
                        on ? "bg-brand text-white" : "bg-gray-100 text-gray-500"
                      } ${s.cur ? "ring-[3px] ring-brand-subtle" : ""}`}
                    >
                      {s.done ? "✓" : i + 1}
                    </span>
                    <span
                      className={`text-[11px] ${s.cur ? "font-bold" : on ? "font-bold" : "font-medium"} ${
                        on ? "text-gray-900" : "text-gray-500"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== promo ===== */}
        <div
          onClick={() => showToast("엔진오일 프로모션으로 이동해요")}
          className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl border border-accent-border bg-accent-subtle p-4"
        >
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl border border-accent-border bg-white">
            <img src={zicM7} alt="ZIC M7 엔진오일" className="h-[38px] w-auto object-contain" />
          </span>
          <div className="flex-1">
            <div className="text-sm font-extrabold text-accent-strong">엔진오일 교체 최대 40% 할인</div>
            <div className="mt-px text-xs text-gray-600">내 차 스펙 추천 + 공임 포함가 비교</div>
          </div>
          <span className="text-accent">›</span>
        </div>
      </div>

      {/* ===== bottom navigation ===== */}
      <div className="absolute inset-x-0 bottom-0 z-50 flex h-[66px] border-t border-gray-100 bg-white pb-2">
        {NAV_ITEMS.map(({ key, label, Icon, active }) => (
          <div
            key={key}
            onClick={() =>
              active
                ? undefined
                : key === "resv"
                  ? onOpenRsv()
                  : key === "shop"
                    ? onOpenShop()
                    : key === "my"
                      ? onOpenMyPage()
                      : showToast(`${label} 탭으로 이동해요`)
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

      {/* toast */}
      {toast && (
        <div className="absolute inset-x-0 bottom-[82px] z-[90] flex justify-center px-6">
          <Toast tone={toast.tone}>{toast.message}</Toast>
        </div>
      )}
    </div>
  );
}
