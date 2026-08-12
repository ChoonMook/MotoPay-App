// apps/api의 업체 관리 엔드포인트(/admin/companies/*) 호출 — AD-CO-02/03/04 업체 관리 화면 전용
import { authedRequest } from "./http";

export interface CompanyListItem {
  id: number;
  coType: string;
  name: string;
  businessRegNo: string;
  representativeName: string | null;
  contactName: string | null;
  contactPhone: string | null;
  shopCode: string | null;
  useYn: boolean;
  suspendReason: string | null;
  companyZipCode: string | null;
  companyAddress: string | null;
  companyAddressDetail: string | null;
  businessType: string | null;
  businessItem: string | null;
  bizDivision: string | null;
  repPhone: string | null;
  faxNo: string | null;
  bankName: string | null;
  accountNo: string | null;
  bizRegCertPath: string | null;
  bankbookCopyPath: string | null;
  approved: boolean;
  approvedAt: string | null;
  approvedBy: string | null;
  createdAt: string;
}

export function listCompanies(): Promise<CompanyListItem[]> {
  return authedRequest<CompanyListItem[]>("/admin/companies");
}

export interface CreateCompanyInput {
  coType: string;
  name: string;
  businessRegNo: string;
  representativeName?: string;
  contactName?: string;
  contactPhone?: string;
  companyZipCode?: string;
  companyAddress?: string;
  companyAddressDetail?: string;
  businessType?: string;
  businessItem?: string;
  bizDivision?: string;
  repPhone?: string;
  faxNo?: string;
  bankName?: string;
  accountNo?: string;
}

