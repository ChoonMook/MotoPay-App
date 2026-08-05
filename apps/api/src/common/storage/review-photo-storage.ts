// 후기 첨부 사진의 물리 파일 저장 정책 — 로컬 디스크 <uploadsRoot>/review-photos/<uuid>.<ext>에 저장
import { saveImage } from './image-storage';

const REVIEW_PHOTO_SUBDIR = 'review-photos';
const MAX_REVIEW_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB

export function saveReviewPhoto(dataUri: string): Promise<string> {
  return saveImage(dataUri, REVIEW_PHOTO_SUBDIR, MAX_REVIEW_PHOTO_BYTES);
}
