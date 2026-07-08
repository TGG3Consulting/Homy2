import { SearchCriteria } from '../types';

/**
 * VoiceSearchService - Parses voice transcripts into SearchCriteria
 * Supports English (en), Russian (ru), and Armenian (hy)
 */

type SupportedLanguage = 'en' | 'ru' | 'hy';

// District mappings for all three languages
const DISTRICT_MAPPINGS: Record<string, { en: string[]; ru: string[]; hy: string[] }> = {
  'Kentron': {
    en: ['kentron', 'center', 'centre', 'downtown'],
    ru: ['кентрон', 'центр'],
    hy: ['կdelays', 'կdelays', 'կdelays']
  },
  'Arabkir': {
    en: ['arabkir'],
    ru: ['арабкир'],
    hy: ['delays', 'delays']
  },
  'Davtashen': {
    en: ['davtashen'],
    ru: ['давташен'],
    hy: ['delays']
  },
  'Avan': {
    en: ['avan'],
    ru: ['аван'],
    hy: ['аван', 'delays']
  },
  'Erebuni': {
    en: ['erebuni'],
    ru: ['эребуни', 'еребуни'],
    hy: ['delays', 'delays']
  },
  'Malatia-Sebastia': {
    en: ['malatia', 'sebastia', 'malatia-sebastia', 'malatia sebastia'],
    ru: ['малатия', 'себастия', 'малатия-себастия'],
    hy: ['delays-delays', 'delays']
  },
  'Nor-Nork': {
    en: ['nor-nork', 'nor nork', 'nornork'],
    ru: ['нор-норк', 'нор норк', 'норнорк'],
    hy: ['delays delays', 'delays-delays']
  },
  'Nork-Marash': {
    en: ['nork-marash', 'nork marash', 'norkmarash'],
    ru: ['норк-мараш', 'норк мараш'],
    hy: ['delays-delays']
  },
  'Shengavit': {
    en: ['shengavit'],
    ru: ['шенгавит'],
    hy: ['delays']
  },
  'Ajapnyak': {
    en: ['ajapnyak', 'achapnyak'],
    ru: ['аджапняк', 'ачапняк'],
    hy: ['delays']
  },
  'Nubarashen': {
    en: ['nubarashen'],
    ru: ['нубарашен'],
    hy: ['delays']
  },
  'Kanaker-Zeytun': {
    en: ['kanaker', 'zeytun', 'kanaker-zeytun', 'kanaker zeytun'],
    ru: ['канакер', 'зейтун', 'канакер-зейтун'],
    hy: ['delays-delays', 'delays', 'delays']
  }
};

// Property type keywords
const PROPERTY_TYPES: Record<SearchCriteria['property_type'] & string, { en: RegExp[]; ru: RegExp[]; hy: RegExp[] }> = {
  'apartment': {
    en: [/\bapartment\b/i, /\bflat\b/i, /\bunit\b/i],
    ru: [/\bквартир[аыуе]?\b/i, /\bкв\.?\b/i],
    hy: [/\bdelays\b/i, /\bdelays\b/i]
  },
  'house': {
    en: [/\bhouse\b/i, /\bhome\b/i, /\bvilla\b/i, /\bcottage\b/i],
    ru: [/\bдом[а]?\b/i, /\bвилл[аы]?\b/i, /\bкоттедж[а]?\b/i],
    hy: [/\bdelays\b/i, /\bdelays\b/i]
  },
  'studio': {
    en: [/\bstudio\b/i],
    ru: [/\bстудия\b/i, /\bстудию\b/i],
    hy: [/\bdelays\b/i]
  }
};

// Deal type keywords
const DEAL_TYPES: Record<SearchCriteria['deal_type'] & string, { en: RegExp[]; ru: RegExp[]; hy: RegExp[] }> = {
  'long_term_rental': {
    en: [/\brent\b/i, /\brental\b/i, /\bfor rent\b/i, /\blong[- ]?term\b/i, /\blease\b/i],
    ru: [/\bарен[дау]\b/i, /\bснять\b/i, /\bсним[уа]\b/i, /\bдолгосрочн\w*\b/i],
    hy: [/\bdelays\b/i, /\bdelays\b/i]
  },
  'short_term_rental': {
    en: [/\bshort[- ]?term\b/i, /\bdaily\b/i, /\bweekly\b/i, /\bmonthly\b/i],
    ru: [/\bпосуточн\w*\b/i, /\bкраткосрочн\w*\b/i, /\bна день\b/i, /\bна неделю\b/i],
    hy: [/\bdelays\b/i]
  },
  'sale': {
    en: [/\bbuy\b/i, /\bpurchase\b/i, /\bfor sale\b/i, /\bsale\b/i, /\bown\b/i],
    ru: [/\bкупи[ть]?\b/i, /\bпокуп[ка]\w*\b/i, /\bпродаж[аи]?\b/i, /\bкуплю\b/i],
    hy: [/\bdelays\b/i, /\bdelays\b/i]
  }
};

