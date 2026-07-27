// 개발용 테스트 계정 시드 — apps/customer-app의 기존 목업 로그인(id: user / pw: 1234)과 동일하게 맞춤
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
  const passwordHash = await bcrypt.hash('1234', 10);
  const normalizedPhone = normalizePhone('010-1234-5678');
  const phoneEncrypted = encryptPhone(formatPhone(normalizedPhone), process.env.PHONE_ENCRYPTION_KEY as string);
  const phoneHash = hashPhone(normalizedPhone, process.env.PHONE_HASH_KEY as string);

  const user = await prisma.user.upsert({
    where: { username: 'user' },
    update: { email: 'user@motopay.example.com', phoneEncrypted, phoneHash },
    create: {
      username: 'user',
      passwordHash,
      name: '홍길동',
      email: 'user@motopay.example.com',
      phoneEncrypted,
      phoneHash,
      role: 'CUSTOMER',
      agreedTerms: true,
      agreedPrivacy: true,
      agreedMarketingSms: true,
      agreedMarketingEmail: false,
      agreedMarketingPush: true,
    },
  });

  console.log('시드 완료:', { id: user.id, username: user.username, role: user.role });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
