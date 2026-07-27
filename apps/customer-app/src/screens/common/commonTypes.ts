// 신차패키지·예약시공 등 여러 채널에서 공통으로 쓰는 화면(부위·농도 선택/인수확인/후기/업체상세)의 공유 타입
export const TINT_POSITIONS = ["전면유리", "측면 1열", "측면 2열", "후면유리", "선루프"] as const;
export type TintLevel = "5" | "15" | "30";
export type HandoverStatus = "pending" | "done";
