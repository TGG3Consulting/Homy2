import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const total = await prisma.property.count();
  const byDistrict = await prisma.property.groupBy({
    by: ['district'],
    _count: true,
    orderBy: { _count: { district: 'desc' } }
  });
  
  const byDealType = await prisma.property.groupBy({
    by: ['dealType'],
    _count: true
  });

  console.log('=== СТАТИСТИКА БАЗЫ ДАННЫХ ===');
  console.log(`Всего объектов: ${total}`);
  console.log('\n=== По районам ===');
  byDistrict.forEach(d => {
    console.log(`${d.district}: ${d._count} объектов`);
  });
  console.log('\n=== По типу сделки ===');
  byDealType.forEach(d => {
    console.log(`${d.dealType}: ${d._count} объектов`);
  });
}

main().finally(() => prisma.$disconnect());