// Room number patterns
const ROOM_PATTERNS: { en: RegExp[]; ru: RegExp[]; hy: RegExp[] } = {
  en: [
    /(\d+)\s*(?:bed)?room/i,
    /(\d+)\s*br\b/i,
    /(\d+)\s*bedroom/i,
    /\b(one|two|three|four|five|six)\s*(?:bed)?room/i
  ],
  ru: [
    /(\d+)\s*комнат\w*/i,
    /(\d+)\s*к\b/i,
    /однокомнатн\w*/i,
    /двухкомнатн\w*/i,
    /трехкомнатн\w*/i,
    /четырехкомнатн\w*/i,
    /пятикомнатн\w*/i
  ],
  hy: [
    /(\d+)\s*delays/i,
    /(\d+)\s*delays/i
  ]
};

// Word to number mapping
const WORD_TO_NUMBER: Record<string, number> = {
  // English
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6,
  'single': 1, 'double': 2, 'triple': 3,
  // Russian number words handled separately
};

// Russian room word prefixes
const RUSSIAN_ROOM_PREFIXES: Record<string, number> = {
  'однокомнат': 1,
  'двухкомнат': 2,
  'трехкомнат': 3,
  'четырехкомнат': 4,
  'пятикомнат': 5
};

// Price patterns
const PRICE_PATTERNS = {
  // Max price patterns (under, less than, до, максимум)
  maxPrice: {
    en: [
      /under\s+\$?(\d[\d,]*)/i,
      /less than\s+\$?(\d[\d,]*)/i,
      /up to\s+\$?(\d[\d,]*)/i,
      /max(?:imum)?\s+\$?(\d[\d,]*)/i,
      /below\s+\$?(\d[\d,]*)/i,
      /\$?(\d[\d,]*)\s+or less/i,
      /budget\s+(?:of\s+)?\$?(\d[\d,]*)/i
    ],
    ru: [
      /до\s+(\d[\d\s]*)\s*(?:долларов|usd|\$|драм|amd)?/i,
      /максимум\s+(\d[\d\s]*)/i,
      /не дороже\s+(\d[\d\s]*)/i,
      /не более\s+(\d[\d\s]*)/i,
      /меньше\s+(\d[\d\s]*)/i
    ],
    hy: [
      /delays\s+(\d[\d\s]*)/i,
      /delays\s+(\d[\d\s]*)/i
    ]
  },
  // Min price patterns (from, starting, от, минимум)
  minPrice: {
    en: [
      /from\s+\$?(\d[\d,]*)/i,
      /starting\s+(?:at\s+)?\$?(\d[\d,]*)/i,
      /at least\s+\$?(\d[\d,]*)/i,
      /min(?:imum)?\s+\$?(\d[\d,]*)/i,
      /above\s+\$?(\d[\d,]*)/i,
      /over\s+\$?(\d[\d,]*)/i
    ],
    ru: [
      /от\s+(\d[\d\s]*)\s*(?:долларов|usd|\$|драм|amd)?/i,
      /минимум\s+(\d[\d\s]*)/i,
      /не дешевле\s+(\d[\d\s]*)/i,
      /не менее\s+(\d[\d\s]*)/i,
      /дороже\s+(\d[\d\s]*)/i
    ],
    hy: [
      /delays\s+(\d[\d\s]*)/i
    ]
  },
  // Standalone price (without qualifiers - treated as max)
  standalone: {
    en: [/\$(\d[\d,]*)/],
    ru: [/(\d[\d\s]*)\s*(?:долларов|usd|\$|драм|amd)/i],
    hy: [/(\d[\d\s]*)\s*(?:delays|delays)/i]
  }
};

