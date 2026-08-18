// apps/api의 1:1 문의 관리자 엔드포인트(/admin/inquiries/*) 호출 — AD-CS-02 전용
import { authedRequest } from "./http";

export interface AdminInquiryListItem {
  inquiryNo: string;
  memberId: string;
  memberName: string;
  category: string; // -> CommonCodeDetail(code='INQUIRY_CATEGORY')
  title: string;
  status: string; // -> CommonCodeDetail(code='INQUIRY_STATUS')
  createdAt: string;
}

export interface ListAdminInquiriesParams {
  keyword?: string;
  category?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function listAdminInquiries(params: ListAdminInquiriesParams = {}): Promise<AdminInquiryListItem[]> {
  const query = new URLSearchParams();
  if (params.keyword) query.set("keyword", params.keyword);
  if (params.category) query.set("category", params.category);
  if (params.status) query.set("status", params.status);
  if (params.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params.dateTo) query.set("dateTo", params.dateTo);
  const qs = query.toString();
  return authedRequest<AdminInquiryListItem[]>(`/admin/inquiries${qs ? `?${qs}` : ""}`);
}

export interface AdminInquiryDetail extends AdminInquiryListItem {
  content: string;
  answer: string | null;
  answeredBy: string | null;
  answeredAt: string | null;
  photos: string[];
}

export function getAdminInquiryDetail(inquiryNo: string): Promise<AdminInquiryDetail> {
  return authedRequest<AdminInquiryDetail>(`/admin/inquiries/${inquiryNo}`);
}

export function answerInquiry(inquiryNo: string, answer: string): Promise<AdminInquiryDetail> {
  return authedRequest<AdminInquiryDetail>(`/admin/inquiries/${inquiryNo}/answer`, {
    method: "PATCH",
    body: JSON.stringify({ answer }),
  });
}
