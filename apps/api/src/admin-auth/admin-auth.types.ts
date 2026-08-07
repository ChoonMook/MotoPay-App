// 관리자(admin-app) 로그인 JWT payload 및 관련 공용 타입 — User(일반고객)/PartnerUser(시공업체)와 별도 realm
import type { AdminAccountType } from '@prisma/client';

export interface JwtAdminPayload {
  sub: string; // admin account id
  username: string;
  type: 'admin';
}

export interface AdminAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SafeAdminAccount {
  id: string;
  username: string;
  name: string;
  email: string | null;
  phone: string | null;
  accountType: AdminAccountType;
  permGroup: string;
  lastLoginAt: Date | null;
}
