// 로그아웃 확인 팝업 - 중앙 모달(바텀시트 아님)
import Button from "../../components/ui/Button";

interface LogoutConfirmModalProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export default function LogoutConfirmModal({ onCancel, onConfirm }: LogoutConfirmModalProps) {
  return (
    <div className="absolute inset-0 z-[80] flex items-center justify-center px-8">
      <div
        onClick={onCancel}
        className="absolute inset-0 bg-black/55"
        style={{ animation: "mp-fade .25s ease" }}
      />
      <div
        className="relative w-full rounded-[20px] bg-white px-[22px] pt-7 pb-5 text-center"
        style={{ animation: "mp-fade .22s ease" }}
      >
        <div className="mb-2 text-[17px] font-extrabold text-gray-900">로그아웃 하시겠어요?</div>
        <div className="mb-[22px] text-[13.5px] leading-[1.5] text-gray-600">
          다시 로그인해야 서비스를 이용할 수 있어요
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <Button variant="secondary" size="lg" onClick={onCancel}>
              취소
            </Button>
          </div>
          <div className="flex-1">
            <Button variant="danger" size="lg" onClick={onConfirm}>
              로그아웃
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
