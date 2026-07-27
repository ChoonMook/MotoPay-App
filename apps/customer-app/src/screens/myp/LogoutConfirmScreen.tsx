// CU-MYPG-13: 로그아웃(팝업) - 확인 시 로그인 화면으로 이동
import Button from "../../components/ui/Button";
import BottomSheet from "../../components/ui/BottomSheet";

interface LogoutConfirmScreenProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export default function LogoutConfirmScreen({ onCancel, onConfirm }: LogoutConfirmScreenProps) {
  return (
    <BottomSheet onClose={onCancel} maxHeight="50%">
      <div className="text-center text-[17px] font-extrabold text-gray-900">로그아웃 하시겠어요?</div>
      <div className="mt-2 text-center text-[12.5px] text-gray-600">다시 로그인하면 그대로 이용할 수 있어요.</div>
      <div className="mt-[22px] flex gap-2.5">
        <div className="flex-1">
          <Button variant="outline" onClick={onCancel}>
            취소
          </Button>
        </div>
        <div className="flex-1">
          <Button onClick={onConfirm}>로그아웃</Button>
        </div>
      </div>
    </BottomSheet>
  );
}
