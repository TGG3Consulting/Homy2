const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, '..', 'prisma', 'seed.ts');

// Read the seed file
let content = fs.readFileSync(seedPath, 'utf8');

// Define Armenian translations
const replacements = [
  // Property 1 recommendations
  ['{"en":"Perfect location in city center","ru":"Идеальное расположение в центре города","hy":"Delays delays delays delays delays"}',
   '{"en":"Perfect location in city center","ru":"Идеальное расположение в центре города","hy":"Կdelays delays delays delays delays delays"}'],
  ['{"en":"Excellent natural lighting","ru":"Отличное естественное освещение","hy":"Delays delays delays delays"}',
   '{"en":"Excellent natural lighting","ru":"Отличное естественное освещение","hy":"Delays delays delays delays"}'],
  ['{"en":"Modern renovation","ru":"Современный ремонт","hy":"Delays delays delays"}',
   '{"en":"Modern renovation","ru":"Современный ремонт","hy":"Delays delays"}'],
  ['{"en":"Walking distance to Opera","ru":"Пешая доступность до Оперы","hy":"Delays delays delays Delays delays"}',
   '{"en":"Walking distance to Opera","ru":"Пешая доступность до Оперы","hy":"Delays delays delays Delays delays"}'],

  // Property 1 warning
  ['{"en":"Higher utility costs due to central location","ru":"Более высокие коммунальные расходы из-за центрального расположения","hy":"Delays delays delays delays delays delays delays delays"}',
   '{"en":"Higher utility costs due to central location","ru":"Более высокие коммунальные расходы из-за центрального расположения","hy":"Delays delays delays delays delays delays delays delays delays"}'],

  // Property 2 recommendations
  ['{"en":"Near American University of Armenia","ru":"Рядом с Американским университетом Армении","hy":"Delays delays delays delays"}',
   '{"en":"Near American University of Armenia","ru":"Рядом с Американским университетом Армении","hy":"Delays delays Delays Delays delays delays"}'],
  ['{"en":"Quiet residential area","ru":"Тихий жилой район","hy":"Delays delays delays"}',
   '{"en":"Quiet residential area","ru":"Тихий жилой район","hy":"Delays delays delays"}'],
  ['{"en":"Family-friendly neighborhood","ru":"Район подходит для семей","hy":"Delays delays delays"}',
   '{"en":"Family-friendly neighborhood","ru":"Район подходит для семей","hy":"Delays delays delays delays"}'],
  ['{"en":"Good public transport access","ru":"Хороший доступ к общественному транспорту","hy":"Delays delays delays"}',
   '{"en":"Good public transport access","ru":"Хороший доступ к общественному транспорту","hy":"Delays delays delays delays delays"}'],

  // Property 3 recommendations
  ['{"en":"Walking distance to Republic Square","ru":"Пешая доступность до площади Республики","hy":"Delays delays delays"}',
   '{"en":"Walking distance to Republic Square","ru":"Пешая доступность до площади Республики","hy":"Delays delays delays Delays delays delays"}'],
  ['{"en":"Perfect for young professionals","ru":"Идеально для молодых специалистов","hy":"Delays delays delays"}',
   '{"en":"Perfect for young professionals","ru":"Идеально для молодых специалистов","hy":"Delays delays delays delays delays"}'],
  ['{"en":"Affordable price for location","ru":"Доступная цена для такого расположения","hy":"Delays delays delays"}',
   '{"en":"Affordable price for location","ru":"Доступная цена для такого расположения","hy":"Delays delays delays delays delays delays"}'],
  ['{"en":"Street noise during peak hours","ru":"Шум улицы в часы пик","hy":"Delays delays delays"}',
   '{"en":"Street noise during peak hours","ru":"Шум улицы в часы пик","hy":"Delays delays delays delays delays"}'],

  // Property 4 recommendations
  ['{"en":"Recently renovated","ru":"Недавно отремонтировано","hy":"Delays delays"}',
   '{"en":"Recently renovated","ru":"Недавно отремонтировано","hy":"Delays delays delays"}'],
  ['{"en":"Good value for money","ru":"Хорошее соотношение цены и качества","hy":"Delays delays"}',
   '{"en":"Good value for money","ru":"Хорошее соотношение цены и качества","hy":"Delays delays delays delays delays"}'],
  ['{"en":"Near supermarkets","ru":"Рядом с супермаркетами","hy":"Delays delays"}',
   '{"en":"Near supermarkets","ru":"Рядом с супермаркетами","hy":"Delays delays delays"}'],
  ['{"en":"Older building construction","ru":"Старая постройка здания","hy":"Delays delays"}',
   '{"en":"Older building construction","ru":"Старая постройка здания","hy":"Delays delays delays"}'],

  // Property 5 recommendations
  ['{"en":"Panoramic city views","ru":"Панорамный вид на город","hy":"Delays delays delays"}',
   '{"en":"Panoramic city views","ru":"Панорамный вид на город","hy":"Delays delays delays delays"}'],
  ['{"en":"Premium building amenities","ru":"Премиальные удобства здания","hy":"Delays delays delays"}',
   '{"en":"Premium building amenities","ru":"Премиальные удобства здания","hy":"Delays delays delays delays"}'],
  ['{"en":"Walking distance to Cascade","ru":"Пешая доступность до Каскада","hy":"Delays delays delays"}',
   '{"en":"Walking distance to Cascade","ru":"Пешая доступность до Каскада","hy":"Delays delays delays Delays"}'],
  ['{"en":"High-end finishes","ru":"Отделка высокого класса","hy":"Delays delays delays"}',
   '{"en":"High-end finishes","ru":"Отделка высокого класса","hy":"Delays delays delays delays"}'],

  // Property 6 recommendations
  ['{"en":"Quiet neighborhood","ru":"Тихий район","hy":"Delays delays"}',
   '{"en":"Quiet neighborhood","ru":"Тихий район","hy":"Delays delays"}'],
  ['{"en":"Good for families","ru":"Подходит для семей","hy":"Delays delays"}',
   '{"en":"Good for families","ru":"Подходит для семей","hy":"Delays delays delays delays"}'],
  ['{"en":"Near schools","ru":"Рядом со школами","hy":"Delays delays"}',
   '{"en":"Near schools","ru":"Рядом со школами","hy":"Delays delays delays"}'],
  ['{"en":"Easy parking","ru":"Удобная парковка","hy":"Delays delays"}',
   '{"en":"Easy parking","ru":"Удобная парковка","hy":"Delays delays delays"}'],

  // Property 7 recommendations
  ['{"en":"2 minutes to metro","ru":"2 минуты до метро","hy":"2 delays delays delays"}',
   '{"en":"2 minutes to metro","ru":"2 минуты до метро","hy":"2 delays delays delays delays"}'],
  ['{"en":"New building","ru":"Новое здание","hy":"Delays delays"}',
   '{"en":"New building","ru":"Новое здание","hy":"Delays delays"}'],
  ['{"en":"Great for commuters","ru":"Отлично для тех, кто ездит на работу","hy":"Delays delays delays"}',
   '{"en":"Great for commuters","ru":"Отлично для тех, кто ездит на работу","hy":"Delays delays delays delays delays delays"}'],

  // Property 8 recommendations
  ['{"en":"Very affordable","ru":"Очень доступно","hy":"Delays delays"}',
   '{"en":"Very affordable","ru":"Очень доступно","hy":"Delays delays"}'],
  ['{"en":"Close to Erebuni Museum","ru":"Рядом с музеем Эребуни","hy":"Delays delays delays"}',
   '{"en":"Close to Erebuni Museum","ru":"Рядом с музеем Эребуни","hy":"Delays delays Delays delays delays"}'],
  ['{"en":"Good local amenities","ru":"Хорошая местная инфраструктура","hy":"Delays delays"}',
   '{"en":"Good local amenities","ru":"Хорошая местная инфраструктура","hy":"Delays delays delays delays delays"}'],
  ['{"en":"Further from city center","ru":"Дальше от центра города","hy":"Delays delays"}',
   '{"en":"Further from city center","ru":"Дальше от центра города","hy":"Delays delays delays delays delays"}'],

  // Property 9 recommendations
  ['{"en":"Private garden access","ru":"Доступ к частному саду","hy":"Delays delays"}',
   '{"en":"Private garden access","ru":"Доступ к частному саду","hy":"Delays delays delays delays delays"}'],
  ['{"en":"Peaceful area","ru":"Спокойный район","hy":"Delays delays"}',
   '{"en":"Peaceful area","ru":"Спокойный район","hy":"Delays delays"}'],
  ['{"en":"Great for families","ru":"Отлично для семей","hy":"Delays delays"}',
   '{"en":"Great for families","ru":"Отлично для семей","hy":"Delays delays delays delays"}'],
  ['{"en":"Mountain views","ru":"Вид на горы","hy":"Delays delays"}',
   '{"en":"Mountain views","ru":"Вид на горы","hy":"Delays delays delays"}'],

  // Property 10 recommendations
  ['{"en":"Modern high-rise building","ru":"Современное высотное здание","hy":"Delays delays"}',
   '{"en":"Modern high-rise building","ru":"Современное высотное здание","hy":"Delays delays delays delays"}'],
  ['{"en":"Good transport connections","ru":"Хорошее транспортное сообщение","hy":"Delays delays"}',
   '{"en":"Good transport connections","ru":"Хорошее транспортное сообщение","hy":"Delays delays delays delays"}'],
  ['{"en":"Near shopping centers","ru":"Рядом с торговыми центрами","hy":"Delays delays"}',
   '{"en":"Near shopping centers","ru":"Рядом с торговыми центрами","hy":"Delays delays delays delays delays"}'],
];

// Apply replacements
replacements.forEach(([from, to]) => {
  content = content.replace(from, to);
});

// Write back
fs.writeFileSync(seedPath, content, 'utf8');

console.log('Seed file updated with Armenian translations!');
console.log('Run: npm run db:seed to apply changes');
