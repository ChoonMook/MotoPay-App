// apps/api의 관리자 계정 관리 엔드포인트(/admin/accounts/*) 호출 — AD-SYS-04 사용자 계정 관리 화면 전용
import { authedRequest } from "./http";
import type { AdminAccountType } from "./adminAuth";

export interface AdminAccountListItem {
  id: string;
  username: string;
  name: string;
  email: string | null;
  phone: string | null;
  accountType: AdminAccountType;
  permGroup: string;
  useYn: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function listAccounts(): Promise<AdminAccountListItem[]> {
  return authedRequest<AdminAccountListItem[]>("/admin/accounts");
}

export function checkUsernameAvailable(username: string): Promise<{ available: boolean }> {
  return authedRequest<{ available: boolean }>(`/admin/accounts/check-username?username=${encodeURIComponent(username)}`);
}

export interface CreateAdminAccountInput {
  username: string;
  name: string;
  email?: string;
  phone?: string;
  accountType: AdminAccountType;
  permGroup: string;
}

export function createAccount(
  input: CreateAdminAccountInput,
): Promise<{ account: AdminAccountListItem; tempPassword: string }> {
  return authedRequest<{ account: AdminAccountListItem; tempPassword: string }>("/admin/accounts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface UpdateAdminAccountInput {
  name?: string;
  email?: string;
  phone?: string;
  accountType?: AdminAccountType;
  permGroup?: string;
  useYn?: boolean;
}

export function updateAccount(id: string, input: UpdateAdminAccountInput): Promise<AdminAccountListItem> {
  return authedRequest<AdminAccountListItem>(`/admin/accounts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
