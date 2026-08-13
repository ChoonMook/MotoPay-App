// 시공 완료 등록 사진의 물리 파일 저장 정책 — 로컬 디스크 <uploadsRoot>/reservation-photos/<uuid>.<ext>에 저장
import { saveImage } from './image-storage';

const RESERVATION_PHOTO_SUBDIR = 'reservation-photos';
const MAX_RESERVATION_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB

export function saveReservationPhoto(dataUri: string): Promise<string> {
  return saveImage(
    dataUri,
    RESERVATION_PHOTO_SUBDIR,
    MAX_RESERVATION_PHOTO_BYTES,
  );
}