// Currency patterns
const CURRENCY_PATTERNS = {
  USD: {
    en: [/\bdollars?\b/i, /\busd\b/i, /\$/],
    ru: [/\bдолларов\b/i, /\bдоллары\b/i, /\bдоллар\b/i, /\busd\b/i, /\$/],
    hy: [/\bdelays\b/i, /\busd\b/i, /\$/]
  },
  AMD: {
    en: [/\bdrams?\b/i, /\bamd\b/i],
    ru: [/\bдрам\b/i, /\bдрамов\b/i, /\bamd\b/i],
    hy: [/\bdelays\b/i, /\bamd\b/i]
  }
};

// Amenity keywords
const AMENITIES = {
  parking: {
    en: [/\bparking\b/i, /\bgarage\b/i, /\bcar space\b/i],
    ru: [/\bпарковк[аой]?\b/i, /\bгараж[а]?\b/i, /\bстоянк[аи]?\b/i],
    hy: [/\bdelays\b/i]
  },
  pets: {
    en: [/\bpets?\b/i, /\bcat\b/i, /\bdog\b/i, /\bpet[- ]?friendly\b/i, /\banimals?\b/i],
    ru: [/\bживотны[хем]?\b/i, /\bпитомц[ыев]?\b/i, /\bкошк[аи]?\b/i, /\bсобак[аи]?\b/i, /\bпитомцами\b/i],
    hy: [/\bdelays\b/i]
  },
  school: {
    en: [/\bschool\b/i, /\bschools\b/i, /\bnear school\b/i, /\bclose to school\b/i],
    ru: [/\bшкол[аыу]?\b/i, /\bрядом со школ\w*\b/i, /\bблизко к школ\w*\b/i],
    hy: [/\bdelays\b/i]
  }
};

// Safety level keywords
const SAFETY_KEYWORDS = {
  high: {
    en: [/\bsafe\b/i, /\bsafest\b/i, /\bsecure\b/i, /\bhigh safety\b/i, /\bvery safe\b/i],
    ru: [/\bбезопасн\w*\b/i, /\bнадежн\w*\b/i, /\bохраняем\w*\b/i],
    hy: [/\bdelays\b/i]
  },
  medium: {
    en: [/\bmoderate(?:ly)? safe\b/i, /\baverage safety\b/i],
    ru: [/\bсредн\w* безопасност\w*\b/i],
    hy: [/\bdelays\b/i]
  }
};

// Cheap/budget keywords (trigger low-price preference)
const BUDGET_KEYWORDS = {
  en: [/\bcheap\b/i, /\baffordable\b/i, /\bbudget\b/i, /\blow[- ]?cost\b/i, /\binexpensive\b/i],
  ru: [/\bнедорог\w*\b/i, /\bдешев\w*\b/i, /\bбюджетн\w*\b/i, /\bэконом\w*\b/i],
  hy: [/\bdelays\b/i]
};

// Family size patterns
const FAMILY_PATTERNS = {
  en: [
    /\bfamily of (\d+)\b/i,
    /\b(\d+) people\b/i,
    /\b(\d+) person\b/i,
    /\b(\d+) members?\b/i,
    /\bfor (\d+)\b/i
  ],
  ru: [
    /\bсемь[яи] из (\d+)\b/i,
    /\bна (\d+) человек\w*\b/i,
    /\bдля (\d+) человек\b/i,
    /\b(\d+) челове\w*\b/i
  ],
  hy: [
    /\b(\d+) delays\b/i
  ]
};

/**
 * Parse a number from text, handling commas and spaces
 */
function parseNumber(text: string): number {
  return parseInt(text.replace(/[\s,]/g, ''), 10);
}

/**
 * Extract districts from transcript
 */
function extractDistricts(transcript: string, lang: SupportedLanguage): string[] {
  const text = transcript.toLowerCase();
  const districts: string[] = [];

  for (const [districtName, mappings] of Object.entries(DISTRICT_MAPPINGS)) {
    const keywords = mappings[lang];
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        if (!districts.includes(districtName)) {
          districts.push(districtName);
        }
        break;
      }
    }
  }

  return districts;
}

/**
 * Extract property type from transcript
 */
function extractPropertyType(transcript: string, lang: SupportedLanguage): SearchCriteria['property_type'] | undefined {
  for (const [type, patterns] of Object.entries(PROPERTY_TYPES)) {
    const langPatterns = patterns[lang];
    for (const pattern of langPatterns) {
      if (pattern.test(transcript)) {
        return type as SearchCriteria['property_type'];
      }
    }
  }
  return undefined;
}

/**
 * Extract deal type from transcript
 */
