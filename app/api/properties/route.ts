import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import propertyAdapter from '@/lib/adapters/propertyAdapter';
import { SearchCriteria } from '@/lib/types';

/**
 * Parse search context text into structured criteria
 */
function parseSearchContext(searchContext: string): SearchCriteria {
  const text = searchContext.toLowerCase();
  const criteria: SearchCriteria = { search_context: searchContext };

  // Extract price (numbers > 1000 are likely prices)
  const priceMatch = text.match(/(\d[\d\s]*\d|\d+)/g);
  if (priceMatch) {
    for (const match of priceMatch) {
      const num = parseInt(match.replace(/\s/g, ''), 10);
      if (num > 1000) {
        criteria.max_price = num;
        break;
      }
    }
  }

  // Extract rooms count
  const roomsMatch = text.match(/(\d+)[\s-]*(комнат|комн|bedroom|room|սdelays)/i);
  if (roomsMatch) {
    criteria.min_rooms = parseInt(roomsMatch[1], 10);
  }

  // Extract districts
  const districtPatterns: { pattern: RegExp; name: string }[] = [
    { pattern: /арабкир|arabkir/i, name: 'Arabkir' },
    { pattern: /кентрон|kentron|центр/i, name: 'Kentron' },
    { pattern: /давташен|davtashen/i, name: 'Davtashen' },
    { pattern: /норк|nork/i, name: 'Nork-Marash' },
    { pattern: /ачапняк|ajapnyak|ачапняк/i, name: 'Ajapnyak' },
    { pattern: /малатия|malatia|себастия|sebastia/i, name: 'Malatia-Sebastia' },
    { pattern: /эребуни|erebuni/i, name: 'Erebuni' },
    { pattern: /шенгавит|shengavit/i, name: 'Shengavit' },
    { pattern: /канакер|kanaker|зейтун|zeytun/i, name: 'Kanaker-Zeytun' },
    { pattern: /нор норк|nor nork/i, name: 'Nor Nork' },
    { pattern: /аван|avan/i, name: 'Avan' },
    { pattern: /нубарашен|nubarashen/i, name: 'Nubarashen' },
  ];

  const districts: string[] = [];
  for (const { pattern, name } of districtPatterns) {
    if (pattern.test(text)) {
      districts.push(name);
    }
  }
  if (districts.length > 0) {
    criteria.districts = districts;
  }

  return criteria;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Check if specific IDs requested
    const idsParam = searchParams.get('ids');
    if (idsParam) {
      const ids = idsParam.split(',').filter(Boolean);
      const properties = await prisma.property.findMany({
        where: { id: { in: ids } },
        include: {
          owner: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              user_type: true,
            }
          }
        }
      });

      // Maintain order from request
      const orderedProperties = ids
        .map(id => properties.find(p => p.id === id))
        .filter((p): p is NonNullable<typeof p> => p !== undefined);

      const frontendProperties = orderedProperties.map(p =>
        propertyAdapter.toFrontendFormat(p)
      );
      const searchContext = searchParams.get('search_context') || '';
      const parsedCriteria = parseSearchContext(searchContext);
      const enrichedProperties = propertyAdapter.enrichArrayWithAI(frontendProperties, parsedCriteria);

      return NextResponse.json({
        properties: enrichedProperties,
        total: frontendProperties.length,
      });
    }

    // Parse query parameters
    const criteria: SearchCriteria = {
      min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
      max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
      currency: (searchParams.get('currency') as 'AMD' | 'USD') || 'AMD',
      min_rooms: searchParams.get('min_rooms') ? Number(searchParams.get('min_rooms')) : undefined,
      max_rooms: searchParams.get('max_rooms') ? Number(searchParams.get('max_rooms')) : undefined,
      districts: searchParams.get('district')?.split(',') || undefined,
      has_school_nearby: searchParams.get('has_school_nearby') === 'true',
      safety_level: searchParams.get('safety_level') as 'low' | 'medium' | 'high' | undefined,
      property_type: searchParams.get('property_type') as any,
      deal_type: searchParams.get('deal_type') as any,
      pets_allowed: searchParams.get('pets_allowed') === 'true' ? true : undefined,
      has_parking: searchParams.get('has_parking') === 'true' ? true : undefined,
    };

    const sortBy = searchParams.get('sort_by') || 'listing_date';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 20));
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      available: true,
    };

    if (criteria.min_price) where.price = { ...where.price, gte: criteria.min_price };
    if (criteria.max_price) where.price = { ...where.price, lte: criteria.max_price };
    if (criteria.min_rooms) where.rooms = { ...where.rooms, gte: criteria.min_rooms };
    if (criteria.max_rooms) where.rooms = { ...where.rooms, lte: criteria.max_rooms };
    if (criteria.districts?.length) where.district = { in: criteria.districts };
    // Geo filters (вся Армения): область (марз) и город. Район — только Ереван.
    const provinceFilter = searchParams.get('province') || undefined;
    const cityFilter = searchParams.get('city') || undefined;
    if (provinceFilter) where.province = provinceFilter;
    if (cityFilter) where.city = cityFilter;
    if (criteria.property_type) where.propertyType = criteria.property_type;
    if (criteria.deal_type) where.dealType = criteria.deal_type;
    if (criteria.pets_allowed) where.petsAllowed = true;
    if (criteria.has_parking) where.hasParking = true;

    // Build orderBy
    const orderByMap: Record<string, string> = {
      price: 'price',
      match_score: 'matchScore',
      created_at: 'createdAt',
      listing_date: 'listingDate',
    };
    const orderBy = { [orderByMap[sortBy] || 'listingDate']: sortOrder };

    // Query database
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          owner: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              user_type: true,
            }
          }
        }
      }),
      prisma.property.count({ where }),
    ]);

    // Convert to frontend format and enrich with AI
    const frontendProperties = properties.map(p => propertyAdapter.toFrontendFormat(p));
    const enrichedProperties = propertyAdapter.enrichArrayWithAI(frontendProperties, criteria);

    return NextResponse.json({
      properties: enrichedProperties,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    });
  } catch (error) {
    console.error('Properties API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
