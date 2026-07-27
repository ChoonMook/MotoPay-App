// 콜센터 안내 팝업 - 파트너 계정 발급·로그인 문의 안내(바텀시트가 아닌 중앙 모달)
import Button from "../../components/ui/Button";

interface CallCenterSheetProps {
  onClose: () => void;
  onCall: () => void;
}

export default function CallCenterSheet({ onClose, onCall }: CallCenterSheetProps) {
  return (
    <div className="absolute inset-0 z-[80] flex items-center justify-center px-7">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/55"
        style={{ animation: "mp-fade .25s ease" }}
      />
      <div
        className="relative w-full rounded-[20px] bg-white px-6 pt-8 pb-[22px] text-center"
        style={{ animation: "mp-fade .22s ease" }}
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-subtle">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </div>
        <div className="mb-2.5 text-[19px] font-extrabold text-gray-900">모토페이 콜센터</div>
        <div className="mb-[18px] text-sm leading-[1.55] text-gray-600">
          로그인·계정 관련 문의는
          <br />
          콜센터로 연락해 주세요
        </div>
        <div className="mb-4 font-numeric text-[28px] font-extrabold tracking-tight text-brand">1588-0000</div>
        <div className="mb-[18px] rounded-lg bg-gray-100 p-2.5 text-[13px] text-gray-600">
          평일 09:00 ~ 18:00 (주말·공휴일 휴무)
        </div>
        <div className="mb-3.5">
          <Button onClick={onCall}>
            <span className="inline-flex items-center gap-2">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              전화 걸기
            </span>
          </Button>
        </div>
        <span onClick={onClose} className="cursor-pointer text-sm text-gray-500">
          닫기
        </span>
      </div>
    </div>
  );
}
