// 개발/테스트용 파트너(시공업체) 계정 시드 — apps/partner-app 로그인 검증용, 강남 오토바디(shopCode 0000000001)에 소속
import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import { encryptPhone, formatPhone, hashPhone, normalizePhone } from '../src/common/crypto/phone-crypto';
import { parseDatabaseUrl } from '../src/common/db/mariadb-config';

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(parseDatabaseUrl(process.env.DATABASE_URL as string)),
});

async function main() {
  const passwordHash = await bcrypt.hash('Initial1234!', 10);
  const normalizedPhone = normalizePhone('010-9000-1234');
  const phoneEncrypted = encryptPhone(formatPhone(normalizedPhone), process.env.PHONE_ENCRYPTION_KEY as string);
  const phoneHash = hashPhone(normalizedPhone, process.env.PHONE_HASH_KEY as string);

  const partnerUser = await prisma.partnerUser.upsert({
    where: { username: 'shopowner01' },
    update: { name: '김철수', email: 'shopowner01@motopay.example.com', phoneEncrypted, phoneHash, shopCode: '0000000001' },
    create: {
      username: 'shopowner01',
      passwordHash,
      name: '김철수',
      email: 'shopowner01@motopay.example.com',
      phoneEncrypted,
      phoneHash,
      shopCode: '0000000001',
      mustChangePassword: true,
    },
  });

  console.log('시드 완료:', {
    id: partnerUser.id,
    username: partnerUser.username,
    name: partnerUser.name,
    shopCode: partnerUser.shopCode,
    mustChangePassword: partnerUser.mustChangePassword,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