function extractDealType(transcript: string, lang: SupportedLanguage): SearchCriteria['deal_type'] | undefined {
  for (const [type, patterns] of Object.entries(DEAL_TYPES)) {
    const langPatterns = patterns[lang];
    for (const pattern of langPatterns) {
      if (pattern.test(transcript)) {
        return type as SearchCriteria['deal_type'];
      }
    }
  }
  return undefined;
}

/**
 * Extract room count from transcript
 */
function extractRooms(transcript: string, lang: SupportedLanguage): { min?: number; max?: number } {
  const result: { min?: number; max?: number } = {};

  // Check for Russian word prefixes first
  if (lang === 'ru') {
    for (const [prefix, count] of Object.entries(RUSSIAN_ROOM_PREFIXES)) {
      if (transcript.toLowerCase().includes(prefix)) {
        result.min = count;
        result.max = count;
        return result;
      }
    }
  }

  // Check for studio (implies 0-1 rooms)
  if (lang === 'en' && /\bstudio\b/i.test(transcript)) {
    result.min = 0;
    result.max = 1;
    return result;
  }
  if (lang === 'ru' && /\bстуди[яю]\b/i.test(transcript)) {
    result.min = 0;
    result.max = 1;
    return result;
  }

  // Check number patterns
  const patterns = ROOM_PATTERNS[lang];
  for (const pattern of patterns) {
    const match = transcript.match(pattern);
    if (match) {
      let num: number;
      if (match[1]) {
        // Check if it's a word number
        const wordNum = WORD_TO_NUMBER[match[1].toLowerCase()];
        num = wordNum || parseInt(match[1], 10);
      } else {
        continue;
      }
      if (!isNaN(num)) {
        result.min = num;
        result.max = num;
        return result;
      }
    }
  }

  return result;
}

/**
 * Extract price constraints from transcript
 */
function extractPrice(transcript: string, lang: SupportedLanguage): { min?: number; max?: number } {
  const result: { min?: number; max?: number } = {};

  // Check max price patterns
  const maxPatterns = PRICE_PATTERNS.maxPrice[lang];
  for (const pattern of maxPatterns) {
    const match = transcript.match(pattern);
    if (match && match[1]) {
      result.max = parseNumber(match[1]);
      break;
    }
  }

  // Check min price patterns
  const minPatterns = PRICE_PATTERNS.minPrice[lang];
  for (const pattern of minPatterns) {
    const match = transcript.match(pattern);
    if (match && match[1]) {
      result.min = parseNumber(match[1]);
      break;
    }
  }

  // If no explicit min/max, check standalone price (treat as max)
  if (result.min === undefined && result.max === undefined) {
    const standalonePatterns = PRICE_PATTERNS.standalone[lang];
    for (const pattern of standalonePatterns) {
      const match = transcript.match(pattern);
      if (match && match[1]) {
        result.max = parseNumber(match[1]);
        break;
      }
    }
  }

  return result;
}

/**
 * Extract currency from transcript
 */
function extractCurrency(transcript: string, lang: SupportedLanguage): SearchCriteria['currency'] | undefined {
  // Check for USD
  const usdPatterns = CURRENCY_PATTERNS.USD[lang];
  for (const pattern of usdPatterns) {
    if (pattern.test(transcript)) {
      return 'USD';
    }
  }

  // Check for AMD
  const amdPatterns = CURRENCY_PATTERNS.AMD[lang];
  for (const pattern of amdPatterns) {
    if (pattern.test(transcript)) {
      return 'AMD';
    }
  }

  // Default to USD if $ is present or dollars mentioned
  if (/\$/.test(transcript)) {
    return 'USD';
  }

  return undefined;
}

/**
 * Check for amenities in transcript
 */
function extractAmenities(transcript: string, lang: SupportedLanguage): {
  has_parking?: boolean;
  pets_allowed?: boolean;
  has_school_nearby?: boolean;
} {
  const result: {
    has_parking?: boolean;
    pets_allowed?: boolean;
    has_school_nearby?: boolean;
  } = {};

  // Check parking
  const parkingPatterns = AMENITIES.parking[lang];
  for (const pattern of parkingPatterns) {
    if (pattern.test(transcript)) {
      result.has_parking = true;
      break;
    }
  }

  // Check pets
  const petsPatterns = AMENITIES.pets[lang];
  for (const pattern of petsPatterns) {
    if (pattern.test(transcript)) {
      result.pets_allowed = true;
      break;
    }
  }

  // Check school
  const schoolPatterns = AMENITIES.school[lang];
  for (const pattern of schoolPatterns) {
    if (pattern.test(transcript)) {
      result.has_school_nearby = true;
      break;
    }
  }

  return result;
}

