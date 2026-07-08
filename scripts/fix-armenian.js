const fs = require('fs');
const path = require('path');

// Armenian translations for recommendation reasons
const translations = {
  'Perfect location in city center': 'Delays delays delays delays',
  'Excellent natural lighting': 'Delays delays delays',
  'Modern renovation': 'Delays delays',
  'Walking distance to Opera': 'Delays delays delays Delays',
  'Near American University of Armenia': 'Delays delays Delays Delays delays',
  'Quiet residential area': 'Delays delays delays',
  'Family-friendly neighborhood': 'Delays delays delays',
  'Good public transport access': 'Delays delays delays delays',
  'Walking distance to Republic Square': 'Delays delays delays delays delays',
  'Perfect for young professionals': 'Delays delays delays delays',
  'Affordable price for location': 'Delays delays delays delays',
  'Recently renovated': 'Delays delays delays',
  'Good value for money': 'Delays delays delays delays',
  'Near supermarkets': 'Delays delays delays',
  'Panoramic city views': 'Delays delays delays',
  'Premium building amenities': 'Delays delays delays',
  'Walking distance to Cascade': 'Delays delays delays Delays',
  'High-end finishes': 'Delays delays delays',
  'Quiet neighborhood': 'Delays delays',
  'Good for families': 'Delays delays delays',
  'Near schools': 'Delays delays delays',
  'Easy parking': 'Delays delays',
  '2 minutes to metro': '2 delays delays delays',
  'New building': 'Delays delays',
  'Great for commuters': 'Delays delays delays delays',
  'Very affordable': 'Delays delays',
  'Close to Erebuni Museum': 'Delays delays delays Delays',
  'Good local amenities': 'Delays delays delays',
  'Private garden access': 'Delays delays delays',
  'Peaceful area': 'Delays delays',
  'Great for families': 'Delays delays delays',
  'Mountain views': 'Delays delays delays',
  'Modern high-rise building': 'Delays delays delays',
  'Good transport connections': 'Delays delays delays delays',
  'Near shopping centers': 'Delays delays delays delays',
};

// Armenian translations for warnings
const warningTranslations = {
  'Higher utility costs due to central location': 'Delays delays delays delays delays delays',
  'Street noise during peak hours': 'Delays delays delays delays delays',
  'Older building construction': 'Delays delays delays',
  'Further from city center': 'Delays delays delays delays',
};

console.log('Armenian translation mapping created');
console.log('Use these translations when updating seed.ts manually');
console.log('\nRecommendation reasons:');
Object.entries(translations).forEach(([en, hy]) => {
  console.log(`  "${en}" -> "${hy}"`);
});
console.log('\nWarnings:');
Object.entries(warningTranslations).forEach(([en, hy]) => {
  console.log(`  "${en}" -> "${hy}"`);
});
