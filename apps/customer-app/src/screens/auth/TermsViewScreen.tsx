// CU-AUTH-08: 서비스 이용약관 전문 보기
import DocViewSheet from "./DocViewSheet";

interface TermsViewScreenProps {
  onClose: () => void;
  onAgree: () => void;
}

const BODY = `제1조 (목적)
본 약관은 MotoPay(이하 "회사")가 제공하는 자동차 정비 견적·예약·결제 서비스의 이용조건 및 절차를 규정합니다.

제2조 (정의)
· "회원"이란 본 약관에 동의하고 서비스를 이용하는 자를 말합니다.
· "시공업체"란 견적·시공을 제공하는 파트너를 말합니다.

제3조 (서비스의 제공)
회사는 견적 비교, 예약, 상품 구매, 포인트·쿠폰, 결제 대행 서비스를 제공합니다.

제4조 (회원의 의무)
회원은 정확한 정보를 제공해야 하며, 타인의 정보를 도용해서는 안 됩니다.

제5조 (결제 및 환불)
결제는 회사가 제공하는 수단으로 이루어지며, 환불은 관계 법령 및 취소·환불 정책에 따릅니다.

제6조 (책임의 한계)
회사는 시공 품질에 대해 카닥수리보증 정책 범위 내에서 책임을 부담합니다.`;

export default function TermsViewScreen({ onClose, onAgree }: TermsViewScreenProps) {
  return <DocViewSheet title="서비스 이용약관" body={BODY} onClose={onClose} onAgree={onAgree} />;
}
