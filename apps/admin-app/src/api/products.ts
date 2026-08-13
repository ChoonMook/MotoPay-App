// apps/api의 상품 관리자 CRUD 엔드포인트(/admin/products/*) 호출 — AD-CTLG-05 상품 관리 화면 전용
import { authedRequest } from "./http";

export interface ProductImageApi {
  id: number;
  productCode: string;
  imagePath: string;
  sortOrder: number;
}

export interface ProductPositionOptionApi {
  productCode: string;
  position: string;
  level: string;
}

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
  supplyPrice: number | null | undefined; // 권한 없는 관리자에게는 서버가 필드 자체를 생략(undefined)
  description: string | null;
  imagePath: string | null; // 대표이미지 — images 갤러리의 첫 번째 이미지와 항상 동기화(서버가 관리)
  images: ProductImageApi[]; // 이미지 갤러리(최대 10장)
  useYn: boolean;
  ncpApplicable: boolean;
  bidApplicable: boolean;
  positionOptionYn: boolean; // 부위옵션 사용여부(AD-CTLG-07)
  positionOptions: ProductPositionOptionApi[]; // 부위별 선택 가능 농도(AD-CTLG-07)
  createdAt: string;
  updatedAt: string;
}

export interface ListProductsParams {
  prodType?: string;
  prodCat?: string;
  brand?: string;
  dealerCompanyId?: number;
  mappedDealerCompanyId?: number; // AD-CTLG-10 딜러사 필터용 — ProductDealerMapping 다대다 기준(단일필드 dealerCompanyId와 다름)
  useYn?: boolean;
  keyword?: string;
}

export function listProducts(params: ListProductsParams = {}): Promise<ProductApi[]> {
  const query = new URLSearchParams();
  if (params.prodType) query.set("prodType", params.prodType);
  if (params.prodCat) query.set("prodCat", params.prodCat);
  if (params.brand) query.set("brand", params.brand);
  if (params.dealerCompanyId !== undefined) query.set("dealerCompanyId", String(params.dealerCompanyId));
  if (params.mappedDealerCompanyId !== undefined) query.set("mappedDealerCompanyId", String(params.mappedDealerCompanyId));
  if (params.useYn !== undefined) query.set("useYn", String(params.useYn));
  if (params.keyword) query.set("keyword", params.keyword);
  const qs = query.toString();
  return authedRequest<ProductApi[]>(`/admin/products${qs ? `?${qs}` : ""}`);
}

export interface CreateProductInput {
  prodType: string;
  brand?: string;
  prodCat?: string;
  dealerCompanyId?: number;
  name: string;
  price: number;
  originPrice?: number;
  supplyPrice?: number;
  description?: string;
  useYn?: boolean;
  ncpApplicable?: boolean;
  bidApplicable?: boolean;
}

export function createProduct(input: CreateProductInput): Promise<ProductApi> {
  return authedRequest<ProductApi>("/admin/products", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type UpdateProductInput = Partial<CreateProductInput>;

export function updateProduct(id: number, input: UpdateProductInput): Promise<ProductApi> {
  return authedRequest<ProductApi>(`/admin/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteProduct(id: number): Promise<void> {
  return authedRequest<void>(`/admin/products/${id}`, { method: "DELETE" });
}

export function uploadProductImage(id: number, imageBase64: string): Promise<ProductApi> {
  return authedRequest<ProductApi>(`/admin/products/${id}/images`, {
    method: "POST",
    body: JSON.stringify({ imageBase64 }),
  });
}

export function deleteProductImage(id: number, imageId: number): Promise<ProductApi> {
  return authedRequest<ProductApi>(`/admin/products/${id}/images/${imageId}`, { method: "DELETE" });
}

export interface SetProductPositionOptionsInput {
  positionOptionYn: boolean;
  options: { position: string; levels: string[] }[];
}

export function setProductPositionOptions(id: number, input: SetProductPositionOptionsInput): Promise<ProductApi> {
  return authedRequest<ProductApi>(`/admin/products/${id}/position-options`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export interface ProductDealerMappingApi {
  productCode: string;
  dealerCompanyId: number;
  price: number;
}

export function getProductDealerMappings(id: number): Promise<ProductDealerMappingApi[]> {
  return authedRequest<ProductDealerMappingApi[]>(`/admin/products/${id}/dealer-mappings`);
}

export function setProductDealerMappings(id: number, dealerCompanyIds: number[]): Promise<ProductDealerMappingApi[]> {
  return authedRequest<ProductDealerMappingApi[]>(`/admin/products/${id}/dealer-mappings`, {
    method: "PUT",
    body: JSON.stringify({ dealerCompanyIds }),
  });
}

export function getProductCarModelMappings(id: number): Promise<string[]> {
  return authedRequest<string[]>(`/admin/products/${id}/car-model-mappings`);
}

export function setProductCarModelMappings(id: number, carModelCodes: string[]): Promise<string[]> {
  return authedRequest<string[]>(`/admin/products/${id}/car-model-mappings`, {
    method: "PUT",
    body: JSON.stringify({ carModelCodes }),
  });
}

export interface BundleComponentSnapshot {
  productCode: string;
  name: string;
  price: number;
  prodCat: string | null;
  brand: string | null;
}

export interface ProductBundleItemApi {
  packageCode: string;
  componentCode: string;
  itemType: string; // BASIC/OPTION/ADD
  price: number | null; // 이 패키지 안에서의 가격 override — null이면 구성상품 자체 판매가 사용
  qty: number;
  sortOrder: number;
  product: BundleComponentSnapshot | null; // 구성상품 스냅샷(이름·자체 판매가 표시용)
  effectivePrice: number | null;
}

export function getProductBundleItems(id: number): Promise<ProductBundleItemApi[]> {
  return authedRequest<ProductBundleItemApi[]>(`/admin/products/${id}/bundle-items`);
}

export interface BundleItemInput {
  componentCode: string;
  itemType: string;
  price?: number;
  qty: number;
  sortOrder: number;
}

export function setProductBundleItems(id: number, items: BundleItemInput[]): Promise<ProductBundleItemApi[]> {
  return authedRequest<ProductBundleItemApi[]>(`/admin/products/${id}/bundle-items`, {
    method: "PUT",
    body: JSON.stringify({ items }),
  });
}
