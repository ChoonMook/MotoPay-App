// 고객센터 데모 데이터: FAQ·1:1문의 목업 (원본 dc.html의 renderVals() 목업 그대로 이식)
import type { Inquiry } from "./csTypes";

export const INITIAL_INQUIRIES: Inquiry[] = [
  {
    id: "q1",
    cat: "결제/포인트",
    title: "포인트가 적립되지 않았어요",
    date: "2026.07.15",
    answered: true,
    answer: "확인 결과 결제 승인 지연으로 적립이 늦어졌어요. 포인트는 정상 반영되었으니 확인 부탁드립니다 :)",
    body: "지난주 시공 결제 후 포인트가 안 들어왔는데 확인 부탁드려요.",
  },
  {
    id: "q2",
    cat: "예약/시공",
    title: "예약 일정을 변경하고 싶어요",
    date: "2026.07.19",
    answered: false,
    body: "이번 주 예약된 시공 일정을 다음 주로 변경하고 싶습니다.",
  },
];

export const FAQ_CATEGORY_META: { key: string; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "point", label: "포인트" },
  { key: "resv", label: "예약시공" },
  { key: "shop", label: "쇼핑몰" },
  { key: "account", label: "계정" },
];

export interface FaqItem {
  id: string;
  cat: string;
  q: string;
  a: string;
}

export const FAQ_DEFS: FaqItem[] = [
  { id: "f1", cat: "point", q: "포인트는 언제 적립되나요?", a: "결제 완료 시점에 자동으로 적립되며, 결제 금액의 일부가 포인트로 환급돼요." },
  { id: "f2", cat: "resv", q: "예약 후 취소하면 환불되나요?", a: "업체 착수 전 취소는 전액 환불되며, 착수 후 취소는 업체 사유에 한해 환불돼요." },
  { id: "f3", cat: "shop", q: "배송은 얼마나 걸리나요?", a: "평균 1~3영업일 내 배송되며, 마이페이지 쇼핑몰 주문내역에서 실시간 배송 조회가 가능해요." },
  { id: "f4", cat: "account", q: "비밀번호를 잊어버렸어요", a: "로그인 화면의 비밀번호 찾기에서 휴대폰 본인인증으로 재설정할 수 있어요." },
  { id: "f5", cat: "point", q: "포인트 유효기간이 있나요?", a: "적립일로부터 1년간 유효하며, 만료 30일 전 알림으로 안내드려요." },
  { id: "f6", cat: "resv", q: "전문가 추천과 일반 입찰의 차이는 무엇인가요?", a: "일반 입찰은 직접 항목·제품을 선택하고, 전문가 추천은 예산만 입력하면 전문가가 구성을 추천해드려요." },
];

export const INQUIRY_CATEGORIES = ["결제/포인트", "예약/시공", "쇼핑몰/주문", "계정/로그인", "기타"];
