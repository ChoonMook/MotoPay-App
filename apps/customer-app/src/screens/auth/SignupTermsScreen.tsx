// CU-AUTH-07: 회원가입 - 약관동의(전체동의 + 개별 필수/선택 약관)
import BottomSheet from "../../components/ui/BottomSheet";
import Checkbox from "../../components/ui/Checkbox";
import Button from "../../components/ui/Button";

interface SignupTermsScreenProps {
  onClose: () => void;
  onOpenService: () => void;
  onOpenPrivacy: () => void;
  onOpenMarketing: () => void;
  service: boolean;
  onServiceChange: (checked: boolean) => void;
  privacy: boolean;
  onPrivacyChange: (checked: boolean) => void;
  marketing: boolean;
  onMarketingChange: (checked: boolean) => void;
  onComplete: () => void;
  loading?: boolean;
}

export default function SignupTermsScreen({
  onClose,
  onOpenService,
  onOpenPrivacy,
  onOpenMarketing,
  service,
  onServiceChange,
  privacy,
  onPrivacyChange,
  marketing,
  onMarketingChange,
  onComplete,
  loading = false,
}: SignupTermsScreenProps) {
  const allChecked = service && privacy && marketing;
  const canComplete = service && privacy && !loading;

  const toggleAll = () => {
    const next = !allChecked;
    onServiceChange(next);
    onPrivacyChange(next);
    onMarketingChange(next);
  };

  return (
    <BottomSheet onClose={onClose} maxHeight="82%">
      <div className="mb-1 text-xl font-extrabold text-gray-900">약관에 동의해 주세요</div>
      <div className="mb-[18px] text-[13.5px] text-gray-600">회원가입 마지막 단계예요.</div>

      <div
        onClick={toggleAll}
        className={`mb-3.5 flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${
          allChecked ? "border-brand bg-brand-subtle" : "border-gray-200 bg-white"
        }`}
      >
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full border-[1.5px] ${
            allChecked ? "border-brand bg-brand" : "border-gray-300 bg-white"
          }`}
        >
          {allChecked && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </span>
        <span className="text-[15px] font-bold text-gray-900">전체 동의하기</span>
      </div>

      <div className="flex flex-col gap-0.5">
        <div className="flex items-center justify-between px-1.5 py-3">
          <Checkbox checked={service} onChange={onServiceChange} label="[필수] 서비스 이용약관 동의" />
          <span onClick={onOpenService} className="cursor-pointer text-lg text-gray-400">
            ›
          </span>
        </div>
        <div className="flex items-center justify-between px-1.5 py-3">
          <Checkbox checked={privacy} onChange={onPrivacyChange} label="[필수] 개인정보 처리방침 동의" />
          <span onClick={onOpenPrivacy} className="cursor-pointer text-lg text-gray-400">
            ›
          </span>
        </div>
        <div className="flex items-center justify-between px-1.5 py-3">
          <Checkbox checked={marketing} onChange={onMarketingChange} label="[선택] 마케팅 수신 동의" />
          <span onClick={onOpenMarketing} className="cursor-pointer text-lg text-gray-400">
            ›
          </span>
        </div>
      </div>

      <div className="mt-5">
        <Button disabled={!canComplete} onClick={onComplete}>
          {loading ? "가입 중..." : "가입완료"}
        </Button>
      </div>
    </BottomSheet>
  );
}
