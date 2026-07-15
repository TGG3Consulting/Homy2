/**
 * One-time geo backfill.
 *
 * Existing properties/listings were created before the province/city fields existed.
 * They all sit in Yerevan (they have a Yerevan district set), so we set
 * province = city = 'yerevan' wherever province is missing but a district is present.
 * Non-Yerevan data (no district) is left untouched.
 *
 * Run once:  npx ts-node -r tsconfig-paths/register scripts/backfill-geo.ts
 */
import { prisma } from '../lib/db/prisma';

async function main() {
  const props = await prisma.property.updateMany({
    where: { province: null, district: { not: null } },
    data: { province: 'yerevan', city: 'yerevan' },
  });
  const listings = await prisma.propertyListing.updateMany({
    where: { province: null, district: { not: null } },
    data: { province: 'yerevan', city: 'yerevan' },
  });
  console.log(`[backfill-geo] properties updated: ${props.count}, listings updated: ${listings.count}`);
}

main()
  .catch((e) => { console.error('[backfill-geo] failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