export function createCompany(input: CreateCompanyInput): Promise<CompanyListItem> {
  return authedRequest<CompanyListItem>("/admin/companies", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface UpdateCompanyInput {
  name?: string;
  businessRegNo?: string;
  representativeName?: string;
  contactName?: string;
  contactPhone?: string;
  useYn?: boolean;
  suspendReason?: string;
  companyZipCode?: string;
  companyAddress?: string;
  companyAddressDetail?: string;
  businessType?: string;
  businessItem?: string;
  bizDivision?: string;
  repPhone?: string;
  faxNo?: string;
  bankName?: string;
  accountNo?: string;
}

export function updateCompany(id: number, input: UpdateCompanyInput): Promise<CompanyListItem> {
  return authedRequest<CompanyListItem>(`/admin/companies/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export type CompanyDocType = "BIZ_REG_CERT" | "BANKBOOK_COPY";

export function uploadCompanyDocument(id: number, fileBase64: string, docType: CompanyDocType): Promise<CompanyListItem> {
  return authedRequest<CompanyListItem>(`/admin/companies/${id}/documents`, {
    method: "POST",
    body: JSON.stringify({ fileBase64, docType }),
  });
}

export function deleteCompanyDocument(id: number, docType: CompanyDocType): Promise<CompanyListItem> {
  return authedRequest<CompanyListItem>(`/admin/companies/${id}/documents/${docType}`, { method: "DELETE" });
}

export function approveCompany(id: number): Promise<CompanyListItem> {
  return authedRequest<CompanyListItem>(`/admin/companies/${id}/approve`, { method: "POST" });
}

export function revokeCompanyApproval(id: number): Promise<CompanyListItem> {
  return authedRequest<CompanyListItem>(`/admin/companies/${id}/revoke-approval`, { method: "POST" });
}

export function getDealerShopMappings(id: number): Promise<string[]> {
  return authedRequest<string[]>(`/admin/companies/${id}/shop-mappings`);
}

export function setDealerShopMappings(id: number, shopCodes: string[]): Promise<string[]> {
  return authedRequest<string[]>(`/admin/companies/${id}/shop-mappings`, {
    method: "PUT",
    body: JSON.stringify({ shopCodes }),
  });
}

export interface ShopPhoto {
  id: number;
  shopCode: string;
  photoPath: string;
  photoType: string;
  sortOrder: number;
}

export interface CompanyShopDetail {
  shopCode: string;
  name: string;
  greeting: string | null;
  intro: string | null;
  zipCode: string | null;
  address: string | null;
  addressDetail: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  businessHours: string | null;
  useYn: boolean;
  photos: ShopPhoto[];
  categories: string[];
}

export function getCompanyShop(id: number): Promise<CompanyShopDetail> {
  return authedRequest<CompanyShopDetail>(`/admin/companies/${id}/shop`);
}

export interface UpdateCompanyShopInput {
  greeting?: string;
  intro?: string;
  zipCode?: string;
  address?: string;
  addressDetail?: string;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string;
  businessHours?: string;
  categories?: string[];
}

export function updateCompanyShop(id: number, input: UpdateCompanyShopInput): Promise<CompanyShopDetail> {
  return authedRequest<CompanyShopDetail>(`/admin/companies/${id}/shop`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function uploadCompanyShopPhoto(
  id: number,
  imageBase64: string,
  photoType: "MAIN" | "CASE",
): Promise<CompanyShopDetail> {
  return authedRequest<CompanyShopDetail>(`/admin/companies/${id}/shop/photos`, {
    method: "POST",
    body: JSON.stringify({ imageBase64, photoType }),
  });
}

export function deleteCompanyShopPhoto(id: number, photoId: number): Promise<CompanyShopDetail> {
  return authedRequest<CompanyShopDetail>(`/admin/companies/${id}/shop/photos/${photoId}`, { method: "DELETE" });
}

/** 월 단위 휴무일 조회("YYYY-MM-DD" 목록) */
export function listCompanyHolidays(id: number, year: number, month: number): Promise<string[]> {
  return authedRequest<string[]>(`/admin/companies/${id}/holidays?year=${year}&month=${month}`);
}

export function addCompanyHolidays(id: number, dates: string[]): Promise<void> {
  return authedRequest<void>(`/admin/companies/${id}/holidays`, {
    method: "POST",
    body: JSON.stringify({ dates }),
  });
}

export function removeCompanyHoliday(id: number, date: string): Promise<void> {
  return authedRequest<void>(`/admin/companies/${id}/holidays/${date}`, { method: "DELETE" });
}

export interface TimeSlot {
  time: string; // "HH:mm"
  capacity: number;
}

export function getCompanyTimeSlots(id: number, dayType: string): Promise<TimeSlot[]> {
  return authedRequest<TimeSlot[]>(`/admin/companies/${id}/time-slots/${dayType}`);
}

export function replaceCompanyTimeSlots(id: number, dayType: string, slots: TimeSlot[]): Promise<void> {
  return authedRequest<void>(`/admin/companies/${id}/time-slots/${dayType}`, {
    method: "PUT",
    body: JSON.stringify({ slots }),
  });
}

export interface DailySlotReservation {
  reservationNo: string;
  seq: number;
  reservationType: string;
  customerName: string;
}

export interface DailySlot {
  time: string;
  capacity: number | null;
  isLocked: boolean;
  reservedCount: number;
  reservations: DailySlotReservation[];
}

export interface DailySchedule {
  date: string;
  isHoliday: boolean;
  slots: DailySlot[];
}

export function getCompanyDailySchedule(id: number, date: string): Promise<DailySchedule> {
  return authedRequest<DailySchedule>(`/admin/companies/${id}/daily-schedule?date=${date}`);
}

export function upsertCompanyDailySlot(
  id: number,
  params: { date: string; time: string; capacity?: number; isLocked?: boolean },
): Promise<void> {
  return authedRequest<void>(`/admin/companies/${id}/daily-slots`, {
    method: "PATCH",
    body: JSON.stringify(params),
  });
}

export interface PartnerUserListItem {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string | null;
  useYn: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export function listPartnerUsers(companyId: number): Promise<PartnerUserListItem[]> {
  return authedRequest<PartnerUserListItem[]>(`/admin/companies/${companyId}/partner-users`);
}

export function checkPartnerUsernameAvailable(companyId: number, username: string): Promise<{ available: boolean }> {
  return authedRequest<{ available: boolean }>(
    `/admin/companies/${companyId}/partner-users/check-username?username=${encodeURIComponent(username)}`,
  );
}

export interface CreatePartnerUserInput {
  username: string;
  name: string;
  email: string;
  phone: string;
}

export function createPartnerUser(
  companyId: number,
  input: CreatePartnerUserInput,
): Promise<{ user: PartnerUserListItem; tempPassword: string }> {
  return authedRequest<{ user: PartnerUserListItem; tempPassword: string }>(`/admin/companies/${companyId}/partner-users`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface UpdatePartnerUserInput {
  name?: string;
  email?: string;
  phone?: string;
  useYn?: boolean;
}

export function updatePartnerUser(
  companyId: number,
  userId: string,
  input: UpdatePartnerUserInput,
): Promise<PartnerUserListItem> {
  return authedRequest<PartnerUserListItem>(`/admin/companies/${companyId}/partner-users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deletePartnerUser(companyId: number, userId: string): Promise<void> {
  return authedRequest<void>(`/admin/companies/${companyId}/partner-users/${userId}`, { method: "DELETE" });
}
