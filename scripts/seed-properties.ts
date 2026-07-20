/**
 * scripts/seed-properties.ts
 *
 * Augments the catalogue with realistic, FULLY-populated test properties for
 * search/map testing. ADDITIVE — never deletes existing rows.
 *
 *   100 per Yerevan district (12 → 1200)   ┐ each split 50 sale / 50 rent
 *   100 per non-Yerevan city (45 → 4500)   ┘
 *   ≈ 5700 live (verified + available) Property rows.
 *
 * Run:  npm run seed:properties
 * (ts-node -r tsconfig-paths/register --project tsconfig.server.json)
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { CITIES, YEREVAN_DISTRICTS, localizeGeo, type GeoName } from '@/lib/geo/armenia';

const prisma = new PrismaClient();

const PER_BUCKET = 100;           // objects per city / per Yerevan district
const SALE_SHARE = 0.5;           // half sale, half rent

// ---------------------------------------------------------------------------
// Real Unsplash photos (images.unsplash.com is allowlisted in next.config)
// ---------------------------------------------------------------------------
const IMAGES = {
  living: [
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800',
    'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=800',
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800',
  ],
  bedroom: [
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800',
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',
  ],
  kitchen: [
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
    'https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?w=800',
    'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=800',
  ],
  bathroom: [
    'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800',
  ],
  exterior: [
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
    'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800',
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800',
  ],
};

// ---------------------------------------------------------------------------
// Geo coordinate centres (approx). Yerevan by district, else province centre.
// ---------------------------------------------------------------------------
const DISTRICT_COORDS: Record<string, [number, number]> = {
  Kentron: [40.177, 44.512], Arabkir: [40.203, 44.487], 'Kanaker-Zeytun': [40.213, 44.523],
  Davtashen: [40.226, 44.463], Avan: [40.222, 44.560], Erebuni: [40.130, 44.520],
  'Malatia-Sebastia': [40.155, 44.455], 'Nor-Nork': [40.198, 44.560], 'Nork-Marash': [40.178, 44.545],
  Shengavit: [40.140, 44.480], Ajapnyak: [40.205, 44.440], Nubarashen: [40.100, 44.560],
};
const PROVINCE_COORDS: Record<string, [number, number]> = {
  yerevan: [40.179, 44.499], aragatsotn: [40.30, 44.36], ararat: [39.96, 44.55],
  armavir: [40.15, 44.04], gegharkunik: [40.36, 45.12], kotayk: [40.50, 44.77],
  lori: [40.81, 44.49], shirak: [40.79, 43.84], syunik: [39.20, 46.40],
  tavush: [40.88, 45.15], 'vayots-dzor': [39.76, 45.33],
};

// ---------------------------------------------------------------------------
// Vocab
// ---------------------------------------------------------------------------
const PROPERTY_TYPES = ['apartment', 'apartment', 'apartment', 'studio', 'house', 'penthouse', 'villa'];
const TYPE_LABEL: Record<string, GeoName> = {
  apartment: { en: 'apartment', ru: 'квартира', hy: 'բնակարան' },
  studio:    { en: 'studio',    ru: 'студия',   hy: 'ստուդիա' },
  house:     { en: 'house',     ru: 'дом',      hy: 'տուն' },
  penthouse: { en: 'penthouse', ru: 'пентхаус', hy: 'փենթհաուս' },
  villa:     { en: 'villa',     ru: 'вилла',    hy: 'վիլլա' },
};
const BUILDING_TYPES = ['monolith', 'panel', 'stone', 'brick'];
const CONDITIONS = ['newly_renovated', 'euro_renovation', 'good', 'needs_cosmetic', 'new'];
const FEATURE_POOL = [
  'Parking', 'Balcony', 'Terrace', 'Elevator', 'Central Heating', 'Air Conditioning',
  'Furnished', 'Security', 'Concierge', 'Playground', 'Gym', 'Storage', 'Garden',
  'City View', 'Mountain View', 'Renovated Bathroom', 'Built-in Kitchen', 'Fireplace',
];
const STREETS = [
  'Amiryan', 'Tumanyan', 'Mashtots', 'Baghramyan', 'Komitas', 'Sayat-Nova', 'Nalbandyan',
  'Abovyan', 'Teryan', 'Pushkin', 'Isahakyan', 'Saryan', 'Moskovyan', 'Koghbatsi', 'Aygestan',
];
const DEVELOPERS = ['Major Realty', 'Arca Development', 'Elite Group', 'Homy Verified', 'Renco', 'Nardos Estate'];

// ---------------------------------------------------------------------------
// RNG helpers
// ---------------------------------------------------------------------------
const rnd = (min: number, max: number) => Math.random() * (max - min) + min;
const int = (min: number, max: number) => Math.floor(rnd(min, max + 1));
const pick = <T,>(a: T[]): T => a[int(0, a.length - 1)];
const chance = (p: number) => Math.random() < p;
const round = (n: number, step: number) => Math.round(n / step) * step;
function sample<T>(a: T[], n: number): T[] {
  const c = [...a]; const out: T[] = [];
  for (let i = 0; i < n && c.length; i++) out.push(c.splice(int(0, c.length - 1), 1)[0]);
  return out;
}

function images(): string[] {
  const out = [pick(IMAGES.living), pick(IMAGES.bedroom), pick(IMAGES.kitchen)];
  if (chance(0.6)) out.push(pick(IMAGES.bathroom));
  if (chance(0.5)) out.push(pick(IMAGES.exterior));
  return out;
}

// Regional price multiplier: Yerevan centre priciest → regions cheapest.
function priceMultiplier(provinceKey: string, district: string | null): number {
  if (provinceKey === 'yerevan') {
    if (district === 'Kentron' || district === 'Arabkir' || district === 'Nork-Marash') return 1.6;
    if (district === 'Davtashen' || district === 'Kanaker-Zeytun') return 1.25;
    return 1.0;
  }
  if (['shirak', 'lori', 'kotayk', 'armavir', 'ararat'].includes(provinceKey)) return 0.42;
  return 0.32; // remote provinces
}

interface Owner { id: string; name: string; phone: string | null }

function buildProperty(
  provinceKey: string,
  cityKey: string,
  district: string | null,
  dealType: 'sale' | 'long_term_rental',
  owner: Owner | null,
): Prisma.PropertyCreateManyInput {
  const propertyType = pick(PROPERTY_TYPES);
  const rooms = propertyType === 'studio' ? 1 : int(1, 5);
  const bedrooms = Math.max(1, rooms - 1);
  const bathrooms = rooms >= 4 ? int(2, 3) : int(1, 2);
  const area = round(rooms * rnd(22, 34) + (propertyType === 'house' || propertyType === 'villa' ? rnd(40, 120) : 0), 1);
  const totalFloors = propertyType === 'house' || propertyType === 'villa' ? int(1, 3) : int(4, 16);
  const floor = Math.min(totalFloors, int(1, totalFloors));
  const yearBuilt = int(1962, 2024);
  const condition = yearBuilt >= 2018 ? pick(['new', 'newly_renovated', 'euro_renovation']) : pick(CONDITIONS);
  const mult = priceMultiplier(provinceKey, district);

  // Price: per-m² base × area × regional multiplier.
  let price: number;
  if (dealType === 'sale') {
    price = round(area * rnd(420_000, 620_000) * mult, 100_000);          // AMD total
  } else {
    price = round(area * rnd(2_400, 3_600) * mult, 5_000);                // AMD / month
  }

  const [clat, clng] = provinceKey === 'yerevan' && district && DISTRICT_COORDS[district]
    ? DISTRICT_COORDS[district]
    : (PROVINCE_COORDS[provinceKey] || PROVINCE_COORDS.yerevan);
  const latitude = +(clat + rnd(-0.012, 0.012)).toFixed(7);
  const longitude = +(clng + rnd(-0.012, 0.012)).toFixed(7);

  const features = sample(FEATURE_POOL, int(4, 8));
  const hasParking = features.includes('Parking');
  const hasBalcony = features.includes('Balcony') || features.includes('Terrace');
  const petsAllowed = chance(0.45);

  const placeName: GeoName = provinceKey === 'yerevan' && district
    ? (YEREVAN_DISTRICTS.find((d) => d.key === district)?.name ?? { en: district, ru: district, hy: district })
    : (CITIES.find((c) => c.key === cityKey)?.name ?? { en: cityKey, ru: cityKey, hy: cityKey });

  const typeL = TYPE_LABEL[propertyType];
  const dealRu = dealType === 'sale' ? 'продажа' : 'аренда';
  const roomsWord = propertyType === 'studio' ? 'Студия' : `${rooms}-комн.`;
  const street = pick(STREETS);
  const houseNo = int(1, 90);

  const title: GeoName = {
    en: `${propertyType === 'studio' ? 'Studio' : `${rooms}-room`} ${typeL.en} in ${placeName.en}`,
    ru: `${roomsWord} ${typeL.ru} — ${localizeGeo(placeName, 'ru')}`,
    hy: `${typeL.hy} ${placeName.hy}-ում`,
  };
  const neighborhood: GeoName = provinceKey === 'yerevan' && district ? placeName : placeName;

  const description =
    `${roomsWord} ${typeL.ru} (${dealRu}) в районе ${localizeGeo(placeName, 'ru')}. ` +
    `Площадь ${area} м², ${rooms} комн., ${bathrooms} с/у, этаж ${floor}/${totalFloors}, ${yearBuilt} г.п. ` +
    `Состояние: ${condition}. ${hasParking ? 'Есть парковка. ' : ''}${hasBalcony ? 'Балкон/терраса. ' : ''}` +
    `${petsAllowed ? 'Можно с животными. ' : ''}Удобства: ${features.slice(0, 5).join(', ')}.`;

  const rentFields = dealType === 'long_term_rental'
    ? {
        utilitiesEstimate: new Prisma.Decimal(round(15_000 + area * 300, 1_000)),
        depositMonths: int(1, 2),
        minimumLeaseMonths: pick([6, 12, 12]),
      }
    : { utilitiesEstimate: null, depositMonths: null, minimumLeaseMonths: null };

  return {
    owner_id: owner?.id ?? null,
    title: JSON.stringify(title),
    address: `ул. ${street} ${houseNo}, ${localizeGeo(placeName, 'ru')}`,
    province: provinceKey,
    city: cityKey,
    district: district,
    neighborhood: JSON.stringify(neighborhood),
    price: new Prisma.Decimal(price),
    currency: 'AMD',
    rooms,
    bedrooms,
    bathrooms,
    area: new Prisma.Decimal(area),
    sizeSqm: new Prisma.Decimal(area),
    floor,
    totalFloors,
    yearBuilt,
    buildingType: pick(BUILDING_TYPES),
    condition,
    description,
    features,
    images: images(),
    imageUrl: images()[0],
    latitude: new Prisma.Decimal(latitude),
    longitude: new Prisma.Decimal(longitude),
    matchScore: 0, // computed per-request by the search route
    recommendationReasons: [],
    warning: null,
    ...rentFields,
    petsAllowed,
    hasParking,
    hasBalcony,
    propertyType,
    dealType,
    contact: (owner
      ? { name: owner.name, phone: owner.phone, verified: true, developer: pick(DEVELOPERS) }
      : { name: 'Homy', verified: true }) as unknown as Prisma.InputJsonValue,
    available: true,
    verified: true,
    listingDate: new Date(Date.now() - int(0, 120) * 24 * 3600 * 1000),
  };
}

async function main() {
  console.log('Seeding test properties (additive)…');

  // Owners: reuse existing agent/owner accounts; fallback to any user.
  const owners: Owner[] = (await prisma.user.findMany({
    where: { user_type: { in: ['agent', 'owner'] } },
    select: { id: true, first_name: true, last_name: true, phone: true },
  })).map((u) => ({ id: u.id, name: [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Owner', phone: u.phone }));
  if (owners.length === 0) {
    const any = await prisma.user.findMany({ take: 5, select: { id: true, first_name: true, last_name: true, phone: true } });
    owners.push(...any.map((u) => ({ id: u.id, name: [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Owner', phone: u.phone })));
  }
  console.log(`  Owners available: ${owners.length}${owners.length ? '' : ' (properties will have owner_id=null)'}`);

  const buckets: { province: string; city: string; district: string | null; label: string }[] = [];
  // Yerevan: by district.
  for (const d of YEREVAN_DISTRICTS) buckets.push({ province: 'yerevan', city: 'yerevan', district: d.key, label: `Yerevan/${d.key}` });
  // Every other city.
  for (const c of CITIES) {
    if (c.key === 'yerevan') continue;
    buckets.push({ province: c.province, city: c.key, district: null, label: c.key });
  }

  const batch: Prisma.PropertyCreateManyInput[] = [];
  let total = 0; let ownerIdx = 0;
  const flush = async () => {
    if (!batch.length) return;
    await prisma.property.createMany({ data: batch.splice(0, batch.length) });
  };

  for (const b of buckets) {
    const nSale = Math.round(PER_BUCKET * SALE_SHARE);
    for (let i = 0; i < PER_BUCKET; i++) {
      const dealType = i < nSale ? 'sale' : 'long_term_rental';
      const owner = owners.length ? owners[ownerIdx++ % owners.length] : null;
      batch.push(buildProperty(b.province, b.city, b.district, dealType, owner));
      total++;
      if (batch.length >= 500) await flush();
    }
    console.log(`  ${b.label}: +${PER_BUCKET}`);
  }
  await flush();

  console.log(`\nDone. Inserted ${total} properties across ${buckets.length} buckets.`);
  const grand = await prisma.property.count();
  console.log(`Total properties now in DB: ${grand}`);
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
