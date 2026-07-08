import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withOptionalAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import propertyAdapter from '@/lib/adapters/propertyAdapter';
import { PropertyShowcase } from '@/lib/types';

// ============================================================================
// Type Definitions
// ============================================================================

interface UserPreferences {
  districts?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRooms?: number;
  propertyType?: string;
  petsAllowed?: boolean;
  hasParking?: boolean;
}

interface RecommendationResponse {
  recommendations: PropertyShowcase[];
  total: number;
  user_authenticated: boolean;
  filters_applied: boolean;
}

// ============================================================================
// API Handler
// ============================================================================

/**
 * GET /api/users/me/recommendations
 *
 * Returns AI-recommended properties for the user.
 * Works for both authenticated and anonymous users:
 * - Authenticated: Can use stored user preferences for better recommendations
 * - Anonymous: Returns generally high-scoring available properties
 *
 * Query params:
 * - limit: number (default: 6, max: 12)
 * - minScore: number (default: 80)
 */
export const GET = withOptionalAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '6', 10), 12);
    const minScore = parseInt(searchParams.get('minScore') || '80', 10);

    const userId = req.user?.id;

    // Build base query for available properties with high match scores
    const whereClause: Record<string, unknown> = {
      available: true,
      matchScore: {
        gte: minScore,
      },
    };

    // Track if user preferences are applied
    let userPreferences: UserPreferences = {};
    let filtersApplied = false;

    // For authenticated users, apply search_preferences filters
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { search_preferences: true },
      });

      if (user?.search_preferences && typeof user.search_preferences === 'object') {
        const prefs = user.search_preferences as Record<string, unknown>;

        // Apply max_price filter
        if (prefs.max_price && typeof prefs.max_price === 'number') {
          whereClause.price = { ...(whereClause.price as object || {}), lte: prefs.max_price };
          userPreferences.maxPrice = prefs.max_price;
          filtersApplied = true;
        }

        // Apply min_rooms filter
        if (prefs.min_rooms && typeof prefs.min_rooms === 'number') {
          whereClause.rooms = { ...(whereClause.rooms as object || {}), gte: prefs.min_rooms };
          userPreferences.minRooms = prefs.min_rooms;
          filtersApplied = true;
        }

        // Apply districts filter
        if (prefs.districts && Array.isArray(prefs.districts) && prefs.districts.length > 0) {
          whereClause.district = { in: prefs.districts };
          userPreferences.districts = prefs.districts;
          filtersApplied = true;
        }
      }
    }

    // Fetch properties sorted by match score descending
    const properties = await prisma.property.findMany({
      where: whereClause,
      orderBy: [
        { matchScore: 'desc' },
        { listingDate: 'desc' },
      ],
      take: limit,
    });

    // Convert to frontend format with recommendation reasons
    const recommendations: PropertyShowcase[] = properties.map((property, index) => {
      const adapted = propertyAdapter.toFrontendFormat(property);

      // Ensure recommendation_reasons is populated
      if (!adapted.recommendation_reasons || adapted.recommendation_reasons.length === 0) {
        adapted.recommendation_reasons = generateRecommendationReasons(adapted, userPreferences);
      }

      // Mark first property as top choice
      if (index === 0) {
        adapted.is_top_choice = true;
      }

      return adapted;
    });

    const response: RecommendationResponse = {
      recommendations,
      total: recommendations.length,
      user_authenticated: !!userId,
      filters_applied: filtersApplied,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get recommendations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate recommendation reasons based on property features and user preferences
 * Returns localized strings (objects with en/ru/hy keys) that frontend will handle
 */
function generateRecommendationReasons(
  property: PropertyShowcase,
  userPreferences: UserPreferences | null
): string[] {
  const reasons: Array<{ en: string; ru: string; hy: string }> = [];

  // High match score reason
  if (property.match_score >= 95) {
    reasons.push({
      en: 'Excellent match for your criteria',
      ru: 'Отличное совпадение с вашими критериями',
      hy: 'Գերազանց համապատասխանություն ձեր չափանիշներին'
    });
  } else if (property.match_score >= 90) {
    reasons.push({
      en: 'Great match for your preferences',
      ru: 'Отлично подходит под ваши предпочтения',
      hy: 'Լավ համապատասխանում է ձեր նախասիրություններին'
    });
  } else if (property.match_score >= 85) {
    reasons.push({
      en: 'Strong match with your needs',
      ru: 'Хорошо соответствует вашим требованиям',
      hy: 'Լավ համապատասխանում է ձեր պահանջներին'
    });
  }

  // Location match (if user has preferences)
  if (
    userPreferences?.districts &&
    Array.isArray(userPreferences.districts) &&
    userPreferences.districts.includes(property.district)
  ) {
    reasons.push({
      en: `Located in your preferred area: ${property.district}`,
      ru: `В предпочитаемом районе: ${property.district}`,
      hy: `Գտնվում է ձեր նախընտրած թաղամասում՝ ${property.district}`
    });
  }

  // Price within budget (if user has preferences)
  if (userPreferences?.maxPrice && property.price <= userPreferences.maxPrice) {
    reasons.push({
      en: 'Within your budget',
      ru: 'В рамках вашего бюджета',
      hy: 'Տեղավորվում է ձեր բյուջեում'
    });
  }

  // Feature-based reasons
  if (property.has_parking) {
    reasons.push({
      en: 'Includes parking space',
      ru: 'Есть парковочное место',
      hy: 'Կա կայանատեղի'
    });
  }

  if (property.pets_allowed) {
    reasons.push({
      en: 'Pet-friendly property',
      ru: 'Разрешены домашние животные',
      hy: 'Թույլատրվում են կենդանիներ'
    });
  }

  if (property.has_balcony) {
    reasons.push({
      en: 'Features a balcony',
      ru: 'Есть балкон',
      hy: 'Կա պատշգամբ'
    });
  }

  if (property.verified) {
    reasons.push({
      en: 'Verified listing',
      ru: 'Проверенное объявление',
      hy: 'Հաստատված հայտարարություն'
    });
  }

  // Building quality
  if (property.year_built && property.year_built >= 2020) {
    reasons.push({
      en: 'Newly built property',
      ru: 'Новостройка',
      hy: 'Նոր կառուցված շենք'
    });
  }

  if (property.building_type === 'monolith') {
    reasons.push({
      en: 'Monolithic construction (premium quality)',
      ru: 'Монолитное строение (премиум качество)',
      hy: 'Մոնոլիտ շինություն (պրեմիում որակ)'
    });
  }

  // Virtual tour available
  if (property.has_virtual_tour) {
    reasons.push({
      en: 'Virtual tour available',
      ru: 'Доступен виртуальный тур',
      hy: 'Հասանելի է վիրտուալ շրջայց'
    });
  }

  // Good location features
  if (property.nearby_pois) {
    const pois = property.nearby_pois;
    if (pois.metro && pois.metro.length > 0) {
      reasons.push({
        en: 'Close to metro station',
        ru: 'Рядом с метро',
        hy: 'Մոտ է մետրոյի կայարանին'
      });
    }
    if (pois.schools && pois.schools.length > 0) {
      reasons.push({
        en: 'Schools nearby',
        ru: 'Рядом школы',
        hy: 'Մոտակայքում կան դպրոցներ'
      });
    }
    if (pois.parks && pois.parks.length > 0) {
      reasons.push({
        en: 'Near parks and green areas',
        ru: 'Рядом парки и зелёные зоны',
        hy: 'Մոտ է զբոսայգիներին և կանաչ գոտիներին'
      });
    }
  }

  // Fallback generic reasons if none generated
  if (reasons.length === 0) {
    reasons.push({
      en: 'Highly rated by our AI',
      ru: 'Высоко оценено нашим ИИ',
      hy: 'Բարձր գնահատված մեր AI-ի կողմից'
    });
    if (property.match_score >= 80) {
      reasons.push({
        en: 'Strong overall match',
        ru: 'Хорошее общее совпадение',
        hy: 'Լավ ընդհանուր համապատասխանություն'
      });
    }
  }

  // Limit to 3 most relevant reasons and convert to JSON strings for frontend parsing
  return reasons.slice(0, 3).map(r => JSON.stringify(r));
}
