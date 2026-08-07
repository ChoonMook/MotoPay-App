// AdminAccount를 클라이언트에 내려도 안전한 SafeAdminAccount로 변환(passwordHash 등 제거, 휴대폰번호 복호화)
import type { AdminAccount } from '@prisma/client';
import type { PhoneCryptoService } from '../common/crypto/phone-crypto.service';
import type { SafeAdminAccount } from './admin-auth.types';

export function toSafeAdminAccount(
  adminAccount: AdminAccount,
  phoneCrypto: PhoneCryptoService,
): SafeAdminAccount {
  return {
    id: adminAccount.id,
    username: adminAccount.username,
    name: adminAccount.name,
    email: adminAccount.email,
    phone: adminAccount.phoneEncrypted
      ? phoneCrypto.decrypt(adminAccount.phoneEncrypted)
      : null,
    accountType: adminAccount.accountType,
    permGroup: adminAccount.permGroup,
    lastLoginAt: adminAccount.lastLoginAt,
  };
}
