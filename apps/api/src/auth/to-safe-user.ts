// User(Prisma 모델)를 클라이언트에 내려도 안전한 SafeUser로 변환 — AuthService/UsersService 공통 사용
import type { User } from '@prisma/client';
import type { PhoneCryptoService } from '../common/crypto/phone-crypto.service';
import type { SafeUser } from './auth.types';

export function toSafeUser(
  user: User,
  phoneCrypto: PhoneCryptoService,
): SafeUser {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    phone: user.phoneEncrypted
      ? phoneCrypto.decrypt(user.phoneEncrypted)
      : null,
    profileImageUrl: user.profileImagePath
      ? `/uploads/${user.profileImagePath}`
      : null,
    role: user.role,
  };
}
