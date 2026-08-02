// PT-RSVC-01~13 예약시공관리(입찰) 도메인 타입 - 백엔드 입찰/추천안 모델이 아직 없어 프론트 목업 상태로만 관리
export type ReqType = "general" | "expert";
export type ReqStatus = "open" | "active" | "closed";

export interface RsvcItem {
  name: string;
  spec: string;
}

export interface BidReq {
  id: string;
  type: ReqType;
  customer: string;
  car: string;
  distance: string;
  category?: string;
  items: RsvcItem[];
  budgetLabel: string;
  deadlineLabel: string;
  status: ReqStatus;
  myBid?: number;
  myPlan?: { price: number; submitted?: boolean };
  picked?: boolean;
}

export type JobStatus = "착수전" | "시공중" | "완료";
export type ReschedStatus = "none" | "sent";

export interface RsvcJob {
  id: string;
  customer: string;
  car: string;
  vin: string;
  status: JobStatus;
  schedule: string;
  items: RsvcItem[];
  doneCheck: Record<number, boolean>;
  photos: string[];
  memo: string;
  reschedStatus: ReschedStatus;
  reschedReason: string;
  reschedDt: string;
}

export interface RsvcProduct {
  id: string;
  name: string;
  brand: string;
  bkey?: string;
  price: number;
}

export interface PlanLine {
  name: string;
  spec: string;
  productId: string;
  offer: string;
  posOff: Record<string, boolean>;
  posLevels: Record<string, string>;
  posBulk: boolean;
}
