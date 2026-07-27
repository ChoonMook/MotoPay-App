// Cardoc 토큰 기반 공용 텍스트 입력 컴포넌트 (라벨 + 에러 메시지 포함)
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export default function Input({ label, error, helperText, className = "", id, ...rest }: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-gray-800">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`h-[52px] w-full rounded-lg border px-[14px] text-base text-gray-900 outline-none placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-gray-100 disabled:text-gray-500 ${
          error ? "border-status-danger" : "border-gray-300"
        } ${className}`}
        {...rest}
      />
      {error && <span className="text-[13px] text-status-danger">{error}</span>}
      {!error && helperText && <span className="text-[13px] text-gray-500">{helperText}</span>}
    </div>
  );
}