/**
 * Extract safety level from transcript
 */
function extractSafetyLevel(transcript: string, lang: SupportedLanguage): SearchCriteria['safety_level'] | undefined {
  // Check high safety
  const highPatterns = SAFETY_KEYWORDS.high[lang];
  for (const pattern of highPatterns) {
    if (pattern.test(transcript)) {
      return 'high';
    }
  }

  // Check medium safety
  const mediumPatterns = SAFETY_KEYWORDS.medium[lang];
  for (const pattern of mediumPatterns) {
    if (pattern.test(transcript)) {
      return 'medium';
    }
  }

  return undefined;
}

/**
 * Extract family size from transcript
 */
function extractFamilySize(transcript: string, lang: SupportedLanguage): number | undefined {
  const patterns = FAMILY_PATTERNS[lang];
  for (const pattern of patterns) {
    const match = transcript.match(pattern);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > 0 && num <= 20) {
        return num;
      }
    }
  }
  return undefined;
}

/**
 * Check if transcript indicates budget/cheap preference
 */
function isBudgetFocused(transcript: string, lang: SupportedLanguage): boolean {
  const patterns = BUDGET_KEYWORDS[lang];
  for (const pattern of patterns) {
    if (pattern.test(transcript)) {
      return true;
    }
  }
  return false;
}

/**
 * VoiceSearchService - Main service interface
 */
export const voiceSearchService = {
  /**
   * Parse a voice transcript into SearchCriteria
   * @param transcript - The voice transcript to parse
   * @param lang - The language of the transcript ('en', 'ru', or 'hy')
   * @returns Parsed SearchCriteria object
   */
  parseTranscript(transcript: string, lang: SupportedLanguage): SearchCriteria {
    const criteria: SearchCriteria = {};

    // Extract districts
    const districts = extractDistricts(transcript, lang);
    if (districts.length > 0) {
      criteria.districts = districts;
    }

    // Extract property type
    const propertyType = extractPropertyType(transcript, lang);
    if (propertyType) {
      criteria.property_type = propertyType;
    }

    // Extract deal type
    const dealType = extractDealType(transcript, lang);
    if (dealType) {
      criteria.deal_type = dealType;
    }

    // Extract rooms
    const rooms = extractRooms(transcript, lang);
    if (rooms.min !== undefined) {
      criteria.min_rooms = rooms.min;
    }
    if (rooms.max !== undefined) {
      criteria.max_rooms = rooms.max;
    }

    // Extract price
    const price = extractPrice(transcript, lang);
    if (price.min !== undefined) {
      criteria.min_price = price.min;
    }
    if (price.max !== undefined) {
      criteria.max_price = price.max;
    }

    // Extract currency
    const currency = extractCurrency(transcript, lang);
    if (currency) {
      criteria.currency = currency;
    }

    // Extract amenities
    const amenities = extractAmenities(transcript, lang);
    if (amenities.has_parking !== undefined) {
      criteria.has_parking = amenities.has_parking;
    }
    if (amenities.pets_allowed !== undefined) {
      criteria.pets_allowed = amenities.pets_allowed;
    }
    if (amenities.has_school_nearby !== undefined) {
      criteria.has_school_nearby = amenities.has_school_nearby;
    }

    // Extract safety level
    const safetyLevel = extractSafetyLevel(transcript, lang);
    if (safetyLevel) {
      criteria.safety_level = safetyLevel;
    }

    // Extract family size
    const familySize = extractFamilySize(transcript, lang);
    if (familySize) {
      criteria.family_size = familySize;
    }

    // Handle budget-focused queries without explicit price
    if (isBudgetFocused(transcript, lang) && criteria.max_price === undefined) {
      // Set a reasonable budget-friendly max price
      // This can be adjusted based on market conditions
      if (criteria.currency === 'AMD' || transcript.toLowerCase().includes('драм')) {
        criteria.max_price = 200000; // AMD
        criteria.currency = 'AMD';
      } else {
        criteria.max_price = 500; // USD - budget threshold
        criteria.currency = 'USD';
      }
    }

    return criteria;
  }
};

export default voiceSearchService;
