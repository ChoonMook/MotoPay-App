// CU-AUTH-13: 본인인증 결과가 기존 계정과 일치할 때 SNS 계정 연결 확인
import BottomSheet from "../../components/ui/BottomSheet";
import Button from "../../components/ui/Button";
import { SNS_BG, SnsIcon, type SnsProvider } from "./snsIcons";

interface SnsLinkConfirmScreenProps {
  provider: SnsProvider;
  onCancel: () => void;
  onLink: () => void;
}

export default function SnsLinkConfirmScreen({ provider, onCancel, onLink }: SnsLinkConfirmScreenProps) {
  return (
    <BottomSheet onClose={onCancel}>
      <div className="mb-1 text-xl font-extrabold text-gray-900">{provider} 계정 연결</div>
      <div className="mb-5 text-[13.5px] leading-[1.55] text-gray-600">
        본인인증 결과, 동일한 번호로 가입된 계정이 있어요. 이 계정에 {provider}를 연결할까요?
      </div>
      <div className="mb-3 rounded-xl bg-gray-100 p-4">
        <div className="flex justify-between py-[5px] text-sm">
          <span className="text-gray-500">아이디</span>
          <span className="font-bold text-gray-900">moto****23</span>
        </div>
        <div className="flex justify-between py-[5px] text-sm">
          <span className="text-gray-500">가입일</span>
          <span className="font-semibold text-gray-900">2024.03.11</span>
        </div>
      </div>
      <div className="mb-[22px] flex items-center gap-[10px] rounded-lg bg-brand-subtle px-3.5 py-3">
        <span
          className={`flex h-[30px] w-[30px] items-center justify-center rounded-full ${
            provider === "Gmail" ? "border border-gray-200" : ""
          }`}
          style={{ background: SNS_BG[provider] }}
        >
          <SnsIcon provider={provider} size={30} />
        </span>
        <span className="text-[13.5px] text-gray-800">
          연결 대상 · <b>{provider}</b>
        </span>
      </div>
      <div className="flex gap-[10px]">
        <div className="flex-1">
          <Button variant="outline" onClick={onCancel}>
            취소
          </Button>
        </div>
        <div className="flex-[2]">
          <Button onClick={onLink}>연결하기</Button>
        </div>
      </div>
    </BottomSheet>
  );
}
