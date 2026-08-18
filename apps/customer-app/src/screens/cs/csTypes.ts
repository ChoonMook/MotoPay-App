// 고객센터(CU-CS-01~05) 플로우에서 공유하는 상태 타입 정의
export type CsScreenId = "main" | "faq" | "inquiryreg" | "inquirystat" | "inquirydtl";

export interface Inquiry {
  id: string;
  cat: string; // 문의유형 코드 -> CommonCodeDetail(code='INQUIRY_CATEGORY'), 화면에는 categoryLabel()로 변환해 표시
  title: string;
  date: string;
  answered: boolean;
  body: string;
  answer?: string;
  photos: string[]; // uploads/ 기준 상대경로
}
