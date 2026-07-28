// 파트너(시공업체) 로그인 JWT payload 및 관련 공용 타입 — User(일반고객) 쪽 auth.types.ts와 별도 realm
export interface JwtPartnerPayload {
  sub: string; // partner user id
  username: string;
  type: 'partner';
}

export interface PartnerAuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** 비밀번호 재설정용 임시 토큰(access/refresh와 별도 시크릿·짧은 만료) payload */
export interface PartnerResetTokenPayload {
  sub: string; // partner user id
  purpose: 'password-reset';
}

export interface SafePartnerUser {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  shopCode: string;
  shopName: string;
  mustChangePassword: boolean;
}
