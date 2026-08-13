// 상품정보 시드 — 여러 출처의 상품 데이터를 productCode 자동채번(10자리 0-padding)과 함께 등록
import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import { parseDatabaseUrl } from '../src/common/db/mariadb-config';

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(parseDatabaseUrl(process.env.DATABASE_URL as string)),
});

interface ProductSeed {
  prodType: string;
  brand?: string; // 패키지(PKG)는 구성상품마다 브랜드가 달라질 수 있어 생략 가능
  name: string;
  prodCat?: string; // 패키지(PKG)는 구성상품마다 분류가 달라질 수 있어 생략 가능
  dealerCompanyId?: number; // 딜러사 -> Company.id(coType='DEALER') — 패키지(PKG)만 사용
  price: number;
  originPrice?: number | null;
  supplyPrice?: number | null;
  description?: string;
}

// apps/customer-app/src/screens/shop/shopData.ts의 PRODUCTS(p1~p8)와 동일한 값
// brand/prodCat은 코드성 컬럼 규칙(대문자 영문/숫자)에 맞춘 PROD_BRAND/PROD_CAT 코드값
const SHOP_MOCK_PRODUCTS: ProductSeed[] = [
  { prodType: 'GOODS', brand: 'ZIC', name: 'ZIC M7 5W30 엔진오일 (4L)', prodCat: 'ENGOIL', price: 32000, originPrice: 38000, description: 'API SN 규격의 100% 합성 엔진오일로, 저온 시동성과 연비 효율을 동시에 잡았어요. 국산·수입 대부분의 가솔린 차량에 사용 가능합니다.' },
  { prodType: 'GOODS', brand: 'INAVI', name: '아이나비 QXD3000 블랙박스', prodCat: 'BBOX', price: 189000, originPrice: 219000, description: '전후방 2채널 4K 화질에 야간 인식률을 높인 신규 센서를 탑재했어요. 실시간 스마트폰 연동으로 영상 확인이 간편합니다.' },
  { prodType: 'GOODS', brand: 'LLUMAR', name: '루마 버텍스 300 썬팅필름 세트', prodCat: 'TINT', price: 280000, originPrice: 320000, description: '멀티레이어 나노 세라믹 구조로 적외선(IR) 차단율이 높아 여름철 실내 온도 상승을 크게 줄여줍니다. 전자기기 신호 간섭이 없는 논메탈 필름이에요.' },
  { prodType: 'GOODS', brand: 'GYEON', name: '게코 9H 세라믹 코팅제', prodCat: 'COAT', price: 65000, originPrice: 78000, description: '수입차 순정 도장에도 안전하게 사용 가능한 9H 경도의 세라믹 코팅제예요. 발수력과 광택 지속력이 우수합니다.' },
  { prodType: 'GOODS', brand: 'MICH', name: '미쉐린 프라이머시4 타이어 (1본)', prodCat: 'TIRE', price: 145000, originPrice: null, description: '젖은 노면 제동력이 뛰어나고 마모 후에도 성능 저하가 적은 프리미엄 타이어예요. 정숙성과 승차감도 우수합니다.' },
  { prodType: 'GOODS', brand: 'MCARE', name: '차량용 방향제 세트', prodCat: 'ETC', price: 18000, originPrice: 22000, description: '은은하게 퍼지는 향으로 차량 내부 냄새를 잡아줘요. 통풍구 거치형으로 설치가 간편합니다.' },
  { prodType: 'GOODS', brand: 'XTAL', name: '크리스탈 세라믹 유리막코팅 키트', prodCat: 'COAT', price: 42000, originPrice: null, description: '셀프 시공이 가능한 유리막 코팅 키트예요. 스크래치 커버와 발수 지속성이 뛰어난 스탠다드 등급입니다.' },
  { prodType: 'GOODS', brand: 'KSNAVI', name: '김성네비 후방카메라', prodCat: 'BBOX', price: 89000, originPrice: 99000, description: '선명한 화질의 후방카메라로 주차 시 사각지대를 줄여줘요. 방수 설계로 우천 시에도 안정적으로 작동합니다.' },
];

