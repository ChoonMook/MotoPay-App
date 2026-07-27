// CU-MYPG-15: 연결된 SNS 관리 - 카카오·네이버·구글 계정 연결/해제 관리
// 프로그램목록표 소스파일명이 apps/customer-app/src/screens/mypage/SnsLinkManageScreen.tsx로 돼 있으나(다른 14개 CU-MYPG 행은 전부 screens/myp/*),
// 이 한 행만 다른 폴더명인 것은 표기 오류로 판단해 나머지 마이페이지 화면들과 동일하게 screens/myp/ 하위에 배치함
import { SNS_DEFS } from "./mypData";
import CommonHeader from "../common/CommonHeader";

interface SnsLinkManageScreenProps {
  onBack: () => void;
  linked: Record<string, boolean>;
  onToggle: (key: string) => void;
}

export default function SnsLinkManageScreen({ onBack, linked, onToggle }: SnsLinkManageScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <CommonHeader title="연결된 SNS 관리" onBack={onBack} />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-4 pb-6">
        <div className="flex flex-col gap-[11px]">
          {SNS_DEFS.map((s) => {
            const on = linked[s.key];
            return (
              <div key={s.key} className="flex items-center gap-3 rounded-[14px] border border-gray-200 bg-white px-[15px] py-3.5 shadow-sm">
                <span
                  className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[11px] text-[13px] font-extrabold"
                  style={{ background: s.iconBg, color: s.iconColor }}
                >
                  {s.initial}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-gray-800">{s.label}</div>
                  <div className="mt-0.5 text-[11.5px] text-gray-500">{on ? "연결됨" : "연결 안됨"}</div>
                </div>
                <span
                  onClick={() => onToggle(s.key)}
                  className={`flex-none cursor-pointer rounded-lg px-[13px] py-2 text-xs font-bold ${
                    on ? "text-status-danger ring-1 ring-status-danger ring-inset" : "bg-brand text-white"
                  }`}
                >
                  {on ? "연결해제" : "연결하기"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
