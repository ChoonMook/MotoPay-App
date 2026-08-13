// 신차패키지·예약시공 등 여러 채널에서 공통으로 쓰는 화면(부위·농도 선택/인수확인/후기/업체상세)의 공유 타입
export const TINT_POSITIONS = ["전면유리", "측면 1열", "측면 2열", "후면유리", "선루프"] as const;
export type TintLevel = "5" | "15" | "30";
export type HandoverStatus = "pending" | "done";

// TINT_POSITIONS 한글 부위명 -> CommonCodeDetail(code='BID_TINT_POSITION') 코드값
export const TINT_POSITION_TO_CODE: Record<string, string> = {
  "전면유리": "FRONT",
  "측면 1열": "SIDE_1",
  "측면 2열": "SIDE_2",
  "후면유리": "REAR",
  "선루프": "SUNROOF",
};

// CommonCodeDetail(code='BID_TINT_POSITION') 코드값 -> 한글 부위명(위 매핑의 역방향)
export const TINT_POSITION_LABELS: Record<string, string> = {
  FRONT: "전면유리",
  SIDE_1: "측면 1열",
  SIDE_2: "측면 2열",
  REAR: "후면유리",
  SUNROOF: "선루프",
};

// CU-NCPK-09/CU-RSVC-20 예약확정·예약상세에 표시하는 시공 항목 1건 — 분류명·제품명·가격(썬팅은 부위별 농도까지)
// category는 신차패키지처럼 분류와 실제 제품명이 따로 있는 채널만 사용 — 예약시공(입찰)은 항목명 자체가 유일한 단위라 생략
export interface PackageSelectionItemView {
  category?: string; // 시공 항목(분류명, 예: "썬팅")
  product: string; // 실제 선택된 시공 제품명(또는 예약시공의 항목명)
  price: number; // 0이면 기본 포함, 그 외엔 업그레이드/추가옵션·확정 견적 가격
  tintDetail?: string; // 썬팅 항목인 경우 부위별 농도 요약(예: "전면유리 30% · 측면 1열 30%")
}
