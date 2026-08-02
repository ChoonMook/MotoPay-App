// PT-RSVC-01~13 예약시공관리(입찰) 목업 데이터·카탈로그·공용 포맷 헬퍼
// 백엔드 입찰/추천안 모델이 없어 화면 내 로컬 state로만 흐름을 시연 (design/source .dc.html 원본 데이터 그대로 이식)
import type { BidReq, PlanLine, ReqType, RsvcJob, RsvcProduct } from "./rsvcTypes";

export const INITIAL_REQS: BidReq[] = [
  {
    id: "q1",
    type: "general",
    customer: "김민준",
    car: "현대 아이오닉 6 (2026)",
    distance: "2.1km",
    items: [
      { name: "유리막코팅", spec: "풀보디 패키지" },
      { name: "PPF", spec: "전면부" },
    ],
    budgetLabel: "예산 1,200,000원 내외",
    deadlineLabel: "D-2 · 08.03 18:00",
    status: "open",
  },
  {
    id: "q2",
    type: "general",
    customer: "이서연",
    car: "기아 EV6 (2025)",
    distance: "3.4km",
    items: [
      { name: "틴팅", spec: "전체 30%" },
      { name: "블랙박스", spec: "2채널" },
    ],
    budgetLabel: "예산 800,000원 내외",
    deadlineLabel: "D-1 · 08.01 20:00",
    status: "active",
    myBid: 720000,
  },
  {
    id: "q3",
    type: "expert",
    customer: "박지훈",
    car: "BMW 5시리즈 (2024)",
    distance: "1.6km",
    category: "외장 디테일링",
    items: [
      { name: "외장 디테일링", spec: "생활 스크래치 제거 희망" },
      { name: "유리막코팅", spec: "광택 유지가 중요해요" },
    ],
    budgetLabel: "예산 900,000원 이하",
    deadlineLabel: "마감 · 07.30 18:00",
    status: "closed",
    myPlan: { price: 820000 },
    picked: true,
  },
  {
    id: "q4",
    type: "expert",
    customer: "최유나",
    car: "테슬라 모델Y (2026)",
    distance: "4.0km",
    category: "선루프 스티치",
    items: [
      { name: "선루프 스티치", spec: "파노라마 선루프" },
      { name: "실내크리닝", spec: "천장 오염 제거" },
    ],
    budgetLabel: "예산 600,000원 이하",
    deadlineLabel: "마감 · 07.29 18:00",
    status: "closed",
    myPlan: { price: 580000 },
    picked: false,
  },
  {
    id: "q5",
    type: "expert",
    customer: "오세훈",
    car: "폭스바겐 티구안 (2025)",
    distance: "2.8km",
    category: "차량 랩핑",
    items: [
      { name: "차량 랩핑", spec: "무광 그레이 희망" },
      { name: "틴팅", spec: "전면 30% 이상" },
    ],
    budgetLabel: "예산 1,500,000원 이하",
    deadlineLabel: "D-3 · 08.04 18:00",
    status: "open",
  },
];

export const INITIAL_JOBS: RsvcJob[] = [
  {
    id: "j1",
    customer: "정하늘",
    car: "현대 싼타페 (2025)",
    vin: "KMHXX00XXPU123456",
    status: "착수전",
    schedule: "2026.08.02 10:00",
    items: [
      { name: "언더코팅", spec: "전체" },
      { name: "실내크리닝", spec: "풀케어" },
    ],
    doneCheck: {},
    photos: [],
    memo: "",
    reschedStatus: "none",
    reschedReason: "",
    reschedDt: "",
  },
  {
    id: "j2",
    customer: "한도윤",
    car: "제네시스 GV70 (2024)",
    vin: "KMTXX00XXPU998877",
    status: "시공중",
    schedule: "2026.07.31 14:00",
    items: [
      { name: "PPF", spec: "후면부" },
      { name: "유리막코팅", spec: "휠 전용" },
    ],
    doneCheck: { 0: true, 1: false },
    photos: [],
    memo: "",
    reschedStatus: "none",
    reschedReason: "",
    reschedDt: "",
  },
];

