// 쇼핑몰 화면 전용 아이콘 (원본 dc.html의 svg 그대로 이식)
interface HeartIconProps {
  filled?: boolean;
  color?: string;
}

export function SearchIcon({ size = 21 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

export function CartIcon({ size = 21 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6h15l-1.5 9h-12z" />
      <path d="M6 6 5 2H2" />
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
    </svg>
  );
}

export function HeartIcon({ filled = false, color = "var(--gray-400)" }: HeartIconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? color : "none"} stroke={color} strokeWidth="2">
      <path d="M12 21s-7.5-4.6-10-9.3C.4 8 2 4.5 5.5 4A5.6 5.6 0 0 1 12 7a5.6 5.6 0 0 1 6.5-3c3.5.5 5 4 3.5 7.7C19.5 16.4 12 21 12 21Z" />
    </svg>
  );
}

export function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  );
}

export function TruckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 8v13H4V8" />
      <path d="M2 3h20v5H2z" />
      <path d="M10 12h4" />
    </svg>
  );
}

export function CouponIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6" />
      <path d="M2 8h20v4H2z" />
      <path d="M12 8v14M12 8a3 3 0 1 0-3-3c0 1.5 3 3 3 3Z" />
      <path d="M12 8a3 3 0 1 1 3-3c0 1.5-3 3-3 3Z" />
    </svg>
  );
}

const CAT_PATHS: Record<string, string> = {
  engineoil: "M9 3h6v3H9z M8 6h8l1 15H7z M9 11h6",
  blackbox: "M4 8h16l-1 10H5z M9 8V6a3 3 0 0 1 6 0v2",
  tint: "M4 5h16v14H4z M9 5v14 M15 5v14",
  coating: "M12 3l7 4v6c0 4-3 6-7 8-4-2-7-4-7-8V7z",
  tire: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  etc: "M4 8h16l-1 12H5z M8.5 8a3.5 3.5 0 1 1 7 0",
};

export function CategoryIcon({ cat }: { cat: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={CAT_PATHS[cat]} />
    </svg>
  );
}
