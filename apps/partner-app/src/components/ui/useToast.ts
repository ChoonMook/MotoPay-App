// Toast 표시/자동 숨김 상태를 관리하는 공용 훅 (tone 포함)
import { useEffect, useRef, useState } from "react";

type Tone = "default" | "success" | "warning" | "danger";

interface ToastState {
  message: string;
  tone: Tone;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const showToast = (message: string, tone: Tone = "default") => {
    setToast({ message, tone });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2200);
  };

  return { toast, showToast };
}
