// 고객센터(CU-CS-01~05) 플로우에서 공유하는 상태 타입 정의
export type CsScreenId = "main" | "faq" | "inquiryreg" | "inquirystat" | "inquirydtl";

export interface Inquiry {
  id: string;
  cat: string;
  title: string;
  date: string;
  answered: boolean;
  body: string;
  answer?: string;
}
