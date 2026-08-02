// PT-STL-01~03 정산·후기 도메인 타입 - 백엔드 정산/후기 모델이 아직 없어 프론트 목업 상태로만 관리
export type SettlementStatus = "wait" | "done" | "hold";
export type SettlementPeriod = "this" | "last";

export interface Settlement {
  id: string;
  date: string;
  customer: string;
  car: string;
  amount: number;
  fee: number;
  status: SettlementStatus;
  period: SettlementPeriod;
}

export interface Review {
  id: string;
  rating: number;
  content: string;
  customer: string;
  car: string;
  date: string;
}
