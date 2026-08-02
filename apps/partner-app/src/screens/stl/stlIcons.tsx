// 정산·후기 화면 전용 아이콘 (원본 dc.html의 icon() SVG 그대로 이식)
export function HistIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M3 9.5h18M8 14h3M8 17h6" />
    </svg>
  );
}

export function ReviewIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.5 14.7 8.6l6.6.7-5 4.4 1.5 6.5L12 16.9l-5.8 3.3 1.5-6.5-5-4.4 6.6-.7Z" />
    </svg>
  );
}
