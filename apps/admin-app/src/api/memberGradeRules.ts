// apps/api의 회원 등급 기준 설정 관리자 엔드포인트(/admin/member-grade-rules/*) 호출 — AD-PNT-07 전용
import { authedRequest } from "./http";

export interface MemberGradeRuleApi {
  gradeCode: string; // GOLD/SILVER/BRONZE
  minSpendAmount: number;
  discountRate: number;
  voucherAmount: number;
  updatedBy: string | null;
  updatedAt: string;
}

export function listMemberGradeRules(): Promise<MemberGradeRuleApi[]> {
  return authedRequest<MemberGradeRuleApi[]>("/admin/member-grade-rules");
}

export interface UpdateMemberGradeRuleInput {
  minSpendAmount?: number;
  discountRate?: number;
  voucherAmount?: number;
}

export function updateMemberGradeRule(
  gradeCode: string,
  input: UpdateMemberGradeRuleInput,
): Promise<MemberGradeRuleApi> {
  return authedRequest<MemberGradeRuleApi>(`/admin/member-grade-rules/${gradeCode}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
