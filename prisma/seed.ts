import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// SEED DATA DEFINITIONS
// ============================================

// Yerevan district coordinates (real coordinates)
const DISTRICTS = {
  kentron: { name: 'Kentron', lat: 40.1792, lng: 44.5128 },
  arabkir: { name: 'Arabkir', lat: 40.2052, lng: 44.5045 },
  ajapnyak: { name: 'Ajapnyak', lat: 40.2100, lng: 44.4720 },
  davtashen: { name: 'Davtashen', lat: 40.2200, lng: 44.4850 },
  kanaker: { name: 'Kanaker-Zeytun', lat: 40.2150, lng: 44.5350 },
  avan: { name: 'Avan', lat: 40.1950, lng: 44.5600 },
  norkMarash: { name: 'Nork-Marash', lat: 40.1750, lng: 44.5450 },
  erebuni: { name: 'Erebuni', lat: 40.1350, lng: 44.5250 },
  shengavit: { name: 'Shengavit', lat: 40.1580, lng: 44.4920 },
  malatia: { name: 'Malatia-Sebastia', lat: 40.1520, lng: 44.4680 },
};

// Unsplash apartment interior images (free to use)
const APARTMENT_IMAGES = {
  living: [
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800',
    'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=800',
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
  ],
  bedroom: [
    'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800',
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800',
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
  ],
};

// 360 panorama URLs - PLACEHOLDER images with CORS support
// TODO: Replace with real interior 360 photos from Ricoh Theta/Insta360 camera
const PANORAMA_URLS = {
  living: [
    'https://cdn.aframe.io/360-image-gallery-boilerplate/img/sechelt.jpg',
    'https://cdn.aframe.io/360-image-gallery-boilerplate/img/city.jpg',
  ],
  bedroom: [
    'https://cdn.aframe.io/360-image-gallery-boilerplate/img/cubes.jpg',
  ],
  kitchen: [
    'https://cdn.aframe.io/360-image-gallery-boilerplate/img/sechelt.jpg',
  ],
  bathroom: [
    'https://cdn.aframe.io/360-image-gallery-boilerplate/img/city.jpg',
  ],
  balcony: [
    'https://cdn.aframe.io/360-image-gallery-boilerplate/img/cubes.jpg',
  ],
};

// Contact agents/owners
const CONTACTS = [
  { name: 'Anna Hakobyan', type: 'agent', phone: '+374 77 201 086', verified: true },
  { name: 'Armen Petrosyan', type: 'owner', phone: '+374 91 456 789', verified: true },
  { name: 'Lilit Sargsyan', type: 'agent', phone: '+374 93 112 233', verified: true },
  { name: 'Davit Grigoryan', type: 'owner', phone: '+374 94 998 877', verified: false },
  { name: 'Marine Vardanyan', type: 'agent', phone: '+374 77 555 666', verified: true },
  { name: 'Hayk Hovhannisyan', type: 'owner', phone: '+374 99 321 654', verified: true },
  { name: 'Narek Karapetyan', type: 'agent', phone: '+374 91 777 888', verified: true },
  { name: 'Anahit Mkrtchyan', type: 'owner', phone: '+374 93 444 555', verified: false },
  { name: 'Tigran Avetisyan', type: 'agent', phone: '+374 94 666 777', verified: true },
  { name: 'Karine Ghazaryan', type: 'agent', phone: '+374 77 888 999', verified: true },
];

// Developer names for legal analysis
const DEVELOPERS = [
  'Elite Construction LLC',
  'Yerevan Development Group',
  'Cascade Builders',
  'Ararat Construction Co.',
  'Modern Living Armenia',
  'Premium Estates AM',
  'City Build Yerevan',
  'Northern Avenue Developers',
];

// ============================================
// PROPERTY DEFINITIONS (10 properties)
// ============================================

interface PropertySeedData {
  id: string;
  title: { en: string; ru: string; hy: string };
  neighborhood: { en: string; ru: string; hy: string };
  district: string;
  address: string;
  price: number; // AMD per month for rental, total price for sale
  dealType: 'long_term_rental' | 'sale';
  bedrooms: number;
  rooms: number;
  bathrooms: number;
  sizeSqm: number;
  floor: number;
  totalFloors: number;
  yearBuilt: number;
  buildingType: string;
  matchScore: number;
  isTopChoice: boolean;
  hasVirtualTour: boolean;
  latitude: number;
  longitude: number;
  features: string[];
  recommendationReasons: string[];
  warning?: string;
}

