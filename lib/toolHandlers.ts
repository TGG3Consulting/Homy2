/**
 * Homy AI Tool Handlers
 * Implementations for Claude API function calling
 */

import prisma from '@/lib/db/prisma';
import * as fs from 'fs/promises';
import * as path from 'path';
import matchScoreService from '@/lib/services/matchScoreService';
import { findProvince, findCity } from '@/lib/geo/armenia';

// ============================================
// TOOL DEFINITIONS (for Claude API)
// ============================================

export const HOMY_TOOLS = [
  {
    name: "search_properties",
    description: "Поиск объектов недвижимости в базе данных Homy. Используй для поиска квартир, домов по фильтрам.",
    input_schema: {
      type: "object" as const,
      properties: {
        province: {
          type: "string",
          description: "Область (марз) Армении. Можно передать название на рус/арм/англ или ключ: Ереван/yerevan, Ширак/shirak, Лори/lori, Котайк/kotayk, Арарат/ararat, Армавир/armavir, Гегаркуник/gegharkunik, Арагацотн/aragatsotn, Вайоц-Дзор/vayots-dzor, Сюник/syunik, Тавуш/tavush."
        },
        city: {
          type: "string",
          description: "Город Армении (например: Гюмри, Ванадзор, Дилижан, Капан, Абовян). Можно название на рус/арм/англ. Используй когда пользователь называет город вне Еревана."
        },
        district: {
          type: "string",
          description: "Район — ТОЛЬКО для Еревана: Kentron, Arabkir, Ajapnyak, Davtashen, Nork-Marash, Malatia-Sebastia, Erebuni, Shengavit, Nor Nork, Avan, Nubarashen, Kanaker-Zeytun"
        },
        min_price: { type: "number", description: "Минимальная цена" },
        max_price: { type: "number", description: "Максимальная цена" },
        min_rooms: { type: "number", description: "Минимум комнат" },
        max_rooms: { type: "number", description: "Максимум комнат" },
        property_type: {
          type: "string",
          enum: ["apartment", "house", "studio"],
          description: "Тип недвижимости"
        },
        deal_type: {
          type: "string",
          enum: ["long_term_rental", "short_term_rental", "sale"],
          description: "Тип сделки: долгосрочная аренда, краткосрочная аренда, продажа"
        },
        min_area: { type: "number", description: "Минимальная площадь в м²" },
        max_area: { type: "number", description: "Максимальная площадь в м²" },
        limit: { type: "number", description: "Максимум результатов (по умолчанию 10)" },
        sort_by: {
          type: "string",
          enum: ["price", "match_score", "area"],
          description: "Сортировка по полю"
        },
        sort_order: {
          type: "string",
          enum: ["asc", "desc"],
          description: "Порядок сортировки"
        }
      }
    }
  },
  {
    name: "get_neighborhoods",
    description: "Получить информацию о районах Еревана: безопасность, средние цены, характеристики, координаты.",
    input_schema: {
      type: "object" as const,
      properties: {
        district: {
          type: "string",
          description: "Название района для детальной информации. Если не указан — вернёт все районы."
        }
      }
    }
  },
  {
    name: "get_platform_metrics",
    description: "Получить статистику платформы Homy: количество объектов, средние цены по районам.",
    input_schema: {
      type: "object" as const,
      properties: {}
    }
  },
  {
    name: "show_properties",
    description: "Показать объекты пользователю на карте и в каталоге. ВЫЗЫВАЙ ВСЕГДА после search_properties!",
    input_schema: {
      type: "object" as const,
      required: ["property_ids"],
      properties: {
        property_ids: {
          type: "array",
          items: { type: "string" },
          description: "Массив ID объектов для отображения (из результатов search_properties)"
        },
        top_choice_id: {
          type: "string",
          description: "ID лучшего варианта (будет выделен)"
        },
        criteria: {
          type: "array",
          items: { type: "string" },
          description: "Критерии поиска для отображения (например: ['до 200000', '2+ комнаты', 'Арабкир'])"
        },
        search_max_price: { type: "number", description: "Макс цена из поиска (для расчёта соответствия)" },
        search_min_rooms: { type: "number", description: "Мин комнат из поиска" },
        search_districts: { type: "array", items: { type: "string" }, description: "Районы из поиска" },
        ai_match_scores: {
          type: "object",
          description: "AI оценка соответствия каждого объекта запросу пользователя. { property_id: score 0-100 }. Оценивай честно — если объект плохо подходит ставь низкий score.",
          additionalProperties: { type: "number" }
        }
      }
    }
  }
];

// ============================================
// TOOL INPUT TYPES
// ============================================

