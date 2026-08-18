// apps/api의 1:1 문의 등록·조회 엔드포인트(/me/inquiries) 호출 — 고객센터(CU-CS-03~05) 전용, 로그인 필요
import { authedRequest } from "./http";

export interface MyInquiryApi {
  inquiryNo: string;
  category: string; // -> CommonCodeDetail(code='INQUIRY_CATEGORY')
  title: string;
  content: string;
  status: string; // PENDING/ANSWERED
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
  photos: string[]; // uploads/ 기준 상대경로
}

export interface CreateInquiryInput {
  category: string;
  title: string;
  content: string;
  /** 첨부 사진(data URI, base64) 목록 — 최대 5장 */
  photos?: string[];
}

export function createInquiry(input: CreateInquiryInput): Promise<MyInquiryApi> {
  return authedRequest<MyInquiryApi>("/me/inquiries", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listMyInquiries(): Promise<MyInquiryApi[]> {
  return authedRequest<MyInquiryApi[]>("/me/inquiries");
}

export interface UpdateInquiryInput {
  category?: string;
  title?: string;
  content?: string;
  /** 전달 시 기존 사진을 이 목록으로 완전히 교체 — 유지할 기존 사진은 photos에 담긴 상대경로 그대로, 새 사진은 data URI로 전달 */
  photos?: string[];
}

export function updateInquiry(inquiryNo: string, input: UpdateInquiryInput): Promise<MyInquiryApi> {
  return authedRequest<MyInquiryApi>(`/me/inquiries/${inquiryNo}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