// 사용자 제공 공급업체 상품표(썬팅/블랙박스 시공서비스, 소비자가·공급가 포함)
const SUPPLIER_TINT_BLACKBOX_PRODUCTS: ProductSeed[] = [
  { prodType: 'SVC', brand: 'GTINT', name: '글라스틴트 펜더', prodCat: 'TINT', price: 300000, supplyPrice: 180000 },
  { prodType: 'SVC', brand: 'GTINT', name: '글라스틴트 로드', prodCat: 'TINT', price: 450000, supplyPrice: 350000 },
  { prodType: 'SVC', brand: 'HUPER', name: '후퍼옵틱 클래식', prodCat: 'TINT', price: 1000000, supplyPrice: 600000 },
  { prodType: 'SVC', brand: 'LLUMAR', name: '루마 버텍스 700', prodCat: 'TINT', price: 1000000, supplyPrice: 600000 },
  { prodType: 'SVC', brand: 'LLUMAR', name: '루마 버텍스 900', prodCat: 'TINT', price: 1400000, supplyPrice: 800000 },
  { prodType: 'SVC', brand: 'LLUMAR', name: '루마 버텍스 1100', prodCat: 'TINT', price: 2000000, supplyPrice: 1150000 },
  { prodType: 'SVC', brand: 'INAVI', name: '아이나비 QXD9900mini', prodCat: 'BBOX', price: 500000, supplyPrice: 300000 },
  { prodType: 'SVC', brand: 'INAVI', name: '아이나비 QXD2', prodCat: 'BBOX', price: 542000, supplyPrice: 332000 },
  { prodType: 'SVC', brand: 'FINEVU', name: '파인뷰 X1000', prodCat: 'BBOX', price: 359000, supplyPrice: 210000 },
];

// 예약시공(입찰) 전문가추천 상품카탈로그용 — 기존 PROD_CAT에 대응 상품이 전혀 없던 실내크리닝/언더코팅/외장수리 시공서비스
const EXPERT_PLAN_CATALOG_PRODUCTS: ProductSeed[] = [
  { prodType: 'SVC', brand: 'CARCARE', name: '실내 스팀 크리닝', prodCat: 'CLEAN', price: 150000, supplyPrice: 90000 },
  { prodType: 'SVC', brand: 'CARCARE', name: '가죽시트 클리닝+코팅', prodCat: 'CLEAN', price: 280000, supplyPrice: 170000 },
  { prodType: 'SVC', brand: 'RUSTX', name: '방청 언더코팅(일반)', prodCat: 'UCOAT', price: 180000, supplyPrice: 110000 },
  { prodType: 'SVC', brand: 'RUSTX', name: '방청 언더코팅(프리미엄)', prodCat: 'UCOAT', price: 320000, supplyPrice: 200000 },
  { prodType: 'SVC', brand: 'BODYFIX', name: '외장 판금·도색(부분)', prodCat: 'EXTREP', price: 450000, supplyPrice: 280000 },
  { prodType: 'SVC', brand: 'BODYFIX', name: '범퍼 흠집 보수', prodCat: 'EXTREP', price: 220000, supplyPrice: 140000 },
];

// KCC오토 전용 패키지 상품 — 가격은 별도 패키지 할인 없이 구성상품 소비자가/공급가 합산
const KCC_PACKAGES: ProductSeed[] = [
  // 구성: 글라스틴트 펜더(0000000009) — 300000/180000 그대로
  { prodType: 'PKG', dealerCompanyId: 17, name: '글라스틴트 틴팅 패키지', price: 300000, supplyPrice: 180000 },
  // 구성: 후퍼옵틱 클래식(0000000011, 1000000/600000) + 파인뷰 X1000(0000000017, 359000/210000)
  { prodType: 'PKG', dealerCompanyId: 17, name: '후퍼옵틱 GK 패키지', price: 1359000, supplyPrice: 810000 },
];

// 패키지명 -> 구성상품 productCode 목록(사용자가 지정한 구성코드 그대로)
const BUNDLE_COMPONENTS: Record<string, string[]> = {
  '글라스틴트 틴팅 패키지': ['0000000009'],
  '후퍼옵틱 GK 패키지': ['0000000011', '0000000017'],
};

