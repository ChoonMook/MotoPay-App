// 헤더 사용자 드롭다운의 "내 정보 수정" 모달 - 로그인한 관리자 본인의 비밀번호(선택)·휴대폰번호·이메일을 수정
import { useState } from "react";
import { Save, UserCog, X } from "lucide-react";
import { updateMe, type AdminAccount } from "../api/adminAuth";

const inputClass =
  "w-full rounded-lg border border-[#ced4da] bg-white px-3 py-2 text-xs font-normal outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5";
const disabledInputClass = `${inputClass} cursor-not-allowed bg-surface-container-low text-on-surface-variant`;
const labelClass = "ml-0.5 text-[11px] font-bold tracking-widest text-secondary uppercase";

const PASSWORD_PATTERN = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$/;

interface MyInfoModalProps {
  adminAccount: AdminAccount;
  onCancel: () => void;
  onSaved: (adminAccount: AdminAccount) => void;
}

export default function MyInfoModal({ adminAccount, onCancel, onSaved }: MyInfoModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState(adminAccount.phone ?? "");
  const [email, setEmail] = useState(adminAccount.email ?? "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        setError("새 비밀번호와 비밀번호 확인이 일치하지 않습니다.");
        return;
      }
      if (!PASSWORD_PATTERN.test(newPassword)) {
        setError("비밀번호는 8자 이상, 영문·숫자·특수문자를 모두 포함해야 합니다.");
        return;
      }
    }

    setSubmitting(true);
    setError("");
    try {
      const updated = await updateMe({
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        newPassword: newPassword || undefined,
      });
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "내 정보 수정에 실패했습니다.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="w-full max-w-[380px] rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserCog className="h-5 w-5" />
            </span>
            <h3 className="text-base font-bold text-secondary">내 정보 수정</h3>
          </div>
          <button type="button" onClick={onCancel} className="text-outline hover:text-on-surface">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelClass}>사용자 아이디</label>
              <input value={adminAccount.username} disabled className={disabledInputClass} />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>사용자 이름</label>
              <input value={adminAccount.name} disabled className={disabledInputClass} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>새 비밀번호</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="변경 시에만 입력하세요"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>비밀번호 확인</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호를 한번 더 입력하세요"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>휴대폰번호</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-1234-5678" className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>이메일 주소</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@motopay.co.kr" className={inputClass} />
          </div>

          {error && <p className="text-[12px] font-semibold text-red-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg bg-surface-container-high px-4 py-2 text-xs font-bold text-on-surface transition-all hover:bg-surface-dim">
            취소
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-60"
          >
            <Save className="h-3.5 w-3.5" />
            {submitting ? "저장 중..." : "저장"}
          </button>
        </div>
      </form>
    </div>
  );
}
