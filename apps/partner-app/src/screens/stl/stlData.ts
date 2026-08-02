// PT-STL-01~03 정산·후기 목업 데이터·공용 포맷 헬퍼 (design/source .dc.html 원본 데이터 그대로 이식)
// 백엔드 정산/후기 모델이 없어 화면 내 로컬 state로만 흐름을 시연
import type { Review, Settlement, SettlementStatus } from "./stlTypes";

export const INITIAL_SETTLEMENTS: Settlement[] = [
  { id: "s1", date: "2026.08.01", customer: "정하늘", car: "현대 싼타페", amount: 480000, fee: 24000, status: "done", period: "this" },
  { id: "s2", date: "2026.07.29", customer: "한도윤", car: "제네시스 GV70", amount: 620000, fee: 31000, status: "done", period: "this" },
  { id: "s3", date: "2026.07.20", customer: "박지훈", car: "BMW 5시리즈", amount: 820000, fee: 41000, status: "wait", period: "this" },
  { id: "s4", date: "2026.06.28", customer: "최유나", car: "테슬라 모델Y", amount: 580000, fee: 29000, status: "done", period: "last" },
  { id: "s5", date: "2026.06.14", customer: "오세훈", car: "폭스바겐 티구안", amount: 350000, fee: 17500, status: "hold", period: "last" },
];

export const INITIAL_REVIEWS: Review[] = [
  { id: "r1", rating: 5, content: "작업이 꼼꼼하고 상담도 친절하게 해주셔서 만족스러웠어요.", customer: "김*준", car: "아이오닉 6", date: "2026.07.30" },
  { id: "r2", rating: 4, content: "시공 결과는 좋았는데 예정 시간보다 조금 늦게 시작됐어요.", customer: "이*연", car: "EV6", date: "2026.07.22" },
  { id: "r3", rating: 5, content: "가격 대비 만족도가 높아요. 다음에도 이용할게요.", customer: "박*훈", car: "5시리즈", date: "2026.07.15" },
  { id: "r4", rating: 5, content: "설명을 자세히 해주셔서 믿고 맡길 수 있었습니다.", customer: "최*나", car: "모델Y", date: "2026.06.30" },
  { id: "r5", rating: 3, content: "결과물은 무난했지만 안내 문자가 조금 늦었어요.", customer: "오*훈", car: "티구안", date: "2026.06.18" },
];

export function won(n: number): string {
  return `${Number(n || 0).toLocaleString("ko-KR")}원`;
}

export function stars(n: number): string {
  return "★★★★★☆☆☆☆☆".slice(5 - n, 10 - n);
}

export const STATUS_LABEL: Record<SettlementStatus, string> = { wait: "대기", done: "완료", hold: "보류" };

export function statusChipClass(status: SettlementStatus): string {
  if (status === "wait") return "bg-brand";
  if (status === "done") return "bg-[#0E9A96]";
  return "bg-gray-500";
}