const PROPERTIES: PropertySeedData[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    title: {
      en: 'Modern 2-Bedroom Apartment in Kentron',
      ru: 'Современная 2-комнатная квартира в Кентроне',
      hy: 'Ժամանակակից 2-սենյականոց բնակարան Կենտրոնում',
    },
    neighborhood: {
      en: 'Northern Avenue',
      ru: 'Северный проспект',
      hy: 'Հյուսիսային պողոտա',
    },
    district: 'Kentron',
    address: '15 Northern Avenue',
    price: 350000,
    dealType: 'long_term_rental',
    bedrooms: 2,
    rooms: 3,
    bathrooms: 1,
    sizeSqm: 85,
    floor: 7,
    totalFloors: 12,
    yearBuilt: 2018,
    buildingType: 'monolith',
    matchScore: 98,
    isTopChoice: true,
    hasVirtualTour: true,
    latitude: 40.1812,
    longitude: 44.5165,
    features: ['Balcony', 'Air Conditioning', 'Central Heating', 'Elevator', 'Security', 'Parking'],
    recommendationReasons: [
      '{"en":"Perfect location in city center","ru":"Идеальное расположение в центре города"}',
      '{"en":"Excellent natural lighting","ru":"Отличное естественное освещение"}',
      '{"en":"Modern renovation","ru":"Современный ремонт"}',
      '{"en":"Walking distance to Opera","ru":"Пешая доступность до Оперы"}',
    ],
    warning: '{"en":"Higher utility costs due to central location","ru":"Более высокие коммунальные расходы из-за центрального расположения"}',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    title: {
      en: 'Spacious 3-Bedroom Family Apartment',
      ru: 'Просторная 3-комнатная семейная квартира',
      hy: 'Ընդարձակ 3-սենյականոց ընտանեկան բնակարան',
    },
    neighborhood: {
      en: 'Baghramyan Avenue',
      ru: 'Проспект Баграмяна',
      hy: 'Բաղрамяни poghota',
    },
    district: 'Arabkir',
    address: '42 Baghramyan Avenue',
    price: 280000,
    dealType: 'long_term_rental',
    bedrooms: 3,
    rooms: 4,
    bathrooms: 2,
    sizeSqm: 120,
    floor: 5,
    totalFloors: 9,
    yearBuilt: 2015,
    buildingType: 'brick',
    matchScore: 95,
    isTopChoice: true,
    hasVirtualTour: true,
    latitude: 40.1985,
    longitude: 44.5058,
    features: ['Balcony', 'Central Heating', 'Gas Heating', 'Elevator', 'Furnished', 'Storage Room'],
    recommendationReasons: [
      '{"en":"Near American University of Armenia","ru":"Рядом с Американским университетом Армении"}',
      '{"en":"Quiet residential area","ru":"Тихий жилой район"}',
      '{"en":"Family-friendly neighborhood","ru":"Район подходит для семей"}',
      '{"en":"Good public transport access","ru":"Хороший доступ к общественному транспорту"}',
    ],
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    title: {
      en: 'Cozy Studio near Republic Square',
      ru: 'Уютная студия рядом с площadью Республики',
      hy: 'Հարմարավետ ստուդիո Հանրապետության հրապարակի մոտ',
    },
    neighborhood: {
      en: 'Republic Square',
      ru: 'Площадь Республики',
      hy: 'Hanrapetutyan hraparag',
    },
    district: 'Kentron',
    address: '8 Amiryan Street',
    price: 180000,
    dealType: 'long_term_rental',
    bedrooms: 1,
    rooms: 1,
    bathrooms: 1,
    sizeSqm: 45,
    floor: 3,
    totalFloors: 5,
    yearBuilt: 2010,
    buildingType: 'brick',
    matchScore: 88,
    isTopChoice: false,
    hasVirtualTour: true,
    latitude: 40.1778,
    longitude: 44.5125,
    features: ['Air Conditioning', 'Internet', 'Furnished', 'Cable TV'],
    recommendationReasons: [
      '{"en":"Walking distance to Republic Square","ru":"Пешая доступность до площади Республики"}',
      '{"en":"Perfect for young professionals","ru":"Идеально для молодых специалистов"}',
      '{"en":"Affordable price for location","ru":"Доступная цена для такого расположения"}',
    ],
    warning: '{"en":"Street noise during peak hours","ru":"Шум улицы в часы пик"}',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    title: {
      en: 'Renovated 2-Bedroom in Ajapnyak',
      ru: 'Отремонтированная 2-комнатная в Аджапняке',
      hy: 'Նորոգված 2-սենյականոց բնակարան Աջափնյակում',
    },
    neighborhood: {
      en: 'Ajapnyak 3rd District',
      ru: 'Аджапняк 3-й микрорайон',
      hy: 'Ajapnyak 3-rd tagamas',
    },
    district: 'Ajapnyak',
    address: '25 Halabyan Street',
    price: 150000,
    dealType: 'long_term_rental',
    bedrooms: 2,
    rooms: 3,
    bathrooms: 1,
    sizeSqm: 70,
    floor: 8,
    totalFloors: 9,
    yearBuilt: 1985,
    buildingType: 'panel',
    matchScore: 82,
    isTopChoice: false,
    hasVirtualTour: false,
    latitude: 40.2085,
    longitude: 44.4695,
    features: ['Balcony', 'Gas Heating', 'Elevator', 'Internet'],
    recommendationReasons: [
      '{"en":"Recently renovated","ru":"Недавно отремонтировано"}',
      '{"en":"Good value for money","ru":"Хорошее соотношение цены и качества"}',
      '{"en":"Near supermarkets","ru":"Рядом с супермаркетами"}',
    ],
    warning: '{"en":"Older building construction","ru":"Старая постройка здания"}',
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    title: {
      en: 'Luxury 4-Bedroom Penthouse',
      ru: 'Роскошный 4-комнатный пентхаус',
      hy: 'Շքեղ 4-սենյականոց պենտհաուս',
    },
    neighborhood: {
      en: 'Cascade Area',
      ru: 'Район Каскада',
      hy: 'Kaskadi tarack',
    },
    district: 'Kentron',
    address: '1 Cascade Street',
    price: 400000,
    dealType: 'long_term_rental',
    bedrooms: 4,
    rooms: 5,
    bathrooms: 2,
    sizeSqm: 180,
    floor: 15,
    totalFloors: 15,
    yearBuilt: 2022,
    buildingType: 'monolith',
    matchScore: 92,
    isTopChoice: true,
    hasVirtualTour: false,
    latitude: 40.1920,
    longitude: 44.5075,
    features: ['Terrace', 'Air Conditioning', 'Central Heating', 'Elevator', 'Security', 'Parking', 'Gym Access', 'Pool Access', 'Concierge'],
    recommendationReasons: [
      '{"en":"Panoramic city views","ru":"Панорамный вид на город"}',
      '{"en":"Premium building amenities","ru":"Премиальные удобства здания"}',
      '{"en":"Walking distance to Cascade","ru":"Пешая доступность до Каскада"}',
      '{"en":"High-end finishes","ru":"Отделка высокого класса"}',
    ],
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    title: {
      en: 'Bright 2-Bedroom in Davtashen',
      ru: 'Светлая 2-комнатная в Давташене',
      hy: 'Պայծառ 2-սենյականոց բնակարան Դավթաշենում',
    },
    neighborhood: {
      en: 'Davtashen 3rd Block',
      ru: 'Давташен 3-й массив',
      hy: 'Davtashen 3-rd block',
    },
    district: 'Davtashen',
    address: '18 Davtashen 3rd Street',
    price: 200000,
    dealType: 'long_term_rental',
    bedrooms: 2,
    rooms: 3,
    bathrooms: 1,
    sizeSqm: 75,
    floor: 6,
    totalFloors: 9,
    yearBuilt: 2000,
    buildingType: 'stone',
    matchScore: 85,
    isTopChoice: false,
    hasVirtualTour: false,
    latitude: 40.2180,
    longitude: 44.4820,
    features: ['Balcony', 'Gas Heating', 'Elevator', 'Parking', 'Storage Room'],
    recommendationReasons: [
      '{"en":"Quiet neighborhood","ru":"Тихий район"}',
      '{"en":"Good for families","ru":"Подходит для семей"}',
      '{"en":"Near schools","ru":"Рядом со школами"}',
      '{"en":"Easy parking","ru":"Удобная парковка"}',
    ],
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    title: {
      en: 'Modern 1-Bedroom near Metro',
      ru: 'Современная 1-комнатная рядом с метро',
      hy: 'Ժամանակակից 1-սենյականոց բնակարան մետրոյի մոտ',
    },
    neighborhood: {
      en: 'Barekamutyun Metro',
      ru: 'Метро Барекамутюн',
      hy: 'Kaskadi tarack',
    },
    district: 'Arabkir',
    address: '55 Komitas Avenue',
    price: 220000,
    dealType: 'long_term_rental',
    bedrooms: 1,
    rooms: 2,
    bathrooms: 1,
    sizeSqm: 55,
    floor: 4,
    totalFloors: 12,
    yearBuilt: 2019,
    buildingType: 'monolith',
    matchScore: 90,
    isTopChoice: false,
    hasVirtualTour: false,
    latitude: 40.2025,
    longitude: 44.4985,
    features: ['Balcony', 'Air Conditioning', 'Central Heating', 'Elevator', 'Security', 'Internet'],
    recommendationReasons: [
      '{"en":"2 minutes to metro","ru":"2 минуты до метро"}',
      '{"en":"New building","ru":"Новое здание"}',
      '{"en":"Great for commuters","ru":"Отлично для тех, кто ездит на работу"}',
    ],
  },
  {
    id: '88888888-8888-8888-8888-888888888888',
    title: {
      en: 'Affordable 2-Bedroom in Erebuni',
      ru: 'Доступная 2-комнатная в Эребуни',
      hy: 'Մատչելի 2-սենյականոց բնակարան Էրեբունիում',
    },
    neighborhood: {
      en: 'Erebuni District',
      ru: 'Район Эребуни',
      hy: 'Erebuni tagamas',
    },
    district: 'Erebuni',
    address: '30 Erebuni Avenue',
    price: 160000,
    dealType: 'long_term_rental',
    bedrooms: 2,
    rooms: 3,
    bathrooms: 1,
    sizeSqm: 65,
    floor: 2,
    totalFloors: 5,
    yearBuilt: 1990,
    buildingType: 'panel',
    matchScore: 78,
    isTopChoice: false,
    hasVirtualTour: false,
    latitude: 40.1365,
    longitude: 44.5280,
    features: ['Balcony', 'Gas Heating', 'Internet', 'Furnished'],
    recommendationReasons: [
      '{"en":"Very affordable","ru":"Очень доступно"}',
      '{"en":"Close to Erebuni Museum","ru":"Рядом с музеем Эребуни"}',
      '{"en":"Good local amenities","ru":"Хорошая местная инфраструктура"}',
    ],
    warning: '{"en":"Further from city center","ru":"Дальше от центра города"}',
  },
  {
    id: '99999999-9999-9999-9999-999999999999',
    title: {
      en: 'Charming 3-Bedroom in Nork-Marash',
      ru: 'Очаровательная 3-комнатная в Норк-Мараше',
      hy: 'Գրավիչ 3-սենյականոց բնակարան Նորք-Մարաշում',
    },
    neighborhood: {
      en: 'Nork Gardens',
      ru: 'Сады Норка',
      hy: 'Erebuni tagamas',
    },
    district: 'Nork-Marash',
    address: '12 Nork 7th Street',
    price: 250000,
    dealType: 'long_term_rental',
    bedrooms: 3,
    rooms: 4,
    bathrooms: 1,
    sizeSqm: 100,
    floor: 3,
    totalFloors: 4,
    yearBuilt: 2008,
    buildingType: 'stone',
    matchScore: 86,
    isTopChoice: false,
    hasVirtualTour: false,
    latitude: 40.1765,
    longitude: 44.5485,
    features: ['Garden', 'Parking', 'Gas Heating', 'Storage Room', 'Furnished'],
    recommendationReasons: [
      '{"en":"Private garden access","ru":"Доступ к частному саду"}',
      '{"en":"Peaceful area","ru":"Спокойный район"}',
      '{"en":"Great for families","ru":"Отлично для семей"}',
      '{"en":"Mountain views","ru":"Вид на горы"}',
    ],
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    title: {
      en: 'Stylish 2-Bedroom in Kanaker-Zeytun',
      ru: 'Стильная 2-комнатная в Канакер-Зейтуне',
      hy: 'Նրբաճաշակ 2-սենյականոց բնակարան Քանաքեռ-Զեյթունում',
    },
    neighborhood: {
      en: 'Zeytun District',
      ru: 'Район Зейтун',
      hy: 'Erebuni tagamas',
    },
    district: 'Kanaker-Zeytun',
    address: '8 Armenakyan Street',
    price: 230000,
    dealType: 'long_term_rental',
    bedrooms: 2,
    rooms: 3,
    bathrooms: 1,
    sizeSqm: 80,
    floor: 9,
    totalFloors: 16,
    yearBuilt: 2017,
    buildingType: 'monolith',
    matchScore: 84,
    isTopChoice: false,
    hasVirtualTour: false,
    latitude: 40.2135,
    longitude: 44.5320,
    features: ['Balcony', 'Air Conditioning', 'Central Heating', 'Elevator', 'Security', 'Parking'],
    recommendationReasons: [
      '{"en":"Modern high-rise building","ru":"Современное высотное здание"}',
      '{"en":"Good transport connections","ru":"Хорошее транспортное сообщение"}',
      '{"en":"Near shopping centers","ru":"Рядом с торговыми центрами"}',
    ],
  },
  // ============================================
  // SALE PROPERTIES (10 properties)
  // ============================================
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    title: {
      en: '3-Bedroom Apartment for Sale in Kentron',
      ru: '3-комнатная квартира на продажу в Кентроне',
      hy: '3-սենյականոց բնակարան վաճառքի Կենտրոնում',
    },
    neighborhood: { en: 'Republic Square', ru: 'Площадь Республики', hy: 'Haytni tagamas' },
    district: 'Kentron',
    address: '5 Abovyan Street',
    price: 185000000, // ~$480,000 USD
    dealType: 'sale',
    bedrooms: 3,
    rooms: 4,
    bathrooms: 2,
    sizeSqm: 140,
    floor: 8,
    totalFloors: 12,
    yearBuilt: 2020,
    buildingType: 'monolith',
    matchScore: 92,
    isTopChoice: false,
    hasVirtualTour: false,
    latitude: 40.1775,
    longitude: 44.5125,
    features: ['Balcony', 'Air Conditioning', 'Central Heating', 'Elevator', 'Security', 'Parking', 'Storage Room'],
    recommendationReasons: [
      '{"en":"Prime location in city center","ru":"Премиальная локация в центре города"}',
      '{"en":"New building with modern amenities","ru":"Новое здание с современными удобствами"}',
      '{"en":"Investment potential","ru":"Инвестиционный потенциал"}',
    ],
  },
  {
    id: 'a2222222-2222-2222-2222-222222222222',
    title: {
      en: 'Luxury 4-Bedroom Penthouse',
      ru: 'Люксовый 4-комнатный пентхаус',
      hy: 'Շքեղ 4-սենյականոց պենthaouus',
    },
    neighborhood: { en: 'Northern Avenue', ru: 'Северный проспект', hy: 'Haytni tagamas' },
    district: 'Kentron',
    address: '1 Northern Avenue',
    price: 450000000, // ~$1,150,000 USD
    dealType: 'sale',
    bedrooms: 4,
    rooms: 6,
    bathrooms: 3,
    sizeSqm: 280,
    floor: 15,
    totalFloors: 15,
    yearBuilt: 2022,
    buildingType: 'monolith',
    matchScore: 88,
    isTopChoice: false,
    hasVirtualTour: true,
    latitude: 40.1815,
    longitude: 44.5160,
    features: ['Terrace', 'Air Conditioning', 'Central Heating', 'Elevator', 'Security', 'Parking', 'Concierge', 'Gym'],
    recommendationReasons: [
      '{"en":"Panoramic city views","ru":"Панорамный вид на город"}',
      '{"en":"Premium finishes","ru":"Премиальная отделка"}',
      '{"en":"Exclusive building amenities","ru":"Эксклюзивные удобства дома"}',
    ],
    warning: '{"en":"High maintenance fees","ru":"Высокая плата за обслуживание"}',
  },
  {
    id: 'a3333333-3333-3333-3333-333333333333',
    title: {
      en: '2-Bedroom Apartment in Arabkir',
      ru: '2-комнатная квартира в Арабкире',
      hy: '2-սenjakanoc baynanar Arabkirum',
    },
    neighborhood: { en: 'Komitas Avenue', ru: 'Проспект Комитаса', hy: 'Haytni tagamas' },
    district: 'Arabkir',
    address: '28 Komitas Avenue',
    price: 85000000, // ~$220,000 USD
    dealType: 'sale',
    bedrooms: 2,
    rooms: 3,
    bathrooms: 1,
    sizeSqm: 75,
    floor: 6,
    totalFloors: 9,
    yearBuilt: 2018,
    buildingType: 'brick',
    matchScore: 90,
    isTopChoice: false,
    hasVirtualTour: false,
    latitude: 40.2020,
    longitude: 44.5010,
    features: ['Balcony', 'Central Heating', 'Elevator', 'Parking'],
    recommendationReasons: [
      '{"en":"Family-friendly neighborhood","ru":"Район подходит для семей"}',
      '{"en":"Near schools and parks","ru":"Рядом школы и парки"}',
      '{"en":"Good value for money","ru":"Хорошее соотношение цена/качество"}',
    ],
  },
  {
    id: 'a4444444-4444-4444-4444-444444444444',
    title: {
      en: 'Renovated 3-Bedroom in Davtashen',
      ru: 'Отремонтированная 3-комнатная в Давташене',
      hy: '3-սenjakanoc baynanar Davtashenum',
    },
    neighborhood: { en: 'Davtashen 1st District', ru: '1-й массив Давташена', hy: 'Haytni tagamas' },
    district: 'Davtashen',
    address: '15 Tigran Mets Street',
    price: 72000000, // ~$185,000 USD
    dealType: 'sale',
    bedrooms: 3,
    rooms: 4,
    bathrooms: 1,
    sizeSqm: 90,
    floor: 4,
    totalFloors: 9,
    yearBuilt: 2005,
    buildingType: 'panel',
    matchScore: 85,
    isTopChoice: false,
    hasVirtualTour: false,
    latitude: 40.2180,
    longitude: 44.4870,
    features: ['Balcony', 'Gas Heating', 'Elevator', 'Parking'],
    recommendationReasons: [
      '{"en":"Fresh renovation","ru":"Свежий ремонт"}',
      '{"en":"Quiet residential area","ru":"Тихий жилой район"}',
      '{"en":"Affordable price","ru":"Доступная цена"}',
    ],
  },
  {
    id: 'a5555555-5555-5555-5555-555555555555',
    title: {
      en: 'New Build 2-Bedroom with Parking',
      ru: 'Новостройка 2-комнатная с парковкой',
      hy: '2-սenjakanoc baynanar Arabkirum',
    },
    neighborhood: { en: 'Malatia-Sebastia', ru: 'Малатия-Себастия', hy: 'Haytni tagamas' },
    district: 'Malatia-Sebastia',
    address: '50 Raffi Street',
    price: 58000000, // ~$150,000 USD
    dealType: 'sale',
    bedrooms: 2,
    rooms: 3,
    bathrooms: 1,
    sizeSqm: 68,
    floor: 10,
    totalFloors: 16,
    yearBuilt: 2023,
    buildingType: 'monolith',
    matchScore: 87,
    isTopChoice: false,
    hasVirtualTour: false,
    latitude: 40.1550,
    longitude: 44.4700,
    features: ['Balcony', 'Central Heating', 'Elevator', 'Security', 'Parking'],
    recommendationReasons: [
      '{"en":"Brand new building","ru":"Совершенно новое здание"}',
      '{"en":"Near Dalma Garden Mall","ru":"Рядом с Dalma Garden Mall"}',
      '{"en":"Underground parking included","ru":"Подземная парковка включена"}',
    ],
  },
  {
    id: 'a6666666-6666-6666-6666-666666666666',
    title: {
      en: 'Spacious 4-Bedroom Family Home',
      ru: 'Просторная 4-комнатная для семьи',
      hy: 'Շքեղ 4-սենյականոց պենthaouus',
    },
    neighborhood: { en: 'Nork-Marash', ru: 'Норк-Мараш', hy: 'Haytni tagamas' },
    district: 'Nork-Marash',
    address: '8 Nork Gardens',
    price: 195000000, // ~$500,000 USD
    dealType: 'sale',
    bedrooms: 4,
    rooms: 5,
    bathrooms: 2,
    sizeSqm: 180,
    floor: 3,
    totalFloors: 5,
    yearBuilt: 2019,
    buildingType: 'monolith',
    matchScore: 91,
    isTopChoice: false,
    hasVirtualTour: true,
    latitude: 40.1780,
    longitude: 44.5480,
    features: ['Terrace', 'Air Conditioning', 'Central Heating', 'Elevator', 'Security', 'Parking', 'Garden View'],
    recommendationReasons: [
      '{"en":"Prestigious residential complex","ru":"Престижный жилой комплекс"}',
      '{"en":"Mountain views","ru":"Вид на горы"}',
      '{"en":"Private garden access","ru":"Доступ к частному саду"}',
    ],
  },
  {
    id: 'a7777777-7777-7777-7777-777777777777',
    title: {
      en: 'Studio Apartment Investment',
      ru: 'Студия для инвестиций',
      hy: 'Ստudioo baynanar nerdrumajin',
    },
    neighborhood: { en: 'Cascade Area', ru: 'Район Каскада', hy: 'Haytni tagamas' },
    district: 'Kentron',
    address: '22 Tamanyan Street',
    price: 42000000, // ~$108,000 USD
    dealType: 'sale',
    bedrooms: 0,
    rooms: 1,
    bathrooms: 1,
    sizeSqm: 38,
    floor: 5,
    totalFloors: 9,
    yearBuilt: 2017,
    buildingType: 'monolith',
    matchScore: 82,
    isTopChoice: false,
    hasVirtualTour: false,
    latitude: 40.1850,
    longitude: 44.5100,
    features: ['Air Conditioning', 'Central Heating', 'Elevator', 'Security'],
    recommendationReasons: [
      '{"en":"Perfect for Airbnb","ru":"Идеально для Airbnb"}',
      '{"en":"Tourist area location","ru":"Расположение в туристическом районе"}',
      '{"en":"High rental yield potential","ru":"Высокий потенциал арендной доходности"}',
    ],
  },
  {
    id: 'a8888888-8888-8888-8888-888888888888',
    title: {
      en: '3-Bedroom with City Views',
      ru: '3-комнатная с видом на город',
      hy: '3-սenjakanoc baynanar Davtashenum',
    },
    neighborhood: { en: 'Avan', ru: 'Аван', hy: 'Haytni tagamas' },
    district: 'Avan',
    address: '45 Acharyan Street',
    price: 68000000, // ~$175,000 USD
    dealType: 'sale',
    bedrooms: 3,
    rooms: 4,
    bathrooms: 1,
    sizeSqm: 95,
    floor: 12,
    totalFloors: 14,
    yearBuilt: 2021,
    buildingType: 'monolith',
    matchScore: 86,
    isTopChoice: false,
    hasVirtualTour: false,
    latitude: 40.1980,
    longitude: 44.5620,
    features: ['Balcony', 'Central Heating', 'Elevator', 'Parking'],
    recommendationReasons: [
      '{"en":"Panoramic city views","ru":"Панорамный вид на город"}',
      '{"en":"Modern building","ru":"Современное здание"}',
      '{"en":"Growing neighborhood","ru":"Развивающийся район"}',
    ],
  },
  {
    id: 'a9999999-9999-9999-9999-999999999999',
    title: {
      en: 'Cozy 1-Bedroom in Shengavit',
      ru: 'Уютная 1-комнатная в Шенгавите',
      hy: '1-սenjakanoc baynanar Shengavitum',
    },
    neighborhood: { en: 'Shengavit', ru: 'Шенгавит', hy: 'Haytni tagamas' },
    district: 'Shengavit',
    address: '12 Arshakunyats Avenue',
    price: 35000000, // ~$90,000 USD
    dealType: 'sale',
    bedrooms: 1,
    rooms: 2,
    bathrooms: 1,
    sizeSqm: 45,
    floor: 3,
    totalFloors: 9,
    yearBuilt: 2010,
    buildingType: 'brick',
    matchScore: 80,
    isTopChoice: false,
    hasVirtualTour: false,
    latitude: 40.1600,
    longitude: 44.4950,
    features: ['Balcony', 'Gas Heating', 'Elevator'],
    recommendationReasons: [
      '{"en":"Affordable entry price","ru":"Доступная стартовая цена"}',
      '{"en":"Near metro station","ru":"Рядом с метро"}',
      '{"en":"Good for first-time buyers","ru":"Подходит для первой покупки"}',
    ],
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    title: {
      en: 'Premium 5-Bedroom Duplex',
      ru: 'Премиум 5-комнатный дуплекс',
      hy: 'Premium 5-սenjakanoc duplex',
    },
    neighborhood: { en: 'Cascade', ru: 'Каскад', hy: 'Haytni tagamas' },
    district: 'Kentron',
    address: '3 Cascade Street',
    price: 580000000, // ~$1,500,000 USD
    dealType: 'sale',
    bedrooms: 5,
    rooms: 7,
    bathrooms: 4,
    sizeSqm: 350,
    floor: 9,
    totalFloors: 10,
    yearBuilt: 2023,
    buildingType: 'monolith',
    matchScore: 95,
    isTopChoice: true,
    hasVirtualTour: true,
    latitude: 40.1870,
    longitude: 44.5130,
    features: ['Terrace', 'Air Conditioning', 'Central Heating', 'Elevator', 'Security', 'Parking', 'Concierge', 'Gym', 'Pool'],
    recommendationReasons: [
      '{"en":"Ultra-luxury property","ru":"Ультра-люксовая недвижимость"}',
      '{"en":"Private rooftop terrace","ru":"Частная терраса на крыше"}',
      '{"en":"Smart home system","ru":"Система умный дом"}',
      '{"en":"Walking distance to Cascade","ru":"Пешая доступность до Каскада"}',
    ],
  },
];

