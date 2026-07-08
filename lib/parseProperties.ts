/**
 * Парсер структурированного вывода Homy
 * Ищет JSON-блок между маркерами <!--HOMY_PROPERTIES и HOMY_PROPERTIES-->
 */

import { PropertyShowcase } from './types';

/**
 * Генерирует уникальный ID
 */
function generateId(): string {
  return `prop_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Интерфейс JSON-объекта от Homy
 */
interface HomyPropertyJSON {
  // Existing fields
  name: string;
  address?: string;
  price?: number;
  pricePerSqm?: number;
  area?: number;
  rooms?: number;
  completionDate?: string;
  sourceUrl: string;
  sourceName?: string;
  developer?: string;
  description?: string;
  imageUrl?: string;
  images?: string[];

  // NEW FIELDS:
  latitude?: number;
  longitude?: number;
  bedrooms?: number;
  size_sqm?: number;
  neighborhood?: string;
  image_url?: string;
  is_top_choice?: boolean;
  recommendation_reasons?: string[];
  warning?: string;
  match_score?: number;
  building_type?: string;
  utilities_estimate?: number;
  deposit_months?: number;
  pets_allowed?: boolean;
  has_parking?: boolean;
  has_balcony?: boolean;
  property_type?: string;
  deal_type?: string;
  contact?: {
    name?: string;
    type?: string;
    verified?: boolean;
    phone?: string;
  };
  nearby_pois?: {
    schools?: any[];
    parks?: any[];
    metro?: any[];
    supermarkets?: any[];
  };
}

/**
 * Извлекает JSON-блок из ответа Homy
 */
function extractJSONBlock(response: string): HomyPropertyJSON[] | null {
  // Ищем маркеры <!--HOMY_PROPERTIES ... HOMY_PROPERTIES-->
  const jsonPattern = /<!--HOMY_PROPERTIES\s*([\s\S]*?)\s*HOMY_PROPERTIES-->/;
  const match = response.match(jsonPattern);

  if (!match || !match[1]) {
    return null;
  }

  try {
    const jsonStr = match[1].trim();
    const parsed = JSON.parse(jsonStr);

    // Проверяем что это массив
    if (Array.isArray(parsed)) {
      return parsed as HomyPropertyJSON[];
    }

    // Если это объект с массивом properties
    if (parsed.properties && Array.isArray(parsed.properties)) {
      return parsed.properties as HomyPropertyJSON[];
    }

    return null;
  } catch (e) {
    console.error('[parseProperties] Failed to parse JSON block:', e);
    return null;
  }
}

/**
 * Конвертирует JSON-объект в PropertyShowcase
 */
function jsonToPropertyShowcase(json: HomyPropertyJSON): PropertyShowcase {
  return {
    // Existing mappings
    id: generateId(),
    name: json.name || 'Без названия',
    address: json.address || '',
    district: extractDistrict(json.address || ''),
    price: json.price || 0,
    pricePerSqm: json.pricePerSqm,
    area: json.area || 0,
    rooms: json.rooms || 0,
    completionDate: json.completionDate,
    sourceUrl: json.sourceUrl || '',
    sourceName: json.sourceName || extractSourceName(json.sourceUrl || ''),
    developer: json.developer,
    description: json.description,
    imageUrl: json.images?.[0] || json.imageUrl,
    images: json.images,

    // New field mappings:
    latitude: json.latitude || 0,
    longitude: json.longitude || 0,
    bedrooms: json.bedrooms || json.rooms || 0,
    size_sqm: json.size_sqm || json.area || 0,
    neighborhood: json.neighborhood || json.address ? extractDistrict(json.address || '') : '',
    image_url: json.image_url || json.images?.[0] || '',
    is_top_choice: json.is_top_choice || false,
    recommendation_reasons: json.recommendation_reasons || [],
    warning: json.warning || undefined,
    match_score: json.match_score || 0,
    building_type: json.building_type as 'brick' | 'panel' | 'monolith' | undefined,
    utilities_estimate: json.utilities_estimate,
    deposit_months: json.deposit_months,
    pets_allowed: json.pets_allowed || false,
    has_parking: json.has_parking || false,
    has_balcony: json.has_balcony || false,
    property_type: json.property_type as 'apartment' | 'house' | 'studio' | undefined,
    deal_type: json.deal_type as 'long_term_rental' | 'short_term_rental' | 'sale' | undefined,
    contact: json.contact as any,
    nearby_pois: json.nearby_pois as any,
  };
}

/**
 * Извлекает район из адреса
 */
function extractDistrict(address: string): string {
  if (!address) return '';

  // Известные районы
  const districts = [
    'Кентрон', 'Центр', 'Арабкир', 'Ачапняк', 'Давташен', 'Канакер',
    'Нор-Норк', 'Нор Норк', 'Норк-Мараш', 'Норк Мараш', 'Малатия',
    'Себастия', 'Эребуни', 'Шенгавит', 'Аван', 'Нубарашен',
    'Аринж', 'Канакераван', 'Котайк'
  ];

  for (const district of districts) {
    if (address.toLowerCase().includes(district.toLowerCase())) {
      return district;
    }
  }

  // Берём первую часть адреса
  const parts = address.split(/[,;]/);
  return parts[parts.length - 1]?.trim() || address;
}

/**
 * Извлекает название источника из URL
 */
function extractSourceName(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    return hostname;
  } catch {
    return 'источник';
  }
}

/**
 * ГЛАВНАЯ ФУНКЦИЯ — парсит ответ Homy
 */
export function parsePropertiesFromResponse(response: string): PropertyShowcase[] {
  if (!response || typeof response !== 'string') {
    return [];
  }

  // Пробуем извлечь структурированный JSON
  const jsonProperties = extractJSONBlock(response);

  if (jsonProperties && jsonProperties.length > 0) {
    console.log('[parseProperties] Found structured JSON with', jsonProperties.length, 'properties');
    return jsonProperties
      .filter(p => p.name && p.sourceUrl) // Фильтруем невалидные
      .map(jsonToPropertyShowcase);
  }

  // Если JSON не найден — возвращаем пустой массив
  // (старый текстовый парсинг убран — теперь только JSON)
  console.log('[parseProperties] No structured JSON found in response');
  return [];
}

/**
 * Проверяет, есть ли в ответе объекты недвижимости
 */
export function hasProperties(response: string): boolean {
  if (!response || typeof response !== 'string') {
    return false;
  }

  // Проверяем наличие JSON-блока
  return /<!--HOMY_PROPERTIES[\s\S]*?HOMY_PROPERTIES-->/.test(response);
}

/**
 * Удаляет JSON-блок из текста ответа (для отображения)
 */
export function removePropertiesBlock(response: string): string {
  return response.replace(/<!--HOMY_PROPERTIES[\s\S]*?HOMY_PROPERTIES-->/g, '').trim();
}

/**
 * Извлекает источники из ответа
 */
export function extractSources(response: string): string[] {
  const sources: Set<string> = new Set();

  // Из JSON-блока
  const jsonProperties = extractJSONBlock(response);
  if (jsonProperties) {
    jsonProperties.forEach(p => {
      if (p.sourceName) sources.add(p.sourceName);
    });
  }

  // Из текста
  const sourcePattern = /источник[и|а]?[:\s]+([^\n]+)/gi;
  let match;
  while ((match = sourcePattern.exec(response)) !== null) {
    const sourceList = match[1].split(/[,;]/).map(s =>
      s.trim().replace(/[*_\[\]()]/g, '').toLowerCase()
    );
    sourceList.forEach(s => {
      if (s && s.length > 2) sources.add(s);
    });
  }

  return Array.from(sources);
}
