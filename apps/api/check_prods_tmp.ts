import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import { parseDatabaseUrl } from './src/common/db/mariadb-config';

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(parseDatabaseUrl(process.env.DATABASE_URL as string)) });

async function main() {
  const tint = await prisma.product.findMany({ where: { prodCat: 'TINT' } });
  console.log('TINT products:', tint.map(p => ({ code: p.productCode, name: p.name, price: p.price })));
  const bbox = await prisma.product.findMany({ where: { prodCat: 'BBOX' } });
  console.log('BBOX products:', bbox.map(p => ({ code: p.productCode, name: p.name, price: p.price })));
  const existing = await prisma.productBundleItem.findMany({ where: { packageCode: '0000000018' } });
  console.log('existing bundle items for 0000000018:', existing);
}
main().finally(() => prisma.$disconnect());
