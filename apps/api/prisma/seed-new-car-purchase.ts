// 신차 구매 고객 정보 시드 — 딜러사 웹에서 등록한 예시 1건(휴대폰번호는 User와 동일 정책으로 암호화)
import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import { encryptPhone, formatPhone, hashPhone, normalizePhone } from '../src/common/crypto/phone-crypto';
import { parseDatabaseUrl } from '../src/common/db/mariadb-config';

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(parseDatabaseUrl(process.env.DATABASE_URL as string)),
});

interface PurchaseSeed {
  vin: string;
  dealerCompanyId: number;
  customerName: string;
  phone: string;
  carBrandCode: string;
  carModelCode: string;
  trimName: string;
  packageCode?: string;
}

const PURCHASES: PurchaseSeed[] = [
  {
    vin: 'W1KLF5AB4TA288926',
    dealerCompanyId: 17, // KCC 오토
    customerName: '길춘묵',
    phone: '010-4182-9325',
    carBrandCode: 'BENZ',
    carModelCode: 'B-E',
    trimName: 'E 200',
    packageCode: '0000000018',
  },
];

async function main() {
  for (const p of PURCHASES) {
    const normalizedPhone = normalizePhone(p.phone);
    const phoneEncrypted = encryptPhone(formatPhone(normalizedPhone), process.env.PHONE_ENCRYPTION_KEY as string);
    const phoneHash = hashPhone(normalizedPhone, process.env.PHONE_HASH_KEY as string);

    await prisma.newCarPurchaseCustomer.upsert({
      where: { vin: p.vin },
      update: {
        dealerCompanyId: p.dealerCompanyId,
        customerName: p.customerName,
        phoneEncrypted,
        phoneHash,
        carBrandCode: p.carBrandCode,
        carModelCode: p.carModelCode,
        trimName: p.trimName,
        packageCode: p.packageCode,
      },
      create: {
        vin: p.vin,
        dealerCompanyId: p.dealerCompanyId,
        customerName: p.customerName,
        phoneEncrypted,
        phoneHash,
        carBrandCode: p.carBrandCode,
        carModelCode: p.carModelCode,
        trimName: p.trimName,
        packageCode: p.packageCode,
      },
    });
  }

  console.log(`신차 구매 고객 정보 ${PURCHASES.length}건 완료`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
