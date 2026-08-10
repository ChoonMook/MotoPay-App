// apps/api의 상품 관리자 CRUD 엔드포인트(/admin/products/*) 호출 — AD-CTLG-05 상품 관리 화면 전용
import { authedRequest } from "./http";

export interface ProductImageApi {
  id: number;
  productCode: string;
  imagePath: string;
  sortOrder: number;
}

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
  supplyPrice: number | null | undefined; // 권한 없는 관리자에게는 서버가 필드 자체를 생략(undefined)
  description: string | null;
  imagePath: string | null; // 대표이미지 — images 갤러리의 첫 번째 이미지와 항상 동기화(서버가 관리)
  images: ProductImageApi[]; // 이미지 갤러리(최대 10장)
  useYn: boolean;
  ncpApplicable: boolean;
  bidApplicable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListProductsParams {
  prodType?: string;
  prodCat?: string;
  brand?: string;
  dealerCode?: string;
  useYn?: boolean;
  keyword?: string;
}

export function listProducts(params: ListProductsParams = {}): Promise<ProductApi[]> {
  const query = new URLSearchParams();
  if (params.prodType) query.set("prodType", params.prodType);
  if (params.prodCat) query.set("prodCat", params.prodCat);
  if (params.brand) query.set("brand", params.brand);
  if (params.dealerCode) query.set("dealerCode", params.dealerCode);
  if (params.useYn !== undefined) query.set("useYn", String(params.useYn));
  if (params.keyword) query.set("keyword", params.keyword);
  const qs = query.toString();
  return authedRequest<ProductApi[]>(`/admin/products${qs ? `?${qs}` : ""}`);
}

export interface CreateProductInput {
  prodType: string;
  brand?: string;
  prodCat?: string;
  dealerCode?: string;
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
