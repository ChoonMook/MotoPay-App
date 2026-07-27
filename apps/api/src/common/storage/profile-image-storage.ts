// 프로필 사진의 물리 파일 저장 정책 — 로컬 디스크 <uploadsRoot>/profile/<uuid>.<ext>에 저장, DB에는 상대경로만 기록
// 순수 함수로 분리해 UsersService 등에서 재사용
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { BadRequestException } from '@nestjs/common';

export const UPLOADS_ROOT = join(process.cwd(), 'uploads');
const PROFILE_SUBDIR = 'profile';
const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function parseDataUri(dataUri: string): { mimeType: string; buffer: Buffer } {
  const match = /^data:([\w/+.-]+);base64,(.+)$/.exec(dataUri);
  if (!match) {
    throw new BadRequestException('올바른 이미지 데이터가 아닙니다.');
  }
  const [, mimeType, base64] = match;
  if (!ALLOWED_MIME_TO_EXT[mimeType]) {
    throw new BadRequestException(
      'JPEG·PNG·WEBP 형식의 이미지만 업로드할 수 있습니다.',
    );
  }
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length > MAX_PROFILE_IMAGE_BYTES) {
    throw new BadRequestException('이미지 용량은 5MB를 초과할 수 없습니다.');
  }
  return { mimeType, buffer };
}

/** data URI(base64) 프로필 이미지를 디스크에 저장하고 uploadsRoot 기준 상대경로("profile/<uuid>.<ext>")를 반환 */
export async function saveProfileImage(dataUri: string): Promise<string> {
  const { mimeType, buffer } = parseDataUri(dataUri);
  const ext = ALLOWED_MIME_TO_EXT[mimeType];
  const relativePath = `${PROFILE_SUBDIR}/${randomUUID()}.${ext}`;
  const absolutePath = join(UPLOADS_ROOT, relativePath);
  await mkdir(join(UPLOADS_ROOT, PROFILE_SUBDIR), { recursive: true });
  await writeFile(absolutePath, buffer);
  return relativePath;
}

/** 교체·삭제 시 이전 물리 파일 정리 — 이미 없어도(ENOENT) 무시 */
export async function deleteProfileImage(relativePath: string): Promise<void> {
  try {
    await unlink(join(UPLOADS_ROOT, relativePath));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err;
    }
  }
}
