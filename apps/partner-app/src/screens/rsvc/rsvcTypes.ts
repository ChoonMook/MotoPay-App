// PT-RSVC-01~13 예약시공관리(입찰) 도메인 타입 - 일반입찰(GENERAL)·전문가추천(EXPERT) 모두 실API 연동 완료
export type ReqType = "general" | "expert";
export type ReqStatus = "open" | "active" | "closed";

export interface RsvcItem {
  name: string;
  spec: string;
  instCode?: string; // -> CommonCodeDetail(code='CAR_INST') — 실 요청(BidReq.items)만 채워짐, RsvcJob.items(목업)는 없음
}

export interface BidReq {
  id: string;
  type: ReqType;
  customer: string;
  car: string;
  distance: string;
  category?: string;
  items: RsvcItem[];
  budgetLabel: string;
  deadlineLabel: string;
  desiredDate: string; // "YYYY-MM-DD" — 고객 희망 시공일(입찰 참여 시 이 날짜의 업체 실제 예약 가능 시간을 조회하는 기준)
  status: ReqStatus;
  // 내가 이미 제출한 입찰(일반입찰만) — 있으면 요청이 OPEN인 동안 재제출로 수정 가능, prices는 key=instCode
  myOffer?: { prices: Record<string, string>; time: string; memo: string };
  // 내가 이미 제출한 추천안(전문가추천만) — 있으면 요청이 OPEN인 동안 재제출로 수정 가능
  myPlan?: { planNo: string; items: RsvcItem[]; totalOffer: number; scheduledTime: string; reason: string };
  picked?: boolean;
}

export type JobStatus = "착수전" | "시공중" | "완료";
export type ReschedStatus = "none" | "sent";

export interface RsvcJob {
  id: string;
  requestNo: string; // -> BidRequest.requestNo — 낙찰결과 화면("시공 착수 등록하기")에서 방금 생성된 job을 찾기 위한 연결 키
  customer: string;
  phone: string | null; // 해피콜 발신용 실번호("010-1234-5678") — tel: 링크로 전화 앱 연동에 사용
  car: string;
  vin: string;
  status: JobStatus;
  schedule: string;
  items: RsvcItem[];
  doneCheck: Record<number, boolean>;
  photos: string[];
  memo: string;
  reschedStatus: ReschedStatus;
  reschedReason: string;
  reschedDt: string;
}

// -> Product(prodCat=CAR_INST_TO_PROD_CAT[instCode]) — GET /products 실API 응답
export interface RsvcProduct {
  productCode: string;
  name: string;
  brand: string | null;
  price: number;
}

export interface PlanLine {
  name: string; // 시공 항목(관심 카테고리) 한글 라벨 — 표시용
  instCode: string; // -> CommonCodeDetail(code='CAR_INST') — 카탈로그 조회·제출용
  spec: string;
  productCode: string; // 선택한 상품 -> Product.productCode
  productName: string; // 선택한 상품명(스냅샷)
  retailPrice: number; // 선택한 상품 소비자가(스냅샷)
  offer: string;
  posOff: Record<string, boolean>;
  posLevels: Record<string, string>;
  posBulk: boolean;
}
