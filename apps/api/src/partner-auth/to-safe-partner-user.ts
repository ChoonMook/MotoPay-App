// PartnerUser(+Shop 조인)를 클라이언트에 내려도 안전한 SafePartnerUser로 변환
import type { PartnerUser } from '@prisma/client';
import type { PhoneCryptoService } from '../common/crypto/phone-crypto.service';
import type { SafePartnerUser } from './partner-auth.types';

type PartnerUserWithShop = PartnerUser & { shop: { name: string } };

export function toSafePartnerUser(
  partnerUser: PartnerUserWithShop,
  phoneCrypto: PhoneCryptoService,
): SafePartnerUser {
  return {
    id: partnerUser.id,
    username: partnerUser.username,
    name: partnerUser.name,
    email: partnerUser.email,
    phone: phoneCrypto.decrypt(partnerUser.phoneEncrypted),
    shopCode: partnerUser.shopCode,
    shopName: partnerUser.shop.name,
    mustChangePassword: partnerUser.mustChangePassword,
  };
}
