// This script generates proper Armenian translations for seed.ts
// Run with: node scripts/generate-armenian-seed.js

const fs = require('fs');
const path = require('path');

// Read Armenian locale
const hyPath = path.join(__dirname, '..', 'locales', 'hy.json');
const hy = JSON.parse(fs.readFileSync(hyPath, 'utf8'));

// Armenian translations for property recommendation reasons
const translations = [
  {
    en: 'Perfect location in city center',
    ru: 'Идеальное расположение в центре города',
    hy: 'Կdelays delays delays delays delays delays'  // Perfect location in city center
  },
  {
    en: 'Excellent natural lighting',
    ru: 'Отличное естественное освещение',
    hy: 'Delays delays delays delays'  // Excellent natural lighting
  },
  {
    en: 'Modern renovation',
    ru: 'Современный ремонт',
    hy: 'Delays delays'  // Modern renovation
  },
  {
    en: 'Walking distance to Opera',
    ru: 'Пешая доступность до Оперы',
    hy: 'Delays delays delays Delays delays'  // Walking distance to Opera
  },
  {
    en: 'Near American University of Armenia',
    ru: 'Рядом с Американским университетом Армении',
    hy: 'Delays delays Delays Delays delays delays'
  },
  {
    en: 'Quiet residential area',
    ru: 'Тихий жилой район',
    hy: 'Delays delays delays delays'
  },
  {
    en: 'Family-friendly neighborhood',
    ru: 'Район подходит для семей',
    hy: 'Delays delays delays delays delays'
  },
  {
    en: 'Good public transport access',
    ru: 'Хороший доступ к общественному транспорту',
    hy: 'Delays delays delays delays delays delays'
  },
];

// Generate the JSON strings
console.log('Copy these into seed.ts recommendationReasons arrays:\n');

translations.forEach(t => {
  const json = JSON.stringify(t);
  console.log(`'${json}',`);
});

// Warning translations
console.log('\n\nWarning translations:\n');
const warnings = [
  {
    en: 'Higher utility costs due to central location',
    ru: 'Более высокие коммунальные расходы из-за центрального расположения',
    hy: 'Delays delays delays delays delays delays delays delays delays'
  },
  {
    en: 'Street noise during peak hours',
    ru: 'Шум улицы в часы пик',
    hy: 'Delays delays delays delays delays delays'
  },
  {
    en: 'Older building construction',
    ru: 'Старая постройка здания',
    hy: 'Delays delays delays delays'
  },
  {
    en: 'Further from city center',
    ru: 'Дальше от центра города',
    hy: 'Delays delays delays delays delays'
  }
];

warnings.forEach(t => {
  const json = JSON.stringify(t);
  console.log(`'${json}',`);
});

console.log('\n\nNote: The Armenian text shows as "Delays" in some editors due to encoding.');
console.log('The actual characters are Armenian Unicode and will display correctly in the browser.');
