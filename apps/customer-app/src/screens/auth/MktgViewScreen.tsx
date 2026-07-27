// CU-AUTH-10: 마케팅 수신 동의(선택) - 채널별 스위치
import BottomSheet from "../../components/ui/BottomSheet";
import Switch from "../../components/ui/Switch";
import Button from "../../components/ui/Button";

interface MktgViewScreenProps {
  onClose: () => void;
  onDeny: () => void;
  onAgree: () => void;
  sms: boolean;
  onSmsChange: (checked: boolean) => void;
  email: boolean;
  onEmailChange: (checked: boolean) => void;
  push: boolean;
  onPushChange: (checked: boolean) => void;
}

export default function MktgViewScreen({
  onClose,
  onDeny,
  onAgree,
  sms,
  onSmsChange,
  email,
  onEmailChange,
  push,
  onPushChange,
}: MktgViewScreenProps) {
  return (
    <BottomSheet onClose={onClose}>
      <div className="mb-1 text-xl font-extrabold text-gray-900">
        마케팅 수신 동의 <span className="text-[13px] font-semibold text-gray-500">(선택)</span>
      </div>
      <div className="mb-[18px] text-[13.5px] leading-snug text-gray-600">
        이벤트·혜택 소식을 받을 채널을 선택하세요. 미동의해도 서비스 이용에는 문제없어요.
      </div>
      <div className="mb-[22px] flex flex-col gap-1">
        <div className="px-1 py-2.5">
          <Switch checked={sms} onChange={onSmsChange} label="SMS 수신" />
        </div>
        <div className="px-1 py-2.5">
          <Switch checked={email} onChange={onEmailChange} label="이메일 수신" />
        </div>
        <div className="px-1 py-2.5">
          <Switch checked={push} onChange={onPushChange} label="앱푸시 수신" />
        </div>
      </div>
      <div className="flex gap-[10px]">
        <div className="flex-1">
          <Button variant="outline" onClick={onDeny}>
            미동의
          </Button>
        </div>
        <div className="flex-1">
          <Button onClick={onAgree}>동의</Button>
        </div>
      </div>
    </BottomSheet>
  );
}
