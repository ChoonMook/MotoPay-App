// 휴대폰번호 AES-256-GCM 암호화/복호화 + 검색용 HMAC 해시 순수 함수 — NestJS DI 없이도(예: seed 스크립트) 그대로 사용 가능
// PhoneCryptoService는 이 함수들을 ConfigService의 키와 묶어주는 얇은 래퍼
import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  createHmac,
} from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM 권장 IV 길이

/** "010-1234-5678"과 "01012345678"이 같은 값으로 취급되도록 숫자만 남김 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/** 숫자만 있는 번호를 "000-0000-0000"(11자리, 010 등) 또는 "000-000-0000"(10자리, 구 011 등) 형식으로 통일 */
export function formatPhone(phone: string): string {
  const digits = normalizePhone(phone);
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return digits;
}

/** 검색/중복조회용 결정적 해시(HMAC-SHA256) — 암호화 키와 별도 키 사용(용도별 키 분리) */
export function hashPhone(normalizedPhone: string, hexKey: string): string {
  return createHmac('sha256', Buffer.from(hexKey, 'hex'))
    .update(normalizedPhone)
    .digest('hex');
}

export function encryptPhone(plain: string, hexKey: string): string {
  const key = Buffer.from(hexKey, 'hex');
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plain, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    ciphertext.toString('base64'),
  ].join(':');
}

export function decryptPhone(encrypted: string, hexKey: string): string {
  const key = Buffer.from(hexKey, 'hex');
  const [ivB64, authTagB64, ciphertextB64] = encrypted.split(':');
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivB64, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));
  const plain = Buffer.concat([
    decipher.update(Buffer.from(ciphertextB64, 'base64')),
    decipher.final(),
  ]);
  return plain.toString('utf8');
}
