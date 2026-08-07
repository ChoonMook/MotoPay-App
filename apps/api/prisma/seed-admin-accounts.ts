// 관리자웹(admin-app) 최초 플랫폼관리자 계정 시드 — AD-SYS-04(사용자 계정 관리)/admin-auth 로그인 검증용
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
  const passwordHash = await bcrypt.hash('4ms1001*', 10);
  const normalizedPhone = normalizePhone('010-4182-9325');
  const phoneEncrypted = encryptPhone(formatPhone(normalizedPhone), process.env.PHONE_ENCRYPTION_KEY as string);
  const phoneHash = hashPhone(normalizedPhone, process.env.PHONE_HASH_KEY as string);

  const admin = await prisma.adminAccount.upsert({
    where: { username: 'admin' },
    update: {
      name: '관리자',
      email: 'cmkil5150@gmail.com',
      phoneEncrypted,
      phoneHash,
      accountType: 'ADMIN',
      permGroup: '슈퍼관리자',
    },
    create: {
      username: 'admin',
      passwordHash,
      name: '관리자',
      email: 'cmkil5150@gmail.com',
      phoneEncrypted,
      phoneHash,
      accountType: 'ADMIN',
      permGroup: '슈퍼관리자',
    },
  });

  console.log('시드 완료:', {
    id: admin.id,
    username: admin.username,
    name: admin.name,
    accountType: admin.accountType,
    permGroup: admin.permGroup,
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