const CATALOG: Record<string, RsvcProduct[]> = {
  "외장 디테일링": [
    { id: "d1", name: "프리미엄 폴리싱 3단계", brand: "루페스", price: 280000 },
    { id: "d2", name: "스탠다드 폴리싱", brand: "루페스", price: 180000 },
  ],
  유리막코팅: [
    { id: "c1", name: "세라믹프로 9H", brand: "CeramicPro", price: 850000 },
    { id: "c2", name: "글라스코트 프로", brand: "카닥", price: 520000 },
    { id: "c3", name: "베이직 코팅", brand: "카닥", price: 320000 },
  ],
  "선루프 스티치": [
    { id: "s1", name: "파노라마 풀 스티치", brand: "스티치랩", price: 480000 },
    { id: "s2", name: "부분 스티치", brand: "스티치랩", price: 260000 },
  ],
  실내크리닝: [
    { id: "i1", name: "풀케어 스팀 크리닝", brand: "카닥케어", price: 240000 },
    { id: "i2", name: "베이직 케어", brand: "카닥케어", price: 140000 },
  ],
  "차량 랩핑": [
    { id: "w1", name: "2080 무광 풀랩핑", brand: "3M", price: 1800000 },
    { id: "w2", name: "부분 랩핑(보닛·루프)", brand: "3M", price: 900000 },
  ],
  틴팅: [
    { id: "t1", name: "버텍스 300", brand: "루마", bkey: "luma", price: 600000 },
    { id: "t2", name: "버텍스 TT", brand: "루마", bkey: "luma", price: 720000 },
    { id: "t3", name: "브이쿨 K", brand: "V-Kool", bkey: "vcool", price: 850000 },
    { id: "t4", name: "피니티", brand: "레이노", bkey: "rayno", price: 520000 },
    { id: "t5", name: "크리스탈리", brand: "3M", bkey: "3m", price: 450000 },
    { id: "t6", name: "스탠다드 펜더", brand: "글라스틴트", bkey: "glass", price: 300000 },
  ],
};

export const POS_NAMES = ["전면유리", "측면 1열", "측면 2열", "후면유리", "선루프"];

export function products(name: string): RsvcProduct[] {
  return CATALOG[name] ?? [{ id: "g1", name: "기본 시공", brand: "자체", price: 200000 }];
}

export function searchable(name: string): boolean {
  return products(name).length > 3;
}

export function hasPos(name: string): boolean {
  return name === "틴팅";
}

export function won(n: number | string | undefined): string {
  return `${Number(n || 0).toLocaleString("ko-KR")}원`;
}

export function buildPlanDraft(req: BidReq): PlanLine[] {
  return req.items.map((it) => {
    const p = products(it.name)[0];
    const posLevels: Record<string, string> = {};
    if (hasPos(it.name)) POS_NAMES.forEach((n) => (posLevels[n] = "15"));
    return {
      name: it.name,
      spec: it.spec,
      productId: p.id,
      offer: String(Math.round((p.price * 0.9) / 10000) * 10000),
      posOff: {},
      posLevels,
      posBulk: false,
    };
  });
}

export function reqTypeLabel(type: ReqType): string {
  return type === "general" ? "일반입찰" : "전문가추천";
}

export function reqTypeChipClass(type: ReqType): string {
  return type === "general" ? "text-brand bg-brand-subtle" : "text-[#0E9A96] bg-[#0E9A9614]";
}

export function jobStatusChipClass(status: RsvcJob["status"]): string {
  if (status === "착수전") return "text-gray-600 bg-gray-100";
  if (status === "시공중") return "text-brand bg-brand-subtle";
  return "text-[#0E9A96] bg-[#0E9A9614]";
}

export function reqUrgent(deadlineLabel: string): boolean {
  return deadlineLabel.startsWith("D-1") || deadlineLabel.startsWith("D-2");
}

export function reqInfoRows(req: BidReq): { k: string; v: string }[] {
  return req.type === "general"
    ? [
        { k: "요청 유형", v: "일반입찰" },
        { k: "예산", v: req.budgetLabel.replace("예산 ", "") },
        { k: "마감", v: req.deadlineLabel },
      ]
    : [
        { k: "요청 유형", v: "전문가추천" },
        { k: "카테고리", v: req.category ?? "-" },
        { k: "예산", v: req.budgetLabel.replace("예산 ", "") },
        { k: "마감", v: req.deadlineLabel },
      ];
}

export function itemSummary(items: { name: string }[]): string {
  return items.map((it) => it.name).join(" · ");
}