export interface SearchPropertiesInput {
  province?: string;
  city?: string;
  district?: string;
  min_price?: number;
  max_price?: number;
  min_rooms?: number;
  max_rooms?: number;
  property_type?: 'apartment' | 'house' | 'studio';
  deal_type?: 'long_term_rental' | 'short_term_rental' | 'sale';
  min_area?: number;
  max_area?: number;
  limit?: number;
  sort_by?: 'price' | 'match_score' | 'area';
  sort_order?: 'asc' | 'desc';
}

export interface GetNeighborhoodsInput {
  district?: string;
}

export interface ShowPropertiesInput {
  property_ids: string[];
  top_choice_id?: string;
  criteria?: string[];
  search_max_price?: number;
  search_min_rooms?: number;
  search_districts?: string[];
  ai_match_scores?: Record<string, number>;
}

export interface PropertyShowResult {
  success: boolean;
  shown: number;
  properties: any[];
  top_choice_id?: string;
  criteria?: string[];
  top_choice_title?: string;
  top_choice_reason?: string | null;
}

// ============================================
// TOOL HANDLERS
// ============================================

/**
 * Search properties in database
 */
export async function searchProperties(input: SearchPropertiesInput): Promise<any[]> {
  const where: any = {};

  // Гео: область (марз) и город — вся Армения. Район — только Ереван.
  if (input.province) {
    const pv = findProvince(input.province);
    where.province = pv ? pv.key : input.province.toLowerCase();
  }
  if (input.city) {
    const cc = findCity(input.city);
    where.city = cc ? cc.key : input.city.toLowerCase();
    // Если область не задана явно, выведем её из города
    if (cc && !input.province) where.province = cc.province;
  }
  if (input.district) {
    where.district = input.district;
  }

  if (input.min_price !== undefined || input.max_price !== undefined) {
    where.price = {};
    if (input.min_price !== undefined) where.price.gte = input.min_price;
    if (input.max_price !== undefined) where.price.lte = input.max_price;
  }

  if (input.min_rooms !== undefined || input.max_rooms !== undefined) {
    where.rooms = {};
    if (input.min_rooms !== undefined) where.rooms.gte = input.min_rooms;
    if (input.max_rooms !== undefined) where.rooms.lte = input.max_rooms;
  }

  if (input.property_type) {
    where.propertyType = input.property_type;
  }

  if (input.deal_type) {
    where.dealType = input.deal_type;
  }

  if (input.min_area !== undefined || input.max_area !== undefined) {
    where.OR = [
      {
        area: {
          ...(input.min_area !== undefined && { gte: input.min_area }),
          ...(input.max_area !== undefined && { lte: input.max_area }),
        }
      },
      {
        sizeSqm: {
          ...(input.min_area !== undefined && { gte: input.min_area }),
          ...(input.max_area !== undefined && { lte: input.max_area }),
        }
      }
    ];
  }

  // Build orderBy
  let orderBy: any = { createdAt: 'desc' };
  if (input.sort_by) {
    const order = input.sort_order || 'asc';
    switch (input.sort_by) {
      case 'price':
        orderBy = { price: order };
        break;
      case 'match_score':
        orderBy = { matchScore: order };
        break;
      case 'area':
        orderBy = { area: order };
        break;
    }
  }

  const properties = await prisma.property.findMany({
    where,
    orderBy,
    take: input.limit || 10,
  });

  // Return simplified format for AI
  return properties.map(p => ({
    id: p.id,
    address: p.address,
    province: p.province,
    city: p.city,
    district: p.district,
    price: p.price,
    currency: p.currency,
    rooms: p.rooms,
    area: p.area || p.sizeSqm,
    floor: p.floor,
    totalFloors: p.totalFloors,
    yearBuilt: p.yearBuilt,
    hasParking: p.hasParking,
    hasBalcony: p.hasBalcony,
    petsAllowed: p.petsAllowed,
    latitude: p.latitude,
    longitude: p.longitude,
    images: p.images,
    matchScore: p.matchScore,
  }));
}

/**
 * Get neighborhood information
 */
export async function getNeighborhoods(input: GetNeighborhoodsInput): Promise<any> {
  try {
    const dataPath = path.join(process.cwd(), '.claude', 'skills', 'homy-agent', 'data', 'neighborhoods.json');
    const data = await fs.readFile(dataPath, 'utf-8');
    const neighborhoods = JSON.parse(data);

    if (input.district) {
      const found = neighborhoods.find((n: any) =>
        n.name.toLowerCase() === input.district!.toLowerCase() ||
        n.nameRu?.toLowerCase() === input.district!.toLowerCase()
      );
      return found || { error: `Район "${input.district}" не найден` };
    }

    return neighborhoods;
  } catch (error) {
    console.error('Error reading neighborhoods:', error);
    return { error: 'Не удалось загрузить данные о районах' };
  }
}

/**
 * Get platform metrics
 */
