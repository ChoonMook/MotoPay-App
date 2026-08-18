// apps/api의 FAQ 조회 엔드포인트(/faqs) 호출 — 고객센터 FAQ(CU-CS-02) 전용, 로그인 불필요
import { apiRequest } from "./http";

export interface FaqApi {
  id: number;
  category: string; // -> CommonCodeDetail(code='FAQ_CATEGORY')
  question: string;
  answer: string;
  sortOrder: number;
  useYn: boolean;
}

export function listFaqs(): Promise<FaqApi[]> {
  return apiRequest<FaqApi[]>("/faqs");
}
