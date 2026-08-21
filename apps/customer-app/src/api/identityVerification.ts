// apps/api의 PortOne 본인인증 결과 조회 엔드포인트 호출 — 회원가입 실명인증(CU-AUTH-05)용(로그인 불필요)
import { apiRequest } from "./http";

export interface VerifiedIdentity {
  name: string;
  phone: string;
}

// 모바일에서는 PortOne이 팝업이 아니라 현재 페이지 자체를 PG사로 리디렉션했다가 돌아오는 방식만 지원해서(팝업
// 창유형은 PG사가 거부함) 인증 완료 시 SPA 전체가 새로고침된다 — 새로고침 직전에 이 키로 진행 중이던
// identityVerificationId를 남겨두면, 새로고침 후 AuthFlow가 이를 보고 회원가입 실명인증 단계를 자동으로 재개한다
export const PENDING_IDENTITY_VERIFICATION_KEY = "mp_pending_identity_verification";

export function confirmIdentityVerification(identityVerificationId: string): Promise<VerifiedIdentity> {
  return apiRequest<VerifiedIdentity>("/identity-verification/confirm", {
    method: "POST",
    body: JSON.stringify({ identityVerificationId }),
  });
}
