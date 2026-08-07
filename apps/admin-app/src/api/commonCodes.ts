// apps/api의 공통코드 관리자 CRUD 엔드포인트(/admin/common-codes/*) 호출 — AD-SYS-03 공통 코드 관리 화면 전용
import { authedRequest } from "./http";

export interface CommonCodeGroup {
  code: string;
  name: string;
  useYn: boolean;
}

export interface CommonCodeDetailApi {
  code: string;
  detailCode: string;
  detailName: string;
  ref1: string | null;
  ref2: string | null;
  sortOrder: number;
  useYn: boolean;
}

export interface CommonCodeGroupWithDetails extends CommonCodeGroup {
  details: CommonCodeDetailApi[];
}

export function listGroups(): Promise<CommonCodeGroup[]> {
  return authedRequest<CommonCodeGroup[]>("/admin/common-codes");
}

export function getGroup(code: string): Promise<CommonCodeGroupWithDetails> {
  return authedRequest<CommonCodeGroupWithDetails>(`/admin/common-codes/${code}`);
}

export interface CreateCommonCodeGroupInput {
  code: string;
  name: string;
}

export function createGroup(input: CreateCommonCodeGroupInput): Promise<CommonCodeGroup> {
  return authedRequest<CommonCodeGroup>("/admin/common-codes", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface UpdateCommonCodeGroupInput {
  name?: string;
  useYn?: boolean;
}

export function updateGroup(code: string, input: UpdateCommonCodeGroupInput): Promise<CommonCodeGroup> {
  return authedRequest<CommonCodeGroup>(`/admin/common-codes/${code}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteGroup(code: string): Promise<void> {
  return authedRequest<void>(`/admin/common-codes/${code}`, { method: "DELETE" });
}

export interface CreateCommonCodeDetailInput {
  detailCode: string;
  detailName: string;
  ref1?: string;
  ref2?: string;
  sortOrder?: number;
}

export function createDetail(code: string, input: CreateCommonCodeDetailInput): Promise<CommonCodeDetailApi> {
  return authedRequest<CommonCodeDetailApi>(`/admin/common-codes/${code}/details`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface UpdateCommonCodeDetailInput {
  detailName?: string;
  ref1?: string;
  ref2?: string;
  sortOrder?: number;
  useYn?: boolean;
}

export function updateDetail(
  code: string,
  detailCode: string,
  input: UpdateCommonCodeDetailInput,
): Promise<CommonCodeDetailApi> {
  return authedRequest<CommonCodeDetailApi>(`/admin/common-codes/${code}/details/${detailCode}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteDetail(code: string, detailCode: string): Promise<void> {
  return authedRequest<void>(`/admin/common-codes/${code}/details/${detailCode}`, { method: "DELETE" });
}
