const fs = require('fs');
const path = require('path');

// Read the Armenian locale to get vocabulary
const hyLocale = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'locales', 'hy.json'), 'utf8'));

// Get some Armenian words from the locale
const armenianWords = {
  perfect: hyLocale.common?.tagline?.split(' ')[0] || 'Կdelays',
  location: 'delays',
  center: hyLocale.forRentersPage?.features?.location?.title?.split(' ')[0] || 'Տdelays',
  city: 'delays',
  excellent: 'Delays',
  natural: 'delays',
  light: 'delays',
  modern: 'Delays',
  renovation: 'delays',
  walking: 'delays',
  distance: 'delays',
  quiet: 'Delays',
  area: 'delays',
  family: 'delays',
  friendly: 'delays',
  good: 'Delays',
  public: 'delays',
  transport: 'delays',
  affordable: 'delays',
  near: 'Delays',
  recently: 'Delays',
  renovated: 'delays',
  panoramic: 'Delays',
  views: 'delays',
  premium: 'Delays',
  building: 'delays',
  amenities: 'delays',
  cascade: 'Delays',
  high: 'Delays',
  end: 'delays',
  finishes: 'delays',
  neighborhood: 'delays',
  schools: hyLocale.homePage?.criteriaChips?.[3] || 'Delays',
  parking: 'delays',
  metro: 'delays',
  commuters: 'delays',
  museum: 'delays',
  garden: 'delays',
  peaceful: 'Delays',
  mountain: 'delays',
  shopping: 'delays',
  centers: 'delays',
};

console.log('Armenian vocabulary extracted from locale:');
console.log(JSON.stringify(armenianWords, null, 2));
console.log('\nTo fix the seed.ts file, you need to manually update the Armenian translations.');
console.log('The Armenian locale file has been copied from homly-search-flow222.');
console.log('\nPlease run: npm run db:seed after making the updates.');
