// 시공업체 시드 — apps/customer-app의 PtnSelScreen/CoDtlProfScreen 목업(강남 오토바디 등)과 동일한 값으로 등록
import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import { parseDatabaseUrl } from '../src/common/db/mariadb-config';

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(parseDatabaseUrl(process.env.DATABASE_URL as string)),
});

interface ShopSeed {
  name: string;
  greeting: string;
  intro: string;
  zipCode: string;
  address: string;
  addressDetail: string;
  latitude: number;
  longitude: number;
  phone: string;
  businessHours: string;
  categories: string[]; // CommonCodeDetail(code='CAR_INST') 상세코드
}

// apps/customer-app/src/screens/ncp/PtnSelScreen.tsx의 SHOPS, common/CoDtlProfScreen.tsx의 기본값과 동일
const SHOPS: ShopSeed[] = [
  {
    name: '강남 오토바디',
    greeting: '안녕하세요, 강남 오토바디입니다. 정품 시공과 투명한 견적, 1년 A/S 보증으로 오너님의 차를 정성껏 시공해 드릴게요 :)',
    intro:
      '10년 경력의 전문 시공팀이 상주하며, 수입차·전기차 전용 시공 라인을 갖추고 있어요. 시공 전후 사진을 모두 기록해 드리고, 시공 이력은 앱에서 언제든 확인할 수 있습니다.',
    zipCode: '06015',
    address: '서울 강남구 논현로 123',
    addressDetail: '지하 1층 전용 작업장',
    latitude: 37.4979,
    longitude: 127.0276,
    phone: '02-511-1234',
    businessHours: '평일 09:00 ~ 19:00, 토요일 10:00 ~ 18:00, 일요일 휴무',
    categories: ['TINT', 'CCA', 'PPF', 'BBOX'],
  },
  {
    name: '역삼 카케어',
    greeting: '안녕하세요, 역삼 카케어입니다. 꼼꼼한 상담과 숙련된 기술로 만족스러운 시공을 약속드립니다.',
    intro: '역삼역 도보 5분 거리의 접근성 좋은 매장이에요. 블랙박스·썬팅 전문점으로 당일 시공이 가능합니다.',
    zipCode: '06234',
    address: '서울 강남구 테헤란로 456',
    addressDetail: '2층',
    latitude: 37.5006,
    longitude: 127.0364,
    phone: '02-522-5678',
    businessHours: '평일 10:00 ~ 20:00, 토요일 10:00 ~ 17:00, 일요일 휴무',
    categories: ['TINT', 'BBOX'],
  },
  {
    name: '서초 프리미엄 디테일',
    greeting: '안녕하세요, 서초 프리미엄 디테일입니다. 세라믹 코팅과 PPF 전문 시공점입니다.',
    intro: '유리막 코팅·PPF 전문 디테일링 샵이에요. 프리미엄 라인업으로 차량 외장을 오래 보호해 드립니다.',
    zipCode: '06611',
    address: '서울 서초구 서초대로 789',
    addressDetail: '1층',
    latitude: 37.4837,
    longitude: 127.0324,
    phone: '02-533-9012',
    businessHours: '평일 09:30 ~ 18:30, 토·일 휴무',
    categories: ['CCA', 'PPF'],
  },
];

async function seedShop(s: ShopSeed) {
  const existing = await prisma.shop.findFirst({ where: { name: s.name } });

  const data = {
    name: s.name,
    greeting: s.greeting,
    intro: s.intro,
    zipCode: s.zipCode,
    address: s.address,
    addressDetail: s.addressDetail,
    latitude: s.latitude,
    longitude: s.longitude,
    phone: s.phone,
    businessHours: s.businessHours,
  };

  // productCode와 동일한 2단계 채번 방식(생성 → id 기반 10자리 0-padding으로 즉시 업데이트)
  const shop = existing
    ? await prisma.shop.update({ where: { id: existing.id }, data })
    : await prisma.$transaction(async (tx) => {
        const created = await tx.shop.create({ data: { ...data, shopCode: '0'.repeat(10) } });
        return tx.shop.update({
          where: { id: created.id },
          data: { shopCode: String(created.id).padStart(10, '0') },
        });
      });

  const existingPhoto = await prisma.shopPhoto.findFirst({
    where: { shopCode: shop.shopCode, photoType: 'MAIN' },
  });
  if (!existingPhoto) {
    await prisma.shopPhoto.create({
      data: {
        shopCode: shop.shopCode,
        photoPath: `shops/${shop.shopCode}/main.png`,
        photoType: 'MAIN',
        sortOrder: 0,
      },
    });
  }

  for (const instCode of s.categories) {
    await prisma.shopInstCategory.upsert({
      where: { shopCode_instCode: { shopCode: shop.shopCode, instCode } },
      update: {},
      create: { shopCode: shop.shopCode, instCode },
    });
  }

  return shop;
}

async function main() {
  for (const s of SHOPS) {
    await seedShop(s);
  }
  console.log(`시공업체 ${SHOPS.length}건 완료`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
