// apps/api의 공통코드 상세 조회(GET /common-codes/:code) 호출 — 로그인 불필요
import { apiRequest } from "./http";

export interface CommonCodeDetailApi {
  code: string;
  detailCode: string;
  detailName: string;
  ref1: string | null;
  ref2: string | null;
}

export function getCommonCodeDetails(code: string): Promise<CommonCodeDetailApi[]> {
  return apiRequest<CommonCodeDetailApi[]>(`/common-codes/${code}`);
}
