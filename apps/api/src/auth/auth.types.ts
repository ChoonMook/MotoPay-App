// JWT payload 및 인증 관련 공용 타입
import type { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string; // user id
  username: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** 비밀번호 재설정용 임시 토큰(access/refresh와 별도 시크릿·짧은 만료) payload */
export interface ResetTokenPayload {
  sub: string; // user id
  purpose: 'password-reset';
}

export interface SafeUser {
  id: string;
  username: string;
  name: string;
  email: string | null;
  phone: string | null;
  profileImageUrl: string | null;
  role: UserRole;
}
