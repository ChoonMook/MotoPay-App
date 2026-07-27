// 로그인/SNS 계정 연결 화면 공용 SNS 프로바이더 아이콘·배경색
export type SnsProvider = "카카오" | "네이버" | "Gmail" | "Apple";

export const SNS_BG: Record<SnsProvider, string> = {
  카카오: "#FEE500",
  네이버: "#03C75A",
  Gmail: "#fff",
  Apple: "#111",
};

export const SNS_PROVIDERS: SnsProvider[] = ["카카오", "네이버", "Gmail", "Apple"];

// size: 아이콘 컨테이너(원형 배지) 지름(px). 원본 dc.html 비율(54px 원 → 26px 아이콘) 그대로 적용.
export function SnsIcon({ provider, size }: { provider: SnsProvider; size: number }) {
  const iconSize = Math.round(size * (26 / 54));

  switch (provider) {
    case "카카오":
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="#3C1E1E">
          <path d="M12 3C6.9 3 3 6.3 3 10.3c0 2.5 1.7 4.7 4.2 6l-1 3.7c-.1.4.3.7.6.5l4.4-2.9c.3 0 .5.1.8.1 5.1 0 9-3.3 9-7.4S17.1 3 12 3Z" />
        </svg>
      );
    case "네이버":
      return (
        <span
          className="font-extrabold text-white"
          style={{ fontFamily: "Arial", fontSize: iconSize * 0.85 }}
        >
          N
        </span>
      );
    case "Gmail":
      return (
        <svg width={iconSize} height={iconSize * 0.77} viewBox="0 0 24 18">
          <path d="M2 3.5 12 11 22 3.5" fill="none" stroke="#EA4335" strokeWidth="2.4" strokeLinejoin="round" />
          <rect x="1.2" y="2.2" width="21.6" height="14.6" rx="2" fill="none" stroke="#EA4335" strokeWidth="2.2" />
        </svg>
      );
    case "Apple":
      return (
        <svg width={iconSize * 0.92} height={iconSize} viewBox="0 0 24 26" fill="#fff">
          <path d="M17 13.6c0-2.7 2.2-4 2.3-4.1-1.3-1.8-3.2-2.1-3.9-2.1-1.7-.2-3.2 1-4 1-.8 0-2.1-1-3.4-.9-1.8 0-3.4 1-4.3 2.6-1.8 3.2-.5 8 1.3 10.6.9 1.3 1.9 2.7 3.3 2.7 1.3-.1 1.8-.9 3.4-.9 1.6 0 2 .9 3.4.8 1.4 0 2.3-1.3 3.2-2.6.6-.9 1-1.8 1.4-2.8-3.1-1.2-2.4-4.6-2.4-4.6Zm-2.6-8.4c.7-.9 1.2-2.1 1.1-3.3-1 0-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.2 1.1.1 2.3-.6 3-1.5Z" />
        </svg>
      );
  }
}
