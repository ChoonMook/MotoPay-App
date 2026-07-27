// CU-NCPK-04: 추가옵션(팝업) - 패키지 미포함 항목 선택, 건너뛰면 차액 없이 다음 단계로
import BottomSheet from "../../components/ui/BottomSheet";
import Button from "../../components/ui/Button";
import { CloseIcon, CheckIcon } from "./ncpIcons";
import { nfmt } from "./ncpFormat";

export interface AddOption {
  code: string; // 구성상품코드 -> Product.productCode
  name: string;
  desc: string;
  price: number;
}

interface AddOptScreenProps {
  onClose: () => void;
  onSkip: () => void;
  onComplete: () => void;
  addItems: AddOption[];
  addOpts: Record<string, boolean>;
  onToggleOpt: (code: string) => void;
}

export default function AddOptScreen({ onClose, onSkip, onComplete, addItems, addOpts, onToggleOpt }: AddOptScreenProps) {
  const total = addItems.reduce((t, o) => t + (addOpts[o.code] ? o.price : 0), 0);

  return (
    <BottomSheet onClose={onClose} maxHeight="88%">
      <div className="flex items-center justify-between">
        <span className="text-lg font-extrabold text-gray-900">추가옵션</span>
        <span onClick={onClose} className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center text-gray-500">
          <CloseIcon />
        </span>
      </div>
      <div className="mt-1.5 mb-3 text-[12.5px] text-gray-600">
        패키지에 <b>포함되지 않은</b> 항목이에요. 필요하면 선택하고, 원치 않으면 건너뛰어도 돼요.
      </div>

      <div className="mp-scroll flex flex-col gap-2.5 overflow-y-auto">
        {addItems.map((o) => {
          const on = !!addOpts[o.code];
          return (
            <div
              key={o.code}
              onClick={() => onToggleOpt(o.code)}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-[15px] py-[13px] ${
                on ? "border-brand bg-brand-subtle" : "border-gray-200 bg-white"
              }`}
            >
              <span
                className={`flex h-[22px] w-[22px] flex-none items-center justify-center rounded-md ${
                  on ? "bg-brand" : "border-[1.5px] border-gray-300"
                }`}
              >
                {on && (
                  <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">
                    <CheckIcon />
                  </span>
                )}
              </span>
              <div className="flex-1">
                <div className="text-sm font-bold text-gray-900">{o.name}</div>
                <div className="mt-px text-[11.5px] text-gray-500">{o.desc}</div>
              </div>
              <span className="text-sm font-extrabold text-gray-900 tabular-nums">
                +{nfmt(o.price)}
                <span className="text-[11px]">원</span>
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="text-[13px] text-gray-600">추가옵션 합계</span>
        <span className="text-lg font-extrabold text-brand tabular-nums">{nfmt(total)}원</span>
      </div>

      <div className="mt-3.5 flex gap-2.5">
        <div className="flex-1">
          <Button variant="secondary" size="lg" onClick={onSkip}>
            건너뛰기
          </Button>
        </div>
        <div className="flex-[1.4]">
          <Button size="lg" onClick={onComplete}>
            선택 완료
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
