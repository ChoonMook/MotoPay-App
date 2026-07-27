// 포인트(CU-PNT-01,02,06,07) 플로우에서 공유하는 상태 타입 정의
export type PtScreenId = "main" | "chargeamt" | "hist" | "grade";
export type PtHistKind = "charge" | "use" | "admin";
export type PtHistFilter = "all" | PtHistKind;
export type PtMethodKey = "bank" | "card";

export interface PtHistItem {
  title: string;
  date: string;
  kind: PtHistKind;
  amt: number;
  bal: number;
}
