// PT-STL-01~03 정산 목업 데이터·공용 포맷 헬퍼 (design/source .dc.html 원본 데이터 그대로 이식)
// 백엔드 정산 모델이 없어 화면 내 로컬 state로만 흐름을 시연 (후기는 /shops/me/reviews 실 API 연동, StlFlow.tsx 참고)
import type { Settlement, SettlementStatus } from "./stlTypes";

export const INITIAL_SETTLEMENTS: Settlement[] = [
  { id: "s1", date: "2026.08.01", customer: "정하늘", car: "현대 싼타페", amount: 480000, fee: 24000, status: "done", period: "this" },
  { id: "s2", date: "2026.07.29", customer: "한도윤", car: "제네시스 GV70", amount: 620000, fee: 31000, status: "done", period: "this" },
  { id: "s3", date: "2026.07.20", customer: "박지훈", car: "BMW 5시리즈", amount: 820000, fee: 41000, status: "wait", period: "this" },
  { id: "s4", date: "2026.06.28", customer: "최유나", car: "테슬라 모델Y", amount: 580000, fee: 29000, status: "done", period: "last" },
  { id: "s5", date: "2026.06.14", customer: "오세훈", car: "폭스바겐 티구안", amount: 350000, fee: 17500, status: "hold", period: "last" },
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
