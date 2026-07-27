// CU-SHOP-06: 배송지 변경(팝업) - 등록된 배송지 목록에서 선택, 새 배송지 추가는 CU-SHOP-07로 이동
import Button from "../../../components/ui/Button";
import BottomSheet from "../../../components/ui/BottomSheet";
import { CloseIcon } from "../../common/commonIcons";
import type { Address } from "../shopTypes";

interface AddrChgScreenProps {
  onClose: () => void;
  addresses: Address[];
  selectedAddr: string;
  onSelectAddr: (id: string) => void;
  onOpenNewAddr: () => void;
  onConfirm: () => void;
}

export default function AddrChgScreen({ onClose, addresses, selectedAddr, onSelectAddr, onOpenNewAddr, onConfirm }: AddrChgScreenProps) {
  return (
    <BottomSheet onClose={onClose} maxHeight="82%">
      <div className="mb-3.5 flex items-center justify-between">
        <span className="text-lg font-extrabold text-gray-900">배송지 변경</span>
        <span onClick={onClose} className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center text-gray-500">
          <CloseIcon />
        </span>
      </div>

      <div className="mp-scroll flex flex-col gap-2.5 overflow-y-auto">
        {addresses.map((a) => {
          const on = selectedAddr === a.id;
          return (
            <div
              key={a.id}
              onClick={() => onSelectAddr(a.id)}
              className={`flex items-start gap-2.5 rounded-xl border px-[15px] py-3.5 ${on ? "border-brand bg-brand-subtle" : "border-gray-200 bg-white"}`}
            >
              <span className={`mt-px flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px] text-white ${on ? "bg-brand" : "border-2 border-gray-300"}`}>
                {on ? "✓" : ""}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold text-gray-900">{a.name}</span>
                  {a.isDefault && <span className="rounded bg-brand-subtle px-1.5 py-0.5 text-[9.5px] font-extrabold text-brand">기본배송지</span>}
                </div>
                <div className="mt-[3px] text-xs text-gray-500">{a.phone}</div>
                <div className="mt-1 text-[12.5px] leading-[1.4] text-gray-600">{a.addr}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        onClick={onOpenNewAddr}
        className="mt-3.5 flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-gray-300 py-3.5 text-[13px] font-bold text-gray-600"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        새 배송지 추가
      </div>

      <div className="mt-4">
        <Button onClick={onConfirm}>이 배송지로 배송</Button>
      </div>
    </BottomSheet>
  );
}