// apps/customer-app/src/data/addOptions.json(AddOptScreen 목업)과 동일한 값 — 패키지에 없는 분류를 유상으로 추가 선택하는 추가옵션(ADD) 상품
const ADD_OPTION_PRODUCTS: ProductSeed[] = [
  { prodType: 'SVC', name: 'PPF 프론트 풀', prodCat: 'PPF', price: 450000, description: '전면부 도장 보호 필름' },
  { prodType: 'SVC', name: '유리막 코팅 업그레이드', prodCat: 'COAT', price: 180000, description: '2년 지속 세라믹 코팅' },
  { prodType: 'GOODS', name: '프리미엄 매트 세트', prodCat: 'ETC', price: 90000, description: '트렁크·바닥 풀세트' },
  { prodType: 'SVC', name: '신차 세차 지원', prodCat: 'WASH', price: 15000, description: '신차 세차 패키지' },
];

// 패키지명 -> 추가옵션(ADD) 구성상품명 목록(이름으로 조회 — productCode는 자동채번이라 고정할 수 없음)
const ADD_OPTION_COMPONENTS: Record<string, string[]> = {
  '글라스틴트 틴팅 패키지': ['PPF 프론트 풀', '유리막 코팅 업그레이드', '프리미엄 매트 세트', '신차 세차 지원'],
};

async function seedProduct(p: ProductSeed) {
  const existing = await prisma.product.findFirst({ where: { name: p.name } });
  if (existing) {
    await prisma.product.update({ where: { id: existing.id }, data: p });
    return;
  }

  // productCode는 autoincrement id가 나온 뒤에만 만들 수 있어 2단계로 처리(생성 → id 기반 채번 후 즉시 업데이트)
  // 트랜잭션으로 묶어 중간에 실패해도 임시 productCode('0000000000')를 가진 행이 남지 않도록 함
  await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: { ...p, productCode: '0'.repeat(10) },
    });
    await tx.product.update({
      where: { id: created.id },
      data: { productCode: String(created.id).padStart(10, '0') },
    });
  });
}

async function seedBundleItems() {
  for (const [packageName, componentCodes] of Object.entries(BUNDLE_COMPONENTS)) {
    const pkg = await prisma.product.findFirst({ where: { name: packageName } });
    if (!pkg) throw new Error(`패키지 상품을 찾을 수 없습니다: ${packageName}`);

    for (const [i, componentCode] of componentCodes.entries()) {
      await prisma.productBundleItem.upsert({
        where: { packageCode_componentCode: { packageCode: pkg.productCode, componentCode } },
        update: { sortOrder: i },
        create: { packageCode: pkg.productCode, componentCode, sortOrder: i },
      });
    }
  }
  console.log(`패키지 구성상품 매핑 ${Object.keys(BUNDLE_COMPONENTS).length}개 패키지 완료`);
}

async function seedAddOptionItems() {
  for (const [packageName, componentNames] of Object.entries(ADD_OPTION_COMPONENTS)) {
    const pkg = await prisma.product.findFirst({ where: { name: packageName } });
    if (!pkg) throw new Error(`패키지 상품을 찾을 수 없습니다: ${packageName}`);

    for (const [i, componentName] of componentNames.entries()) {
      const component = await prisma.product.findFirst({ where: { name: componentName } });
      if (!component) throw new Error(`구성상품을 찾을 수 없습니다: ${componentName}`);

      await prisma.productBundleItem.upsert({
        where: {
          packageCode_componentCode: {
            packageCode: pkg.productCode,
            componentCode: component.productCode,
          },
        },
        update: { itemType: 'ADD', sortOrder: i, price: component.price },
        create: {
          packageCode: pkg.productCode,
          componentCode: component.productCode,
          itemType: 'ADD',
          sortOrder: i,
          price: component.price,
        },
      });
    }
  }
  console.log(`패키지 추가옵션(ADD) 매핑 ${Object.keys(ADD_OPTION_COMPONENTS).length}개 패키지 완료`);
}

async function main() {
  const all = [
    ...SHOP_MOCK_PRODUCTS,
    ...SUPPLIER_TINT_BLACKBOX_PRODUCTS,
    ...KCC_PACKAGES,
    ...ADD_OPTION_PRODUCTS,
    ...EXPERT_PLAN_CATALOG_PRODUCTS,
  ];
  for (const p of all) {
    await seedProduct(p);
  }
  console.log(`상품 ${all.length}건 완료`);

  await seedBundleItems();
  await seedAddOptionItems();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
