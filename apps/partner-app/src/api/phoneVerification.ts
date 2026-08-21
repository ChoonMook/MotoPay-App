// apps/api의 SMS 인증번호(OTP) 발송·검증 엔드포인트 호출 — 아이디/비밀번호 찾기에서 휴대폰 소유 확인용(로그인 불필요)
import { apiRequest } from "./http";

export type PhoneVerifyPurpose = "FIND_USERNAME" | "RESET_PASSWORD";

export function sendPhoneVerificationCode(phone: string, purpose: PhoneVerifyPurpose): Promise<void> {
  return apiRequest<void>("/phone-verification/send-code", {
    method: "POST",
    body: JSON.stringify({ phone, purpose }),
  });
}

export function verifyPhoneCode(phone: string, code: string, purpose: PhoneVerifyPurpose): Promise<void> {
  return apiRequest<void>("/phone-verification/verify-code", {
    method: "POST",
    body: JSON.stringify({ phone, code, purpose }),
  });
}
