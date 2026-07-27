// CU-PNT-02: 포인트 충전 - 금액선택 (충전 금액 칩/기타금액 입력 + 결제수단 선택 + 결제하기)
import Button from "../../components/ui/Button";
import CommonHeader from "../common/CommonHeader";
import { InfoIcon } from "./pointIcons";
import { AMOUNT_CHIPS, METHOD_DEFS } from "./pointData";
import { nfmt, parseDigits } from "./pointFormat";
import type { PtMethodKey } from "./pntTypes";

interface PtChargeAmtSelScreenProps {
  onBack: () => void;
  chargeAmt: number;
  chargeEtc: string;
  chargeMethod: PtMethodKey;
  onSelectAmt: (v: number) => void;
  onChangeEtc: (v: string) => void;
  onSelectMethod: (k: PtMethodKey) => void;
  onPay: () => void;
}

export default function PtChargeAmtSelScreen({
  onBack,
  chargeAmt,
  chargeEtc,
  chargeMethod,
  onSelectAmt,
  onChangeEtc,
  onSelectMethod,
  onPay,
}: PtChargeAmtSelScreenProps) {
  const chargeVal = chargeEtc ? parseDigits(chargeEtc) : chargeAmt;
  const chargeOk = chargeVal >= 10000;

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <CommonHeader title="포인트 충전" onBack={onBack} />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-[18px] pb-6">
        <div className="mx-0.5 mb-2.5 text-sm font-extrabold text-gray-900">충전 금액</div>
        <div className="grid grid-cols-2 gap-2">
          {AMOUNT_CHIPS.map((a) => {
            const on = !chargeEtc && chargeAmt === a.value;
            return (
              <span
                key={a.value}
                onClick={() => onSelectAmt(a.value)}
                className={`cursor-pointer rounded-xl py-[15px] text-center text-sm tabular-nums ${
                  on ? "bg-brand font-extrabold text-white" : "border border-gray-300 bg-white font-bold text-gray-800"
                }`}
              >
                {a.label}
              </span>
            );
          })}
        </div>

        <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3.5">
          <input
            value={chargeEtc}
            onChange={(e) => onChangeEtc(e.target.value)}
            inputMode="numeric"
            placeholder="기타 금액 직접 입력"
            className="flex-1 border-none bg-transparent py-[13px] text-[15px] font-bold text-gray-900 tabular-nums outline-none"
          />
          <span className="text-sm font-bold text-gray-500">원</span>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-[10px] bg-gray-50 px-[13px] py-[11px]">
          <span className="flex-none text-gray-500">
            <InfoIcon />
          </span>
          <span className="text-xs leading-[1.45] text-gray-600">
            충전 금액은 추가 적립 없이 <b>충전액 그대로 1P = 1원</b>으로 적립돼요.
          </span>
        </div>

        <div className="mx-0.5 mt-[22px] mb-2.5 text-sm font-extrabold text-gray-900">
          결제 수단 <span className="font-semibold text-gray-500">· 남은 금액</span>
        </div>
        <div className="flex flex-col gap-2.5">
          {METHOD_DEFS.map((m) => {
            const on = chargeMethod === m.key;
            return (
              <div
                key={m.key}
                onClick={() => onSelectMethod(m.key)}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-[14px] ${
                  on ? "border-brand bg-brand-subtle" : "border-gray-200 bg-white"
                }`}
              >
                <span
                  className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px] text-white ${
                    on ? "bg-brand" : "border-2 border-gray-300"
                  }`}
                >
                  {on ? "✓" : ""}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-800">{m.label}</div>
                  {on && m.note && <div className="mt-[3px] text-[11.5px] text-gray-500 tabular-nums">{m.note}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-none border-t border-gray-100 bg-white">
        <div className="flex items-center justify-between px-5 pt-3">
          <span className="text-[12.5px] text-gray-600">충전 금액</span>
          <span className="text-base font-extrabold text-brand tabular-nums">{nfmt(chargeVal)}원</span>
        </div>
        <div className="px-5 pt-2 pb-6">
          <Button size="xl" disabled={!chargeOk} onClick={onPay}>
            {chargeOk ? "결제하기" : "충전 금액을 입력하세요"}
          </Button>
        </div>
      </div>
    </div>
  );
}
