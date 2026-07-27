// CU-AUTH-04: 비밀번호 재설정 - 규칙 체크(길이·조합·일치) 표시
import { useState } from "react";
import BottomSheet from "../../components/ui/BottomSheet";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

interface PwdResetScreenProps {
  onClose: () => void;
  onDone: (newPassword: string) => void;
  loading?: boolean;
}

const MIX_RE = /(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/;

export default function PwdResetScreen({ onClose, onDone, loading }: PwdResetScreenProps) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  const ruleLen = pw.length >= 8;
  const ruleMix = MIX_RE.test(pw);
  const ruleMatch = pw.length > 0 && pw === pw2;
  const canSubmit = ruleLen && ruleMix && ruleMatch && !loading;

  const ruleRow = (ok: boolean, label: string) => (
    <div className={`flex items-center gap-2 text-[12.5px] ${ok ? "text-status-success" : "text-gray-400"}`}>
      <span>{ok ? "✓" : "○"}</span> {label}
    </div>
  );

  return (
    <BottomSheet onClose={onClose} maxHeight="80%">
      <div className="mb-1 text-xl font-extrabold text-gray-900">비밀번호 재설정</div>
      <div className="mb-5 text-[13.5px] text-gray-600">새로운 비밀번호를 입력해 주세요.</div>

      <div className="mb-3.5 flex flex-col gap-3.5">
        <Input
          label="새 비밀번호"
          placeholder="새 비밀번호"
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        <Input
          label="새 비밀번호 확인"
          placeholder="새 비밀번호 확인"
          type="password"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
        />
      </div>

      <div className="mb-[18px] flex flex-col gap-1.5 rounded-lg bg-gray-100 px-3.5 py-3">
        {ruleRow(ruleLen, "8자 이상")}
        {ruleRow(ruleMix, "영문·숫자·특수문자 조합")}
        {ruleRow(ruleMatch, "비밀번호 일치")}
      </div>

      <Button disabled={!canSubmit} onClick={() => onDone(pw)}>
        완료
      </Button>
    </BottomSheet>
  );
}
