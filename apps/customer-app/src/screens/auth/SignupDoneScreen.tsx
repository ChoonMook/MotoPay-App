// CU-AUTH-11: 회원가입 완료 - 신차패키지 자동 매핑 안내 포함
import Button from "../../components/ui/Button";

interface SignupDoneScreenProps {
  name: string;
  /** 이름+휴대폰이 일치하는 딜러 등록 신차 구매 정보가 있어 자동 매핑된 경우에만 안내 배지 표시 */
  packageMapped: boolean;
  onGoHome: () => void;
}

export default function SignupDoneScreen({ name, packageMapped, onGoHome }: SignupDoneScreenProps) {
  return (
    <div
      className="absolute inset-0 flex flex-col px-6 pt-14 pb-8"
      style={{ animation: "mp-screen .32s ease" }}
    >
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-[22px] flex h-[76px] w-[76px] items-center justify-center rounded-full bg-status-success-bg">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--status-success)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div className="text-2xl font-extrabold tracking-tight text-gray-900">
          환영합니다, {name}님!
        </div>
        <div className="mt-2.5 text-[15px] leading-relaxed text-gray-600">
          MotoPay 가입이 완료됐어요.
          <br />
          이제 모든 정비 결제를 간편하게.
        </div>
        {packageMapped && (
          <div className="mt-[26px] flex w-full items-center gap-3 rounded-xl border border-green-500 bg-status-success-bg p-4 text-left">
            <span className="text-[22px]">🎁</span>
            <div>
              <div className="text-sm font-bold text-green-600">대기 중인 신차패키지가 연결됐어요</div>
              <div className="mt-0.5 text-[12.5px] text-gray-600">
                이름·휴대폰 정보로 자동 매핑 · 홈에서 확인하세요
              </div>
            </div>
          </div>
        )}
      </div>
      <Button onClick={onGoHome}>홈으로 시작하기</Button>
    </div>
  );
}
