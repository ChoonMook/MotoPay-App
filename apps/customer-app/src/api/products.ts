// apps/api의 상품 카탈로그 조회(GET /products), 패키지 상세 조회(GET /products/packages/:packageCode) 호출 — 로그인 불필요
import { apiRequest } from "./http";

export interface ProductApi {
  id: number;
  productCode: string;
  prodType: string;
  brand: string | null;
  prodCat: string | null;
  dealerCompanyId: number | null;
  name: string;
  price: number;
  originPrice: number | null;
  supplyPrice: number | null;
  description: string | null;
  imagePath: string | null;
  useYn: boolean;
}

export interface PackageBundleItemApi {
  packageCode: string;
  componentCode: string;
  itemType: "BASIC" | "OPTION" | "ADD";
  price: number | null;
  qty: number;
  sortOrder: number;
  product: ProductApi | null;
  /** 이 패키지에서 적용할 가격 — price가 지정돼 있으면 그 값, 없으면 product.price */
  effectivePrice: number | null;
}

export interface PackageDetailApi {
  package: ProductApi;
  basicItems: PackageBundleItemApi[];
  optionItems: PackageBundleItemApi[];
  addItems: PackageBundleItemApi[];
}

export function getPackageDetail(packageCode: string): Promise<PackageDetailApi> {
  return apiRequest<PackageDetailApi>(`/products/packages/${packageCode}`);
}

/** 예약시공(입찰) 요청 등록(CU-RSVC-04/05) 제품 선택·검색용 — bidApplicable=true인 상품만 조회 */
export function listBidProducts(prodCat: string): Promise<ProductApi[]> {
  return apiRequest<ProductApi[]>(`/products?prodCat=${prodCat}&bidApplicable=true`);
}
