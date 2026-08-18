// apps/api의 FAQ 관리자 엔드포인트(/admin/faqs/*) 호출 — AD-CS-03 전용
import { authedRequest } from "./http";

export interface AdminFaqItem {
  id: number;
  category: string; // -> CommonCodeDetail(code='FAQ_CATEGORY')
  question: string;
  answer: string;
  sortOrder: number;
  useYn: boolean;
}

export function listAdminFaqs(category?: string): Promise<AdminFaqItem[]> {
  const qs = category ? `?category=${encodeURIComponent(category)}` : "";
  return authedRequest<AdminFaqItem[]>(`/admin/faqs${qs}`);
}

export interface CreateFaqInput {
  category: string;
  question: string;
  answer: string;
}

export function createFaq(input: CreateFaqInput): Promise<AdminFaqItem> {
  return authedRequest<AdminFaqItem>("/admin/faqs", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface UpdateFaqInput {
  category?: string;
  question?: string;
  answer?: string;
  useYn?: boolean;
}

export function updateFaq(id: number, input: UpdateFaqInput): Promise<AdminFaqItem> {
  return authedRequest<AdminFaqItem>(`/admin/faqs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteFaq(id: number): Promise<void> {
  return authedRequest<void>(`/admin/faqs/${id}`, { method: "DELETE" });
}

export function reorderFaqs(items: { id: number; sortOrder: number }[]): Promise<void> {
  return authedRequest<void>("/admin/faqs/reorder", {
    method: "PATCH",
    body: JSON.stringify({ items }),
  });
}