// ============================================
// VIRTUAL TOUR ROOM DEFINITIONS
// ============================================

interface VirtualTourRoomData {
  propertyId: string;
  rooms: {
    id: string;
    name: { en: string; ru: string; hy: string };
    panoramaUrl: string;
    orderIndex: number;
    hotspots: { target_room_id: string; x: number; y: number }[];
  }[];
}

const VIRTUAL_TOURS: VirtualTourRoomData[] = [
  {
    propertyId: '11111111-1111-1111-1111-111111111111',
    rooms: [
      {
        id: 'room-living-1',
        name: { en: 'Living Room', ru: 'Гостиная', hy: 'Hyurasenyak' },
        panoramaUrl: PANORAMA_URLS.living[0],
        orderIndex: 0,
        hotspots: [
          { target_room_id: 'room-kitchen-1', x: 0.25, y: 0.52 },
          { target_room_id: 'room-bedroom-1', x: 0.75, y: 0.48 },
        ],
      },
      {
        id: 'room-kitchen-1',
        name: { en: 'Kitchen', ru: 'Кухня', hy: 'Khohanoc' },
        panoramaUrl: PANORAMA_URLS.kitchen[0],
        orderIndex: 1,
        hotspots: [
          { target_room_id: 'room-living-1', x: 0.5, y: 0.5 },
          { target_room_id: 'room-balcony-1', x: 0.8, y: 0.45 },
        ],
      },
      {
        id: 'room-bedroom-1',
        name: { en: 'Master Bedroom', ru: 'Главная спальня', hy: 'Erebuni tagamas' },
        panoramaUrl: PANORAMA_URLS.bedroom[0],
        orderIndex: 2,
        hotspots: [
          { target_room_id: 'room-living-1', x: 0.3, y: 0.5 },
          { target_room_id: 'room-bathroom-1', x: 0.7, y: 0.52 },
        ],
      },
      {
        id: 'room-bathroom-1',
        name: { en: 'Bathroom', ru: 'Ванная комната', hy: 'Erebuni tagamas' },
        panoramaUrl: PANORAMA_URLS.bathroom[0],
        orderIndex: 3,
        hotspots: [
          { target_room_id: 'room-bedroom-1', x: 0.5, y: 0.5 },
        ],
      },
      {
        id: 'room-balcony-1',
        name: { en: 'Balcony', ru: 'Балкон', hy: 'Patshgamb' },
        panoramaUrl: PANORAMA_URLS.balcony[0],
        orderIndex: 4,
        hotspots: [
          { target_room_id: 'room-kitchen-1', x: 0.5, y: 0.5 },
        ],
      },
    ],
  },
  {
    propertyId: '22222222-2222-2222-2222-222222222222',
    rooms: [
      {
        id: 'room-living-2',
        name: { en: 'Living Room', ru: 'Гостиная', hy: 'Hyurasenyak' },
        panoramaUrl: PANORAMA_URLS.living[1],
        orderIndex: 0,
        hotspots: [
          { target_room_id: 'room-kitchen-2', x: 0.2, y: 0.5 },
          { target_room_id: 'room-bedroom1-2', x: 0.6, y: 0.48 },
          { target_room_id: 'room-bedroom2-2', x: 0.85, y: 0.52 },
        ],
      },
      {
        id: 'room-kitchen-2',
        name: { en: 'Kitchen', ru: 'Кухня', hy: 'Khohanoc' },
        panoramaUrl: PANORAMA_URLS.kitchen[0],
        orderIndex: 1,
        hotspots: [
          { target_room_id: 'room-living-2', x: 0.5, y: 0.5 },
        ],
      },
      {
        id: 'room-bedroom1-2',
        name: { en: 'Master Bedroom', ru: 'Главная спальня', hy: 'Yerkrord njasenyak' },
        panoramaUrl: PANORAMA_URLS.bedroom[0],
        orderIndex: 2,
        hotspots: [
          { target_room_id: 'room-living-2', x: 0.4, y: 0.5 },
          { target_room_id: 'room-bathroom-2', x: 0.7, y: 0.48 },
        ],
      },
      {
        id: 'room-bedroom2-2',
        name: { en: 'Second Bedroom', ru: 'Вторая спальня', hy: 'Yerkrord njasenyak' },
        panoramaUrl: PANORAMA_URLS.bedroom[0],
        orderIndex: 3,
        hotspots: [
          { target_room_id: 'room-living-2', x: 0.5, y: 0.5 },
        ],
      },
      {
        id: 'room-bathroom-2',
        name: { en: 'Bathroom', ru: 'Ванная комната', hy: 'Yerkrord njasenyak' },
        panoramaUrl: PANORAMA_URLS.bathroom[0],
        orderIndex: 4,
        hotspots: [
          { target_room_id: 'room-bedroom1-2', x: 0.5, y: 0.5 },
        ],
      },
    ],
  },
  {
    propertyId: '33333333-3333-3333-3333-333333333333',
    rooms: [
      {
        id: 'room-main-3',
        name: { en: 'Main Room', ru: 'Главная комната', hy: 'Yerkrord njasenyak' },
        panoramaUrl: PANORAMA_URLS.living[0],
        orderIndex: 0,
        hotspots: [
          { target_room_id: 'room-kitchen-3', x: 0.3, y: 0.5 },
          { target_room_id: 'room-bathroom-3', x: 0.7, y: 0.48 },
        ],
      },
      {
        id: 'room-kitchen-3',
        name: { en: 'Kitchen Area', ru: 'Кухонная зона', hy: 'Yerkrord njasenyak' },
        panoramaUrl: PANORAMA_URLS.kitchen[0],
        orderIndex: 1,
        hotspots: [
          { target_room_id: 'room-main-3', x: 0.5, y: 0.5 },
        ],
      },
      {
        id: 'room-bathroom-3',
        name: { en: 'Bathroom', ru: 'Ванная', hy: 'Logarran' },
        panoramaUrl: PANORAMA_URLS.bathroom[0],
        orderIndex: 2,
        hotspots: [
          { target_room_id: 'room-main-3', x: 0.5, y: 0.5 },
        ],
      },
    ],
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function generatePropertyImages(index: number): string[] {
  const images: string[] = [];
  // Add a living room image
  images.push(APARTMENT_IMAGES.living[index % APARTMENT_IMAGES.living.length]);
  // Add a bedroom image
  images.push(APARTMENT_IMAGES.bedroom[index % APARTMENT_IMAGES.bedroom.length]);
  // Add a kitchen image
  images.push(APARTMENT_IMAGES.kitchen[index % APARTMENT_IMAGES.kitchen.length]);
  // Add bathroom for larger apartments
  if (index % 2 === 0) {
    images.push(APARTMENT_IMAGES.bathroom[index % APARTMENT_IMAGES.bathroom.length]);
  }
  // Add exterior for some
  if (index % 3 === 0) {
    images.push(APARTMENT_IMAGES.exterior[index % APARTMENT_IMAGES.exterior.length]);
  }
  return images;
}

function generateLegalAnalysis(property: PropertySeedData, developerName: string) {
  const isNewBuilding = property.yearBuilt >= 2015;
  const isVerified = property.matchScore >= 85;

  return {
    developer_verified: isVerified,
    developer_name: developerName,
    claims_count: property.matchScore >= 90 ? 0 : property.matchScore >= 80 ? 0 : 1,
    double_sale_risk: false,
    ownership_status: isVerified ? 'single_owner' : 'pending_verification',
    title_status: isVerified ? 'complete' : 'under_review',
    mortgage_status: 'none',
    encumbrances: false,
    construction_permit: isNewBuilding ? 'verified' : 'not_required',
    registration_date: `${property.yearBuilt}-06-15`,
  };
}

function generateLocationAnalysis(property: PropertySeedData) {
  const isCenter = property.district === 'Kentron';
  const isQuiet = ['Davtashen', 'Nork-Marash', 'Kanaker-Zeytun'].includes(property.district);

  return {
    commute_am: isCenter ? 8 : 15 + Math.floor(Math.random() * 20),
    commute_pm: isCenter ? 12 : 20 + Math.floor(Math.random() * 25),
    highway_distance: isCenter ? 1500 : 500 + Math.floor(Math.random() * 1000),
    noise_level: isCenter ? 'medium' : isQuiet ? 'low' : 'medium',
    ecology_index: isQuiet ? 'good' : isCenter ? 'moderate' : 'good',
    parking_available: property.features.includes('Parking') ? 'yes' : 'limited',
    playgrounds_nearby: `${1 + Math.floor(Math.random() * 3)} within 400m`,
    parks_nearby: isCenter ? 'Lovers Park (350m), Cascade (500m)' : `${property.district} Park (400m)`,
    air_quality_index: isQuiet ? 75 : 85,
    sunlight_hours: 6 + Math.random() * 2,
    walkability_score: isCenter ? 92 : 70 + Math.floor(Math.random() * 20),
    crime_index: isQuiet ? 'very_low' : 'low',
  };
}

function generateInfrastructureAnalysis(property: PropertySeedData) {
  return {
    supermarkets: 3 + Math.floor(Math.random() * 3),
    pharmacies: 2 + Math.floor(Math.random() * 2),
    banks: 2 + Math.floor(Math.random() * 2),
    schools: `School #${Math.floor(Math.random() * 100 + 1)} (${200 + Math.floor(Math.random() * 400)}m)`,
    transport: property.district === 'Kentron' || property.district === 'Arabkir'
      ? `Metro ${300 + Math.floor(Math.random() * 200)}m, Bus 100m`
      : `Bus ${100 + Math.floor(Math.random() * 200)}m, Marshrutka 150m`,
    hospitals: [
      {
        name: property.district === 'Kentron' ? 'Nairi Medical Center' : 'District Hospital',
        distance: 800 + Math.floor(Math.random() * 1500),
        emergency: true,
      },
    ],
    kindergartens: `${1 + Math.floor(Math.random() * 2)} within 500m`,
    gyms: 2 + Math.floor(Math.random() * 3),
  };
}

function generateInvestmentAnalysis(property: PropertySeedData) {
  const isTopLocation = property.district === 'Kentron' || property.district === 'Arabkir';
  const baseScore = property.matchScore;

  return {
    score: Math.min(95, baseScore + Math.floor(Math.random() * 10)),
    price_vs_market: isTopLocation ? 75 + Math.floor(Math.random() * 15) : 65 + Math.floor(Math.random() * 20),
    demand_signals: isTopLocation ? 85 + Math.floor(Math.random() * 10) : 70 + Math.floor(Math.random() * 15),
    roi_estimate: 70 + Math.floor(Math.random() * 20),
    appreciation_forecast: isTopLocation ? 80 + Math.floor(Math.random() * 15) : 65 + Math.floor(Math.random() * 20),
    rental_yield: 6 + Math.random() * 4,
    liquidity_score: isTopLocation ? 85 : 70,
    market_trend: isTopLocation ? 'growing' : 'stable',
    comparable_properties: 5 + Math.floor(Math.random() * 5),
  };
}

function generateNearbyPois(property: PropertySeedData) {
  const isCenter = property.district === 'Kentron';

  return {
    schools: [
      { name: `School #${Math.floor(Math.random() * 200 + 1)}`, distance_m: 200 + Math.floor(Math.random() * 400), walk_time_min: 3 + Math.floor(Math.random() * 5) },
      { name: 'QSI International School', distance_m: 800 + Math.floor(Math.random() * 1000), walk_time_min: 10 + Math.floor(Math.random() * 5) },
    ],
    parks: [
      { name: isCenter ? 'Lovers Park' : `${property.district} Park`, distance_m: 300 + Math.floor(Math.random() * 400), walk_time_min: 4 + Math.floor(Math.random() * 4) },
      { name: 'Victory Park', distance_m: 1000 + Math.floor(Math.random() * 500), walk_time_min: 12 + Math.floor(Math.random() * 5) },
    ],
    metro: isCenter || property.district === 'Arabkir' ? [
      { name: isCenter ? 'Republic Square' : 'Barekamutyun', distance_m: 300 + Math.floor(Math.random() * 300), walk_time_min: 4 + Math.floor(Math.random() * 3) },
    ] : [],
    supermarkets: [
      { name: 'SAS Supermarket', distance_m: 100 + Math.floor(Math.random() * 200), walk_time_min: 2, rating: 4.2 },
      { name: 'Yerevan City', distance_m: 300 + Math.floor(Math.random() * 200), walk_time_min: 4, rating: 4.5 },
    ],
  };
}

// ============================================
// TIME SLOTS GENERATION
// ============================================

const TIME_SLOTS = ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '18:30'];

function generateViewingSlots(propertyId: string): { property_id: string; date: Date; time: string; available: boolean }[] {
  const slots: { property_id: string; date: Date; time: string; available: boolean }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);

    // Skip Sundays (day 0 in JavaScript)
    if (date.getDay() === 0) continue;

    for (const time of TIME_SLOTS) {
      slots.push({
        property_id: propertyId,
        date,
        time,
        available: Math.random() > 0.15, // 85% available
      });
    }
  }

  return slots;
}

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function main() {
  console.log('===========================================');
  console.log('Starting Homy Database Seed');
  console.log('===========================================\n');

  // ============================================
  // SEED ADMIN USER
  // ============================================
  console.log('Creating/updating admin user...');

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@homy.am' },
    update: {
      role: 'admin',
      emailVerified: true,
      first_name: 'Admin',
      last_name: 'Homy',
    },
    create: {
      email: 'admin@homy.am',
      passwordHash: '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu.1u', // "admin123" hashed with bcrypt
      role: 'admin',
      emailVerified: true,
      user_type: 'admin',
      language_preference: 'en',
      notifications_enabled: true,
      first_name: 'Admin',
      last_name: 'Homy',
    },
  });

  console.log(`  Admin user created/updated: ${adminUser.email} (role: admin)\n`);

  // ============================================
  // SEED OWNER / AGENT USERS (real accounts so listings have an owner)
  // ============================================
  console.log('Creating owner/agent users from contacts...');
  const DEFAULT_PW = '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu.1u'; // "admin123"
  const slug = (name: string) =>
    name.toLowerCase().replace(/[^a-z\s]/g, '').trim().replace(/\s+/g, '.');
  const contactUserIds: string[] = [];
  for (const c of CONTACTS) {
    const [first, ...rest] = c.name.split(' ');
    const last = rest.join(' ') || first;
    const email = `${slug(c.name)}@homy.am`;
    const u = await prisma.user.upsert({
      where: { email },
      update: { user_type: c.type, first_name: first, last_name: last, emailVerified: true },
      create: {
        email,
        passwordHash: DEFAULT_PW,
        role: 'user',
        emailVerified: true,
        user_type: c.type, // agent | owner
        language_preference: 'en',
        notifications_enabled: true,
        first_name: first,
        last_name: last,
        phone: c.phone,
      },
    });
    contactUserIds.push(u.id);
  }
  console.log(`  Created/updated ${contactUserIds.length} owner/agent users.\n`);

  // Clear existing data in correct order (respecting foreign keys)
  console.log('Clearing existing data...');
  await prisma.virtualTourRoom.deleteMany({});
  await prisma.viewingSlot.deleteMany({});
  await prisma.viewing.deleteMany({});
  await prisma.favorite.deleteMany({});
  await prisma.property.deleteMany({});
  await prisma.platformMetric.deleteMany({});
  console.log('Existing data cleared.\n');

  // ============================================
  // SEED PROPERTIES
  // ============================================
  console.log('Creating 10 properties...');

  for (let i = 0; i < PROPERTIES.length; i++) {
    const prop = PROPERTIES[i];
    const contact = CONTACTS[i % CONTACTS.length];
    const ownerUserId = contactUserIds[i % CONTACTS.length];
    const developer = DEVELOPERS[i % DEVELOPERS.length];
    const images = generatePropertyImages(i);

    const propertyData: Prisma.PropertyCreateInput = {
      id: prop.id,
      owner: { connect: { id: ownerUserId } },
      title: JSON.stringify(prop.title), // Store as JSON string for localization
      address: prop.address,
      province: 'yerevan', // все сид-объекты — Ереван
      city: 'yerevan',
      district: prop.district, // район Еревана
      neighborhood: JSON.stringify(prop.neighborhood),
      price: new Prisma.Decimal(prop.price),
      currency: 'AMD',
      rooms: prop.rooms,
      bedrooms: prop.bedrooms,
      bathrooms: prop.bathrooms,
      area: new Prisma.Decimal(prop.sizeSqm),
      sizeSqm: new Prisma.Decimal(prop.sizeSqm),
      floor: prop.floor,
      totalFloors: prop.totalFloors,
      yearBuilt: prop.yearBuilt,
      buildingType: prop.buildingType,
      condition: prop.yearBuilt >= 2015 ? 'new' : prop.yearBuilt >= 2005 ? 'good' : 'renovation',
      description: `${prop.title.en}. Located in ${prop.neighborhood.en}, ${prop.district}. ${prop.rooms} rooms, ${prop.sizeSqm} sqm.`,
      features: prop.features,
      images: images,
      imageUrl: images[0],
      latitude: new Prisma.Decimal(prop.latitude),
      longitude: new Prisma.Decimal(prop.longitude),
      matchScore: prop.matchScore,
      isTopChoice: prop.isTopChoice,
      recommendationReasons: prop.recommendationReasons,
      warning: prop.warning,
      utilitiesEstimate: new Prisma.Decimal(25000 + Math.floor(Math.random() * 20000)),
      depositMonths: 1 + Math.floor(Math.random() * 2),
      minimumLeaseMonths: 6 + Math.floor(Math.random() * 6),
      petsAllowed: Math.random() > 0.5,
      hasParking: prop.features.includes('Parking'),
      hasBalcony: prop.features.includes('Balcony') || prop.features.includes('Terrace'),
      propertyType: 'apartment',
      dealType: prop.dealType,
      contact: contact as unknown as Prisma.InputJsonValue,
      nearbyPois: generateNearbyPois(prop) as unknown as Prisma.InputJsonValue,
      available: true,
      verified: contact.verified,
      legal_analysis: generateLegalAnalysis(prop, developer) as unknown as Prisma.InputJsonValue,
      location_analysis: generateLocationAnalysis(prop) as unknown as Prisma.InputJsonValue,
      infrastructure_analysis: generateInfrastructureAnalysis(prop) as unknown as Prisma.InputJsonValue,
      investment_analysis: generateInvestmentAnalysis(prop) as unknown as Prisma.InputJsonValue,
      virtual_tour_enabled: prop.hasVirtualTour,
    };

    await prisma.property.upsert({
      where: { id: prop.id },
      update: propertyData,
      create: propertyData,
    });

    console.log(`  Created property: ${prop.title.en} (${prop.district})`);
  }

  console.log('\nAll 10 properties created successfully.\n');

  // ============================================
  // SEED VIRTUAL TOURS
  // ============================================
  console.log('Creating virtual tours for 3 properties...');

  for (const tour of VIRTUAL_TOURS) {
    // Delete existing rooms for this property first
    await prisma.virtualTourRoom.deleteMany({
      where: { property_id: tour.propertyId },
    });

    for (const room of tour.rooms) {
      await prisma.virtualTourRoom.create({
        data: {
          id: room.id,
          property_id: tour.propertyId,
          name_en: room.name.en,
          name_ru: room.name.ru,
          name_hy: room.name.hy,
          panorama_url: room.panoramaUrl,
          order_index: room.orderIndex,
          hotspots: room.hotspots as unknown as Prisma.InputJsonValue,
        },
      });
    }

    console.log(`  Created ${tour.rooms.length} rooms for property ${tour.propertyId.substring(0, 8)}...`);
  }

  console.log('\nVirtual tours created successfully.\n');

  // ============================================
  // SEED VIEWING SLOTS
  // ============================================
  console.log('Creating viewing slots for all properties (next 14 days)...');

  let totalSlots = 0;

  for (const prop of PROPERTIES) {
    // Delete existing slots for this property
    await prisma.viewingSlot.deleteMany({
      where: { property_id: prop.id },
    });

    const slots = generateViewingSlots(prop.id);

    await prisma.viewingSlot.createMany({
      data: slots,
    });

    totalSlots += slots.length;
  }

  console.log(`  Created ${totalSlots} viewing slots across all properties.\n`);

  // ============================================
  // SEED PLATFORM METRICS
  // ============================================
  console.log('Creating platform metrics...');

  // Platform metrics uses auto-generated UUID, so we just create/update
  const existingMetric = await prisma.platformMetric.findFirst();

  if (existingMetric) {
    await prisma.platformMetric.update({
      where: { id: existingMetric.id },
      data: {
        propertiesCount: PROPERTIES.length,
        citiesCount: 1,
        dealsCount: 45,
      },
    });
  } else {
    await prisma.platformMetric.create({
      data: {
        propertiesCount: PROPERTIES.length,
        citiesCount: 1,
        dealsCount: 45,
      },
    });
  }

  console.log('Platform metrics created.\n');

  // ============================================
  // VERIFICATION
  // ============================================
  console.log('===========================================');
  console.log('Seed Verification');
  console.log('===========================================\n');

  const propertyCount = await prisma.property.count();
  const topChoiceCount = await prisma.property.count({ where: { isTopChoice: true } });
  const virtualTourCount = await prisma.property.count({ where: { virtual_tour_enabled: true } });
  const virtualTourRoomCount = await prisma.virtualTourRoom.count();
  const viewingSlotCount = await prisma.viewingSlot.count();

  console.log(`Properties created: ${propertyCount}`);
  console.log(`Top choice properties: ${topChoiceCount}`);
  console.log(`Properties with virtual tours: ${virtualTourCount}`);
  console.log(`Virtual tour rooms: ${virtualTourRoomCount}`);
  console.log(`Viewing slots: ${viewingSlotCount}`);

  // List properties by district
  const byDistrict = await prisma.property.groupBy({
    by: ['district'],
    _count: true,
  });

  console.log('\nProperties by district:');
  for (const item of byDistrict) {
    console.log(`  ${item.district}: ${item._count}`);
  }

  // List match scores
  const properties = await prisma.property.findMany({
    select: { title: true, matchScore: true, isTopChoice: true, district: true },
    orderBy: { matchScore: 'desc' },
  });

  console.log('\nMatch scores:');
  for (const p of properties) {
    const title = typeof p.title === 'string' && p.title.startsWith('{')
      ? JSON.parse(p.title).en
      : p.title;
    console.log(`  ${p.matchScore}% - ${title}${p.isTopChoice ? ' (TOP CHOICE)' : ''}`);
  }

  console.log('\n===========================================');
  console.log('Seed completed successfully!');
  console.log('===========================================\n');
}

main()
  .catch((error) => {
    console.error('Seed error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
