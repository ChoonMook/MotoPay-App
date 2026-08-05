// Cardoc 토큰 기반 공용 텍스트 입력 컴포넌트 (라벨 + 에러 메시지 포함)
// type="password"인 경우 눈 모양 아이콘으로 비밀번호 보기/숨기기 토글을 자동 제공
import { useState, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l18 18" />
      <path d="M10.6 5.2A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17.4 17.4 0 0 1-3.16 4.05M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7a10 10 0 0 0 4.15-.9" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

export default function Input({ label, error, helperText, className = "", id, type, ...rest }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-gray-800">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={isPassword && showPassword ? "text" : type}
          className={`h-[52px] w-full rounded-lg border bg-white px-[14px] ${isPassword ? "pr-11" : ""} text-base text-gray-900 outline-none placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-gray-100 disabled:text-gray-500 ${
            error ? "border-status-danger" : "border-gray-300"
          } ${className}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400"
          >
            <EyeIcon open={showPassword} />
          </button>
        )}
      </div>
      {error && <span className="text-[13px] text-status-danger">{error}</span>}
      {!error && helperText && <span className="text-[13px] text-gray-500">{helperText}</span>}
    </div>
  );
}
