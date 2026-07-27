// 신차패키지(CU-NCPK-01~10, CU-RSVC-20/21/22 공용) 플로우에서 공유하는 상태 타입 정의
export type NcpScreen = "main" | "pkg" | "shops" | "sched" | "pay" | "confirm" | "handover" | "copro" | "bookingdtl" | "resched" | "cancel";
export type NcpSheet = null | "tint" | "addopt" | "coupon" | "review";

export type PayMethodKey = "bank" | "card";
