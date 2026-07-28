// 프로필 사진의 물리 파일 저장 정책 — 로컬 디스크 <uploadsRoot>/profile/<uuid>.<ext>에 저장, DB에는 상대경로만 기록
// 실제 저장/삭제 로직은 image-storage.ts(공용) 재사용
import { deleteImage, saveImage, UPLOADS_ROOT } from './image-storage';

export { UPLOADS_ROOT };

const PROFILE_SUBDIR = 'profile';
const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

export function saveProfileImage(dataUri: string): Promise<string> {
  return saveImage(dataUri, PROFILE_SUBDIR, MAX_PROFILE_IMAGE_BYTES);
}

/** 교체·삭제 시 이전 물리 파일 정리 — 이미 없어도(ENOENT) 무시 */
export function deleteProfileImage(relativePath: string): Promise<void> {
  return deleteImage(relativePath);
}
