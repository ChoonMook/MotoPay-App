// CU-SHOP-07: 새 배송지 입력 - 받는 분·연락처·주소 입력 후 저장, 저장 시 배송지 변경(CU-SHOP-06) 목록으로 복귀
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

interface NewAddrInputScreenProps {
  onBack: () => void;
  name: string;
  phone: string;
  addr: string;
  onChangeName: (v: string) => void;
  onChangePhone: (v: string) => void;
  onChangeAddr: (v: string) => void;
  onSave: () => void;
}

export default function NewAddrInputScreen({
  onBack,
  name,
  phone,
  addr,
  onChangeName,
  onChangePhone,
  onChangeAddr,
  onSave,
}: NewAddrInputScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex-none bg-white pt-[50px] pr-2.5 pl-2.5">
        <div className="flex items-center gap-1.5">
          <span onClick={onBack} className="flex h-9 w-9 cursor-pointer items-center justify-center text-gray-800">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </span>
          <span className="text-base font-bold text-gray-900">새 배송지 입력</span>
        </div>
      </div>

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-[18px] pb-6">
        <div className="flex flex-col gap-4">
          <Input label="받는 분 이름" value={name} onChange={(e) => onChangeName(e.target.value)} placeholder="받는 분 이름을 입력하세요" />
          <Input label="연락처" value={phone} onChange={(e) => onChangePhone(e.target.value)} placeholder="010-0000-0000" inputMode="numeric" />
          <Input label="배송지 주소" value={addr} onChange={(e) => onChangeAddr(e.target.value)} placeholder="도로명 주소를 입력하세요" />
        </div>
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-6">
        <Button size="xl" disabled={!name || !phone || !addr} onClick={onSave}>
          배송지 저장
        </Button>
      </div>
    </div>
  );
}
