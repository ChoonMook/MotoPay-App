// 마이페이지(CU-MYPG-01~16) 플로우에서 공유하는 상태 타입 정의
export type MypScreenId =
  | "main"
  | "cars"
  | "carreg"
  | "caredit"
  | "cst"
  | "notisettings"
  | "infoedit"
  | "pwedit"
  | "shophist"
  | "cancelhist"
  | "notis"
  | "withdraw"
  | "sns"
  | "couponbox";

export type MypSheetId = null | "defaultcar" | "logout" | "withdrawconfirm";

export interface Car {
  id: string;
  maker: string;
  model: string;
  year: string;
  plate: string;
  isDefault: boolean;
  fromDealer: boolean;
  dealerName?: string;
  vin?: string;
}
