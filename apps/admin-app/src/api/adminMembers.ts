// apps/api의 고객 회원 관리 엔드포인트(/admin/members/*) 호출 — AD-MBR-02 고객 회원 목록 화면 전용
import { authedRequest } from "./http";

export interface AdminMemberListItem {
  id: string;
  username: string;
  name: string;
  phone: string | null;
  email: string | null;
  carCount: number;
  withdrawnAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AdminMemberCar {
  id: number;
  regType: string;
  carBrandCode: string;
  carModelCode: string;
  trimName: string | null;
  modelYear: string | null;
  plateNumber: string | null;
  isDefault: boolean;
}

export interface AdminMemberPackage {
  vin: string;
  packageCode: string;
  packageName: string | null;
  carBrandCode: string;
  carModelCode: string;
  trimName: string;
  isMapped: boolean;
  mappedAt: string | null;
  createdAt: string;
}

export interface AdminMemberDetail extends AdminMemberListItem {
  cars: AdminMemberCar[];
  packages: AdminMemberPackage[];
}

export function listMembers(): Promise<AdminMemberListItem[]> {
  return authedRequest<AdminMemberListItem[]>("/admin/members");
}

export function getMemberDetail(id: string): Promise<AdminMemberDetail> {
  return authedRequest<AdminMemberDetail>(`/admin/members/${id}`);
}

export function setMemberWithdrawn(id: string, withdrawn: boolean): Promise<AdminMemberListItem> {
  return authedRequest<AdminMemberListItem>(`/admin/members/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ withdrawn }),
  });
}
