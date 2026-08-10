// 상품 이미지(Product.imagePath)의 물리 파일 저장 정책 — 로컬 디스크 <uploadsRoot>/product-photos/<uuid>.<ext>에 저장
import { deleteImage, saveImage } from './image-storage';

const PRODUCT_PHOTO_SUBDIR = 'product-photos';
const MAX_PRODUCT_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB

export function saveProductPhoto(dataUri: string): Promise<string> {
  return saveImage(dataUri, PRODUCT_PHOTO_SUBDIR, MAX_PRODUCT_PHOTO_BYTES);
}

/** 교체·삭제 시 이전 물리 파일 정리 — 이미 없어도(ENOENT) 무시 */
export function deleteProductPhoto(relativePath: string): Promise<void> {
  return deleteImage(relativePath);
}
