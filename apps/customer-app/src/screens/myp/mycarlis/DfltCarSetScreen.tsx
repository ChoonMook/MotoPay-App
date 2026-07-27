// CU-MYPG-05: 대표차량 지정(팝업) - 선택한 차량을 대표차량으로 지정할지 확인
import Button from "../../../components/ui/Button";
import BottomSheet from "../../../components/ui/BottomSheet";
import { CloseIcon } from "../../common/commonIcons";

interface DfltCarSetScreenProps {
  onClose: () => void;
  targetName: string;
  onConfirm: () => void;
}

export default function DfltCarSetScreen({ onClose, targetName, onConfirm }: DfltCarSetScreenProps) {
  return (
    <BottomSheet onClose={onClose} maxHeight="60%">
      <div className="mb-3.5 flex items-center justify-between">
        <span className="text-lg font-extrabold text-gray-900">대표차량 지정</span>
        <span onClick={onClose} className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center text-gray-500">
          <CloseIcon />
        </span>
      </div>
      <div className="mb-3.5 text-[12.5px] text-gray-600">'{targetName}'을(를) 대표차량으로 지정할까요?</div>
      <div className="flex gap-2.5">
        <div className="flex-1">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
        </div>
        <div className="flex-1">
          <Button onClick={onConfirm}>지정하기</Button>
        </div>
      </div>
    </BottomSheet>
  );
}
