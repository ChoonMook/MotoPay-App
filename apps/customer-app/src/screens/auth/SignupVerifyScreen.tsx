// CU-AUTH-05: 회원가입 - 휴대폰 본인인증(실명인증) - PortOne(NICE/PASS 등)으로 실제 본인인증을 진행하고,
// 인증 결과(이름·휴대폰번호)는 서버가 PortOne에 직접 재조회해 확정한 값을 그대로 표시(사용자가 임의로 고칠 수 없음)
import { useEffect, useRef, useState } from "react";
import * as PortOne from "@portone/browser-sdk/v2";
import Button from "../../components/ui/Button";
import ProgressSteps from "../../components/ui/ProgressSteps";
import { PORTONE_CHANNEL_KEY, PORTONE_STORE_ID } from "../../api/config";
import { PENDING_IDENTITY_VERIFICATION_KEY } from "../../api/identityVerification";

interface SignupVerifyScreenProps {
  onBack: () => void;
  onNext: (name: string, phone: string, identityVerificationId: string) => void;
  onVerifyIdentity: (identityVerificationId: string) => Promise<{ name: string; phone: string }>;
  // 새로고침 재개용 — 이전 방문에서 PG사 리디렉션으로 나갔다가 돌아온 경우, 버튼을 다시 누르게 하지 않고 바로 결과를 조회
  resumeIdentityVerificationId?: string;
}

const STEPS = ["실명인증", "정보입력", "약관동의"];

// crypto.randomUUID()는 보안 컨텍스트(HTTPS)에서만 지원됨 — 테스트 서버가 평문 HTTP라 getRandomValues로 직접 UUIDv4를 생성
// (getRandomValues는 HTTP에서도 동작함, 이 ID는 검증 시도를 구분하는 용도라 암호학적 강도가 중요하지 않음)
function generateVerificationId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  const uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  return `identity-verification-${uuid}`;
}

export default function SignupVerifyScreen({
  onBack,
  onNext,
  onVerifyIdentity,
  resumeIdentityVerificationId,
}: SignupVerifyScreenProps) {
  const [verifying, setVerifying] = useState(!!resumeIdentityVerificationId);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState<{ name: string; phone: string; identityVerificationId: string } | null>(
    null,
  );
  const pendingIdRef = useRef<string | null>(null);

  const finishVerification = (identityVerificationId: string) => {
    onVerifyIdentity(identityVerificationId)
      .then((result) => setVerified({ ...result, identityVerificationId }))
      .catch((err) => setError(err instanceof Error ? err.message : "본인인증에 실패했습니다."))
      .finally(() => {
        setVerifying(false);
        sessionStorage.removeItem(PENDING_IDENTITY_VERIFICATION_KEY);
      });
  };

  // 안드로이드 앱(motopay-mobile) 안에서는 PortOne 팝업이 네이티브 모달 웹뷰로 대체되어(window.open이 안드로이드
  // WebView에서 막힘) 아래 requestIdentityVerification()의 Promise가 응답하지 않는다 — 대신 팝업이 우리
  // origin으로 돌아와 닫힐 때 네이티브 셸이 이 콜백을 호출해 완료를 알려준다(일반 브라우저에서는 안 쓰임)
  useEffect(() => {
    window.__motoHandlePortOneReturn = () => {
      if (pendingIdRef.current) finishVerification(pendingIdRef.current);
    };
    return () => {
      window.__motoHandlePortOneReturn = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 이 화면에 처음 진입했을 때 이전 방문에서 남겨둔 재개용 ID가 있으면(=PG사 리디렉션으로 나갔다가 SPA가
  // 새로고침되어 돌아온 경우) 버튼을 다시 누르게 하지 않고 바로 서버에 결과를 재조회한다
  useEffect(() => {
    if (resumeIdentityVerificationId) finishVerification(resumeIdentityVerificationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = async () => {
    setError("");
    setVerifying(true);
    const identityVerificationId = generateVerificationId();
    pendingIdRef.current = identityVerificationId;
    // 모바일(안드로이드 앱 포함)에서는 PortOne이 팝업을 지원하지 않는 PG사가 있어(KCP 등) 현재 페이지 자체를
    // PG사로 리디렉션했다가 돌아오는 방식이 강제된다 — 돌아올 때 우리 SPA가 통째로 새로고침되므로, 나가기 전에
    // 진행 중인 ID를 남겨둬서 새로고침 후 이어서 조회할 수 있게 한다(finishVerification에서 완료 시 제거)
    sessionStorage.setItem(PENDING_IDENTITY_VERIFICATION_KEY, identityVerificationId);
    try {
      const response = await PortOne.requestIdentityVerification({
        storeId: PORTONE_STORE_ID,
        channelKey: PORTONE_CHANNEL_KEY,
        identityVerificationId,
        redirectUrl: window.location.origin,
      });
      // 팝업이 열리는 환경(데스크톱 브라우저 등)에서는 여기서 바로 결과가 옴 — 리디렉션 방식(대부분의 모바일)에서는
      // 이 Promise가 응답하지 않고 페이지 자체가 나갔다가 새로고침되어 돌아오며, 위 재개 로직이 완료를 처리한다
      if (response?.code !== undefined) {
        // 사용자 취소 등도 이 분기로 들어옴(별도 취소 코드 구분 없이 동일하게 안내)
        setError(response.message ?? "본인인증이 취소되었거나 실패했습니다.");
        setVerifying(false);
        sessionStorage.removeItem(PENDING_IDENTITY_VERIFICATION_KEY);
        return;
      }
      finishVerification(identityVerificationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "본인인증에 실패했습니다.");
      setVerifying(false);
      sessionStorage.removeItem(PENDING_IDENTITY_VERIFICATION_KEY);
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex-none bg-white px-6 pt-[50px] pb-4">
        <div className="mb-[22px] flex items-center gap-3">
          <span onClick={onBack} className="cursor-pointer text-[22px] leading-none text-gray-800">
            ‹
          </span>
          <span className="text-lg font-bold text-gray-900">회원가입</span>
        </div>
        <ProgressSteps steps={STEPS} current={0} />
      </div>
      <div className="mp-scroll flex-1 overflow-y-auto px-6 pt-2 pb-5">
        <div className="mt-2 mb-[6px] text-[22px] font-extrabold tracking-tight text-gray-900">
          본인인증을 진행해 주세요
        </div>
        <div className="mb-6 text-sm text-gray-600">안전한 가입을 위해 휴대폰 본인인증이 필요해요.</div>

        {!verified && (
          <Button onClick={handleVerify} disabled={verifying}>
            {verifying ? "인증 진행 중..." : "본인인증하기"}
          </Button>
        )}
        {error && <div className="mt-2 text-xs text-status-danger">{error}</div>}

        {verified && (
          <div className="mt-[18px] rounded-xl bg-gray-100 p-4" style={{ animation: "mp-screen .3s ease" }}>
            <div className="mb-2.5 flex items-center gap-1.5 text-[13px] font-bold text-status-success">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-status-success text-[11px] text-white">
                ✓
              </span>
              인증 완료
            </div>
            <div className="text-sm text-gray-800">
              <span className="font-semibold">{verified.name}</span>
              <span className="ml-2 text-gray-500">{verified.phone}</span>
            </div>
          </div>
        )}
      </div>
      <div className="flex-none border-t border-gray-100 bg-white px-6 pt-3.5 pb-6">
        <Button
          disabled={!verified}
          onClick={() => verified && onNext(verified.name, verified.phone, verified.identityVerificationId)}
        >
          다음
        </Button>
      </div>
    </div>
  );
}