export async function getPlatformMetrics(): Promise<any> {
  try {
    const [totalProperties, avgPrice, byDistrict] = await Promise.all([
      prisma.property.count(),
      prisma.property.aggregate({
        _avg: { price: true },
      }),
      prisma.property.groupBy({
        by: ['district'],
        _count: true,
        _avg: { price: true },
      }),
    ]);

    return {
      total_properties: totalProperties,
      average_price: Math.round(Number(avgPrice._avg.price) || 0),
      by_district: byDistrict.map(d => ({
        district: d.district,
        count: d._count,
        avg_price: Math.round(Number(d._avg.price) || 0),
      })),
    };
  } catch (error) {
    console.error('Error getting metrics:', error);
    return { error: 'Не удалось получить статистику' };
  }
}

/**
 * Show properties to user (returns data for frontend)
 */
export async function showProperties(input: ShowPropertiesInput): Promise<PropertyShowResult> {
  try {
    const properties = await prisma.property.findMany({
      where: {
        id: { in: input.property_ids }
      }
    });

    // Build search criteria for match score calculation
    const searchCriteria = {
      max_price: input.search_max_price,
      min_rooms: input.search_min_rooms,
      districts: input.search_districts,
    };
    const hasCriteria = searchCriteria.max_price || searchCriteria.min_rooms || (searchCriteria.districts && searchCriteria.districts.length > 0);

    // Transform to showcase format
    const showcaseProperties = properties.map(p => {
      // Calculate real match score if criteria provided
      const propertyForScore = {
        price: p.price,
        rooms: p.rooms,
        bedrooms: p.bedrooms,
        neighborhood: p.neighborhood,
        district: p.district,
        has_parking: p.hasParking,
        has_balcony: p.hasBalcony,
        pets_allowed: p.petsAllowed,
      };
      const realMatchScore = input.ai_match_scores?.[p.id]
        ?? (hasCriteria ? matchScoreService.calculateMatchScore(propertyForScore as any, searchCriteria) : 0);

      // Generate recommendation reasons
      const reasons = hasCriteria
        ? matchScoreService.generateRecommendationReasons(propertyForScore as any, searchCriteria)
        : [];

      return {
        id: p.id,
        title: p.title,
        address: p.address,
        district: p.district,
        neighborhood: p.neighborhood,
        price: p.price,
        currency: p.currency,
        rooms: p.rooms,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        area: p.area || p.sizeSqm,
        size_sqm: p.sizeSqm,
        floor: p.floor,
        totalFloors: p.totalFloors,
        latitude: p.latitude,
        longitude: p.longitude,
        images: p.images,
        image_url: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : '/placeholder.jpg',
        match_score: realMatchScore,
        is_top_choice: false,
        hasParking: p.hasParking,
        hasBalcony: p.hasBalcony,
        petsAllowed: p.petsAllowed,
        recommendation_reasons: reasons,
      };
    });

    // Sort by match_score descending and mark top choice
    showcaseProperties.sort((a, b) => b.match_score - a.match_score);
    const topChoice = showcaseProperties.length > 0 ? showcaseProperties[0] : null;
    if (topChoice) {
      topChoice.is_top_choice = true;
    }

    return {
      success: true,
      shown: showcaseProperties.length,
      properties: showcaseProperties,
      top_choice_id: topChoice?.id,
      criteria: input.criteria,
      top_choice_title: topChoice?.title || topChoice?.address || undefined,
      top_choice_reason: topChoice?.recommendation_reasons?.[0] || undefined,
    };
  } catch (error) {
    console.error('Error showing properties:', error);
    return {
      success: false,
      shown: 0,
      properties: [],
    };
  }
}

// ============================================
// MAIN TOOL EXECUTOR
// ============================================

export type ToolName = 'search_properties' | 'get_neighborhoods' | 'get_platform_metrics' | 'show_properties';

export async function executeToolCall(
  name: ToolName,
  input: any
): Promise<{ result: any; showPropertiesData?: PropertyShowResult }> {
  console.log(`[ToolHandler] Executing tool: ${name}`, input);

  let result: any;
  let showPropertiesData: PropertyShowResult | undefined;

  switch (name) {
    case 'search_properties':
      result = await searchProperties(input as SearchPropertiesInput);
      break;

    case 'get_neighborhoods':
      result = await getNeighborhoods(input as GetNeighborhoodsInput);
      break;

    case 'get_platform_metrics':
      result = await getPlatformMetrics();
      break;

    case 'show_properties':
      showPropertiesData = await showProperties(input as ShowPropertiesInput);
      result = { success: showPropertiesData.success, shown: showPropertiesData.shown };
      break;

    default:
      result = { error: `Unknown tool: ${name}` };
  }

  console.log(`[ToolHandler] Tool ${name} result:`,
    Array.isArray(result) ? `${result.length} items` : result
  );

  return { result, showPropertiesData };
}
