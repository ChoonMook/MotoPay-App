// CU-MYPG-01: 마이페이지 주화면 - 프로필 요약(이름·등급·대표차량) + 차량/이용내역/알림/계정 메뉴 그룹 + 하단 내비게이션
import { useEffect, useState } from "react";
import { BUILD_TIME } from "../../buildInfo";
import { isNativeBridgeAvailable, requestAppVersion } from "../../native/bridge";
import { NavHomeIcon, NavResvIcon, NavShopIcon, NavMyIcon } from "../home/homeIcons";
import { EditIcon, ChevronRightIcon } from "./mypIcons";

const NAV_ITEMS = [
  { key: "home", label: "홈", Icon: NavHomeIcon, active: false },
  { key: "resv", label: "예약시공", Icon: NavResvIcon, active: false },
  { key: "shop", label: "쇼핑몰", Icon: NavShopIcon, active: false },
  { key: "my", label: "내 정보", Icon: NavMyIcon, active: true },
];

interface MenuRow {
  label: string;
  danger?: boolean;
  value?: string;
  onClick?: () => void;
}

interface MyPageScreenProps {
  userName: string;
  profileImageUrl: string | null;
  userCarLabel: string;
  onExit: () => void;
  onOpenShop: () => void;
  onOpenRsv: () => void;
  onOpenCars: () => void;
  onOpenCst: () => void;
  onOpenShopHist: () => void;
  onOpenCancelHist: () => void;
  onOpenCouponBox: () => void;
  onOpenNotis: () => void;
  onOpenNotiSettings: () => void;
  onOpenInfoEdit: () => void;
  onOpenSns: () => void;
  onOpenCs: () => void;
  onOpenLogout: () => void;
  onOpenWithdraw: () => void;
  onToast: (label: string) => void;
}

export default function MyPageScreen({
  userName,
  profileImageUrl,
  userCarLabel,
  onExit,
  onOpenShop,
  onOpenRsv,
  onOpenCars,
  onOpenCst,
  onOpenShopHist,
  onOpenCancelHist,
  onOpenCouponBox,
  onOpenNotis,
  onOpenNotiSettings,
  onOpenInfoEdit,
  onOpenSns,
  onOpenCs,
  onOpenLogout,
  onOpenWithdraw,
  onToast,
}: MyPageScreenProps) {
  // 안드로이드 앱(motopay-mobile) 안에서 실행 중이면 실제 설치된 APK 빌드버전을, 일반 브라우저면 웹 번들 빌드 시각을 표시
  const [appVersion, setAppVersion] = useState<string | null>(null);
  useEffect(() => {
    if (!isNativeBridgeAvailable()) return;
    requestAppVersion()
      .then(({ versionName, versionCode }) => setAppVersion(`v${versionName} (${versionCode})`))
      .catch(() => {});
  }, []);
  const buildVersionLabel = appVersion ?? `웹 ${BUILD_TIME}`;

  const sections: { title: string; rows: MenuRow[] }[] = [
    { title: "차량", rows: [{ label: "내 차량 목록", onClick: onOpenCars }] },
    {
      title: "이용내역",
      rows: [
        { label: "시공내역", onClick: onOpenCst },
        { label: "쇼핑몰 주문내역", onClick: onOpenShopHist },
        { label: "취소·반품 내역", onClick: onOpenCancelHist },
        { label: "보유 쿠폰함", onClick: onOpenCouponBox },
      ],
    },
    {
      title: "알림",
      rows: [
        { label: "알림함", onClick: onOpenNotis },
        { label: "알림 설정", onClick: onOpenNotiSettings },
      ],
    },
    {
      title: "계정",
      rows: [
        { label: "내 정보 변경", onClick: onOpenInfoEdit },
        { label: "연결된 SNS 관리", onClick: onOpenSns },
      ],
    },
    { title: "고객지원", rows: [{ label: "고객센터", onClick: onOpenCs }] },
    { title: "앱 정보", rows: [{ label: "빌드버전", value: buildVersionLabel }] },
    {
      title: "",
      rows: [
        { label: "로그아웃", onClick: onOpenLogout },
        { label: "회원 탈퇴", danger: true, onClick: onOpenWithdraw },
      ],
    },
  ];

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="mp-scroll flex-1 overflow-y-auto pb-2.5">
        <div className="bg-gradient-to-br from-brand to-brand-strong px-5 pt-14 pb-[22px] text-white">
          <div className="flex items-center gap-3.5">
            <span className="flex h-14 w-14 flex-none items-center justify-center overflow-hidden rounded-full bg-white/22 text-xl font-extrabold">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="프로필 사진" className="h-full w-full object-cover" />
              ) : (
                userName.slice(0, 1)
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-nowrap items-center gap-[7px]">
                <span className="whitespace-nowrap text-[17px] font-extrabold">{userName} 님</span>
                <span className="flex-none rounded-full bg-white/22 px-2 py-[3px] text-[10.5px] font-extrabold whitespace-nowrap">골드회원</span>
              </div>
              <div className="mt-1.5 truncate text-xs text-white/85">{userCarLabel}</div>
            </div>
            <span onClick={onOpenInfoEdit} className="flex h-8 w-8 flex-none cursor-pointer items-center justify-center rounded-full bg-white/18">
              <EditIcon />
            </span>
          </div>
        </div>

        <div className="px-5 pt-4">
          {sections.map((sec) => (
            <div key={sec.title || "danger"} className="mt-[22px] first:mt-0">
              {sec.title && <div className="mx-1 mb-1.5 text-[11.5px] font-extrabold tracking-wide text-gray-500">{sec.title}</div>}
              <div className="flex flex-col">
                {sec.rows.map((m, i) => (
                  <div
                    key={m.label}
                    onClick={m.onClick}
                    className={`flex items-center gap-3 px-1 py-3.5 ${i < sec.rows.length - 1 || sec.title === "" ? "border-b border-gray-100" : ""}`}
                  >
                    <span className={`flex-1 text-sm ${m.danger ? "font-bold text-status-danger" : "font-semibold text-gray-800"}`}>{m.label}</span>
                    {m.value ? (
                      <span className="flex-none text-xs text-gray-400">{m.value}</span>
                    ) : (
                      sec.title !== "" && (
                        <span className="flex-none text-gray-500">
                          <ChevronRightIcon />
                        </span>
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex h-[66px] flex-none border-t border-gray-100 bg-white pb-2">
        {NAV_ITEMS.map(({ key, label, Icon, active }) => (
          <div
            key={key}
            onClick={() =>
              active ? undefined : key === "home" ? onExit() : key === "shop" ? onOpenShop() : key === "resv" ? onOpenRsv() : onToast(label)
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
