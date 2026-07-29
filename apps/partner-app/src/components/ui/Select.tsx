// Cardoc 토큰 기반 공용 드롭다운 선택 컴포넌트(components/core/Select.jsx) 스펙 그대로 이식
import type { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export default function Select({ label, className = "", id, children, ...rest }: SelectProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-gray-800">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`h-12 w-full rounded-lg border border-gray-300 px-[14px] text-base text-gray-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 ${className}`}
        {...rest}
      >
        {children}
      </select>
    </div>
  );
}
