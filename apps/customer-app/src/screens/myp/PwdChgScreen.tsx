// CU-MYPG-09: 비밀번호 변경 - 현재 비밀번호 확인 후 새 비밀번호로 변경
import { useState } from "react";
import Button from "../../components/ui/Button";
import { EyeIcon } from "../../components/ui/Input";
import CommonHeader from "../common/CommonHeader";

interface PwdChgScreenProps {
  onBack: () => void;
  pwCur: string;
  pwNew: string;
  pwConfirm: string;
  onChangeCur: (v: string) => void;
  onChangeNew: (v: string) => void;
  onChangeConfirm: (v: string) => void;
  onSave: () => void;
  saving?: boolean;
}

const fieldClass = "w-full rounded-xl border border-gray-400 bg-white px-[15px] py-3.5 pr-11 text-sm text-gray-900 outline-none";

function PasswordField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={fieldClass}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "비밀번호 숨기기" : "비밀번호 보기"}
        className="absolute top-1/2 right-3.5 -translate-y-1/2 text-gray-400"
      >
        <EyeIcon open={show} />
      </button>
    </div>
  );
}

export default function PwdChgScreen({
  onBack,
  pwCur,
  pwNew,
  pwConfirm,
  onChangeCur,
  onChangeNew,
  onChangeConfirm,
  onSave,
  saving = false,
}: PwdChgScreenProps) {
  const mismatch = !!pwConfirm && pwNew !== pwConfirm;
  const samePassword = !!pwCur && !!pwNew && pwCur === pwNew;
  const ok = !!pwCur && !!pwNew && pwNew === pwConfirm && !samePassword && !saving;

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <CommonHeader title="비밀번호 변경" onBack={onBack} />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-[22px] pb-6">
        <div className="mx-0.5 mb-2 text-[13px] font-extrabold text-gray-900">현재 비밀번호</div>
        <PasswordField value={pwCur} onChange={onChangeCur} />

        <div className="mx-0.5 mt-4 mb-2 text-[13px] font-extrabold text-gray-900">새 비밀번호</div>
        <PasswordField value={pwNew} onChange={onChangeNew} placeholder="영문·숫자·특수문자 조합 8자 이상" />

        <div className="mx-0.5 mt-4 mb-2 text-[13px] font-extrabold text-gray-900">새 비밀번호 확인</div>
        <PasswordField value={pwConfirm} onChange={onChangeConfirm} />
        {mismatch && <div className="mt-2 text-xs text-status-danger">비밀번호가 일치하지 않아요</div>}
        {samePassword && <div className="mt-2 text-xs text-status-danger">새 비밀번호는 현재 비밀번호와 달라야 해요</div>}
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-6">
        <Button size="xl" disabled={!ok} onClick={onSave}>
          {saving ? "변경 중..." : "변경하기"}
        </Button>
      </div>
    </div>
  );
}
