// Cardoc 디자인시스템 Toast 컴포넌트(components/feedback/Toast.jsx) 스펙 그대로 이식
// 위치·표시 여부는 호출부 책임 — 이 컴포넌트는 알약 형태 표시 자체만 담당
import type { ReactNode } from "react";

type Tone = "default" | "success" | "warning" | "danger";

interface ToastProps {
  children: ReactNode;
  tone?: Tone;
  icon?: string;
}

const TONE_ICON: Record<Tone, { icon: string | null; className: string }> = {
  default: { icon: null, className: "bg-gray-800" },
  success: { icon: "✓", className: "bg-status-success" },
  warning: { icon: "!", className: "bg-status-warning" },
  danger: { icon: "!", className: "bg-status-danger" },
};

export default function Toast({ children, tone = "default", icon }: ToastProps) {
  const t = TONE_ICON[tone];
  const shownIcon = icon ?? t.icon;

  return (
    <div
      role="status"
      className="inline-flex max-w-[360px] items-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-[15px] leading-[1.35] text-white shadow-[0_8px_24px_rgba(22,25,28,0.10)]"
      style={{ animation: "cardoc-toast-in .2s cubic-bezier(.16,1,.3,1)" }}
    >
      {shownIcon && (
        <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-xs font-bold text-white ${t.className}`}>
          {shownIcon}
        </span>
      )}
      <span>{children}</span>
    </div>
  );
}
