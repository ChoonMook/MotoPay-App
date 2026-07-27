// 쇼핑몰(CU-SHOP-01~12) 플로우에서 공유하는 상태 타입 정의
export type ShopScreenId =
  | "main"
  | "list"
  | "detail"
  | "cart"
  | "checkout"
  | "newaddr"
  | "paydone"
  | "orders"
  | "orderdtl"
  | "dlvdonecfm"
  | "wish";

export type ShopSheetId = null | "option" | "addrchg" | "coupon" | "review" | "cancelreturn";

export type PayMethodKey = "bank" | "card";
export type OrderStatus = "prep" | "ship" | "done";

export interface Product {
  id: string;
  brand: string;
  name: string;
  cat: string;
  price: number;
  orig: number | null;
  rating: string;
  reviews: number;
  img: string;
  opts: string[];
  desc: string;
  specs: [string, string][];
}

export interface CartLine {
  pid: string;
  opt: number;
  qty: number;
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  addr: string;
  isDefault: boolean;
}

export interface OrderDef {
  pid: string;
  qty: number;
  date: string;
  no: string;
  status: OrderStatus;
}
