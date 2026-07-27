// apps/api의 패키지 상세 조회(GET /products/packages/:packageCode) 호출 — 로그인 불필요
import { apiRequest } from "./http";

export interface ProductApi {
  id: number;
  productCode: string;
  prodType: string;
  brand: string | null;
  prodCat: string | null;
  dealerCode: string | null;
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
