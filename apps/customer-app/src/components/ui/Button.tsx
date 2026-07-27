// Cardoc 디자인시스템 Button 컴포넌트(components/core/Button.jsx) 스펙 그대로 이식
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "outline" | "danger";
type Size = "lg" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const variantClass: Record<Variant, string> = {
  primary: "border-transparent bg-brand text-white active:bg-brand-strong",
  secondary: "border-transparent bg-brand-subtle text-brand-strong",
  outline: "border-gray-300 bg-white text-gray-800 active:bg-gray-50",
  danger: "border-transparent bg-status-danger text-white active:bg-[var(--red-600)]",
};

// size: lg=--control-lg(52px)/--radius-md(8px), xl=--control-xl(56px)/--radius-lg(12px)
const sizeClass: Record<Size, string> = {
  lg: "h-[52px] rounded-lg px-[22px] text-base",
  xl: "h-14 rounded-xl px-6 text-[19px]",
};

export default function Button({
  variant = "primary",
  size = "xl",
  fullWidth = true,
  className = "",
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={`border font-semibold tracking-[-0.01em] transition-colors disabled:cursor-not-allowed disabled:opacity-45 active:scale-[0.98] ${fullWidth ? "w-full" : ""} ${sizeClass[size]} ${variantClass[variant]} ${className}`}
      {...rest}
    />
  );
}
