// apps/api의 내 포인트 조회 엔드포인트(/me/points/*) 호출 — 포인트홈(CU-PNT-01)·포인트 내역(CU-PNT-06)·
// 회원 등급 혜택(CU-PNT-07) 전용, 로그인 필요
import { authedRequest } from "./http";

export interface MyPointsSummaryApi {
  balance: number;
  totalCharged: number;
  totalUsed: number;
}

export function getMyPointsSummary(): Promise<MyPointsSummaryApi> {
  return authedRequest<MyPointsSummaryApi>("/me/points");
}

export interface MyPointHistoryItemApi {
  title: string;
  kind: string; // -> CommonCodeDetail(code='POINT_HIST_KIND')
  amount: number;
  balanceAfter: number;
  createdAt: string; // ISO
}

export function getMyPointHistory(): Promise<MyPointHistoryItemApi[]> {
  return authedRequest<MyPointHistoryItemApi[]>("/me/points/history");
}

export interface MyGradeTierApi {
  gradeCode: string;
  minSpendAmount: number;
  discountRate: number;
  voucherAmount: number;
}

export interface MyGradeInfoApi {
  grade: string | null;
  recentSpend: number;
  currentThreshold: number;
  nextGrade: string | null;
  nextThreshold: number | null;
  tiers: MyGradeTierApi[];
}

export function getMyGradeInfo(): Promise<MyGradeInfoApi> {
  return authedRequest<MyGradeInfoApi>("/me/points/grade");
}

export interface ChargeMyPointsInput {
  amount: number;
  method: "BANK" | "CARD";
}

export interface ChargeMyPointsResultApi {
  kind: string;
  amount: number;
  balanceAfter: number;
  title: string;
  createdAt: string;
}

export function chargeMyPoints(input: ChargeMyPointsInput): Promise<ChargeMyPointsResultApi> {
  return authedRequest<ChargeMyPointsResultApi>("/me/points/charge", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
