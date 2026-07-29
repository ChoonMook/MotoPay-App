// PT-PROF-07: 비밀번호 변경 - 현재 비밀번호 확인 후 새 비밀번호로 교체
import { useEffect, useState } from "react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { changePassword, getMe } from "../../api/partnerAuth";
import { BackIcon } from "./bizIcons";

// 백엔드 PartnerChangePasswordDto의 검증 규칙과 동일(영문+숫자+특수문자 포함 8자 이상)
const PASSWORD_MIX_RE = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;

interface BizPwdChangeScreenProps {
  onBack: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
}

export default function BizPwdChangeScreen({ onBack, onSaved, onError }: BizPwdChangeScreenProps) {
  const [staffName, setStaffName] = useState("");
  const [loginId, setLoginId] = useState("");
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMe()
      .then((me) => {
        setStaffName(me.name);
        setLoginId(me.username);
      })
      .catch((err) => onError(err instanceof Error ? err.message : "계정 정보를 불러오지 못했어요"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mismatch = newPw2.length > 0 && newPw !== newPw2;
  const samePassword = curPw.length > 0 && newPw.length > 0 && curPw === newPw;
  const mixOk = newPw.length === 0 || PASSWORD_MIX_RE.test(newPw);
  const canSave =
    curPw.length > 0 &&
    PASSWORD_MIX_RE.test(newPw) &&
    newPw === newPw2 &&
    curPw !== newPw &&
    !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await changePassword(curPw, newPw);
      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : "비밀번호 변경에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-gray-50">
      {/* top app bar (sub) */}
      <div className="absolute inset-x-0 top-[46px] z-50 flex h-[52px] items-center gap-1.5 border-b border-gray-100 bg-white px-1.5">
        <span onClick={onBack} className="inline-flex cursor-pointer p-2.5 text-gray-800">
          <BackIcon />
        </span>
        <span className="text-[17px] font-extrabold tracking-tight text-gray-900">비밀번호 변경</span>
      </div>

      <div
        className="mp-scroll absolute inset-x-0 top-[98px] bottom-0 overflow-y-auto px-5 pt-5 pb-[120px]"
        style={{ animation: "mp-screen .32s ease" }}
      >
        <div className="mb-5 rounded-[14px] bg-gray-100 px-4 py-3.5">
          <div className="text-[15px] font-extrabold text-gray-900">{staffName}</div>
          <div className="mt-0.5 text-[12.5px] text-gray-500">아이디 {loginId}</div>
        </div>

        <div className="flex flex-col gap-4">
          <Input
            label="현재 비밀번호"
            type="password"
            placeholder="현재 비밀번호"
            value={curPw}
            onChange={(e) => setCurPw(e.target.value)}
          />
          <Input
            label="새 비밀번호"
            type="password"
            placeholder="영문·숫자·특수문자 8자 이상"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            error={
              samePassword
                ? "새 비밀번호는 현재 비밀번호와 달라야 해요"
                : !mixOk
                  ? "영문·숫자·특수문자를 모두 포함해 8자 이상 입력해 주세요"
                  : undefined
            }
          />
          <Input
            label="새 비밀번호 확인"
            type="password"
            placeholder="새 비밀번호 확인"
            value={newPw2}
            onChange={(e) => setNewPw2(e.target.value)}
            error={mismatch ? "비밀번호가 일치하지 않아요" : undefined}
          />
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-[55] border-t border-gray-100 bg-white px-5 pt-3.5 pb-[22px]">
        <Button disabled={!canSave} onClick={handleSave}>
          {saving ? "변경 중..." : "저장"}
        </Button>
      </div>
    </div>
  );
}
