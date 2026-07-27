// 휴대폰번호를 AES-256-GCM으로 암호화/복호화하고, 검색용 HMAC 해시도 함께 생성 — 평문으로 DB에 저장하지 않기 위함
// 실제 암복호화·해시 로직은 phone-crypto.ts(순수 함수, seed 스크립트 등 Nest DI 밖에서도 재사용)에 있음
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  decryptPhone,
  encryptPhone,
  formatPhone,
  hashPhone,
  normalizePhone,
} from './phone-crypto';

function readKey(configService: ConfigService, name: string): string {
  const value = configService.get<string>(name);
  if (!value || value.length !== 64) {
    throw new Error(`${name}는 32바이트(64자 hex)여야 합니다.`);
  }
  return value;
}

@Injectable()
export class PhoneCryptoService {
  private readonly encryptionKey: string;
  private readonly hashKey: string;

  constructor(configService: ConfigService) {
    this.encryptionKey = readKey(configService, 'PHONE_ENCRYPTION_KEY');
    this.hashKey = readKey(configService, 'PHONE_HASH_KEY');
  }

  normalize(phone: string): string {
    return normalizePhone(phone);
  }

  /** "000-0000-0000" 형식으로 통일(저장·암호화 전 이 값을 사용) */
  format(phone: string): string {
    return formatPhone(phone);
  }

  encrypt(normalizedPhone: string): string {
    return encryptPhone(normalizedPhone, this.encryptionKey);
  }

  decrypt(encrypted: string): string {
    return decryptPhone(encrypted, this.encryptionKey);
  }

  hash(normalizedPhone: string): string {
    return hashPhone(normalizedPhone, this.hashKey);
  }
}
