// 공통코드 상세(예: CAR_MODEL 차종)의 대표사진 물리 파일 저장 정책 — 로컬 디스크 <uploadsRoot>/common-code-photos/<uuid>.<ext>에 저장
import { deleteImage, saveImage } from './image-storage';

const COMMON_CODE_PHOTO_SUBDIR = 'common-code-photos';
const MAX_COMMON_CODE_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB

export function saveCommonCodePhoto(dataUri: string): Promise<string> {
  return saveImage(dataUri, COMMON_CODE_PHOTO_SUBDIR, MAX_COMMON_CODE_PHOTO_BYTES);
}

/** 교체·삭제 시 이전 물리 파일 정리 — 이미 없어도(ENOENT) 무시 */
export function deleteCommonCodePhoto(relativePath: string): Promise<void> {
  return deleteImage(relativePath);
}
