// 1:1 문의 첨부 사진의 물리 파일 저장 정책 — 로컬 디스크 <uploadsRoot>/inquiry-photos/<uuid>.<ext>에 저장
import { saveImage } from './image-storage';

const INQUIRY_PHOTO_SUBDIR = 'inquiry-photos';
const MAX_INQUIRY_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB

export function saveInquiryPhoto(dataUri: string): Promise<string> {
  return saveImage(dataUri, INQUIRY_PHOTO_SUBDIR, MAX_INQUIRY_PHOTO_BYTES);
}
