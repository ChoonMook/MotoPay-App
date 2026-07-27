// Cardoc 디자인시스템 Textarea 컴포넌트(components/forms/Textarea.jsx) 스펙 그대로 이식
import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export default function Textarea({ label, error, helperText, rows = 4, className = "", id, ...rest }: TextareaProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-gray-800">
          {label}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        className={`w-full resize-y rounded-lg border px-[14px] py-3 text-base leading-normal text-gray-900 outline-none placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-gray-100 disabled:text-gray-500 ${
          error ? "border-status-danger" : "border-gray-300"
        } ${className}`}
        {...rest}
      />
      {error && <span className="text-[13px] text-status-danger">{error}</span>}
      {!error && helperText && <span className="text-[13px] text-gray-500">{helperText}</span>}
    </div>
  );
}
