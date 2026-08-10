// 리치텍스트 에디터(RichTextEditor) 본문에 삽입되는 이미지의 물리 파일 저장 정책 — 로컬 디스크
// <uploadsRoot>/content-images/<uuid>.<ext>에 저장. 상품설명 등 @db.Text 컬럼에 base64를 직접 담지
// 않고 파일로 저장 후 경로만 HTML에 남기기 위한 용도(엔티티가 아직 저장되지 않은 등록 화면에서도 바로 업로드 가능)
import { deleteImage, saveImage } from './image-storage';

const CONTENT_IMAGE_SUBDIR = 'content-images';
const MAX_CONTENT_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

export function saveContentImage(dataUri: string): Promise<string> {
  return saveImage(dataUri, CONTENT_IMAGE_SUBDIR, MAX_CONTENT_IMAGE_BYTES);
}

export function deleteContentImage(relativePath: string): Promise<void> {
  return deleteImage(relativePath);
}
