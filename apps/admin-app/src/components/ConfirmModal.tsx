// 로그아웃·전체 탭 닫기가 공유하는 범용 확인 모달 (원본 Site.Master의 confirm-modal/logout-modal 패턴)
interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmModal({ title, message, confirmLabel = "확인", onCancel, onConfirm }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[320px] rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="mb-2 text-base font-bold text-secondary">{title}</h3>
        <p className="mb-6 text-xs font-medium text-on-surface-variant">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg bg-surface-container-high px-4 py-2 text-xs font-bold text-on-surface transition-all hover:bg-surface-dim"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-500 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-red-600"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
