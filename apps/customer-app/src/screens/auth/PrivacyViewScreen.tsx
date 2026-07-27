// CU-AUTH-09: 개인정보 처리방침 전문 보기
import DocViewSheet from "./DocViewSheet";

interface PrivacyViewScreenProps {
  onClose: () => void;
  onAgree: () => void;
}

const BODY = `제1조 (수집하는 개인정보 항목)
MotoPay는 회원가입·서비스 제공을 위해 다음의 개인정보를 수집합니다.
· 필수: 이름, 휴대폰 번호, 아이디, 비밀번호, 이메일
· 자동수집: 기기정보, 접속기록, 결제기록

제2조 (이용 목적)
· 본인확인 및 회원 관리
· 견적·예약·상품 주문 및 결제
· 신차패키지 매핑 및 혜택 안내

제3조 (보유 및 이용 기간)
회원 탈퇴 시까지 보유하며, 관계 법령에 따라 일정 기간 보관 후 파기합니다.
· 계약·결제 기록: 5년
· 소비자 불만·분쟁 처리 기록: 3년

제4조 (동의 거부 권리)
필수 항목 동의를 거부할 권리가 있으나, 거부 시 회원가입이 제한됩니다.`;

export default function PrivacyViewScreen({ onClose, onAgree }: PrivacyViewScreenProps) {
  return <DocViewSheet title="개인정보 처리방침" body={BODY} onClose={onClose} onAgree={onAgree} />;
}
