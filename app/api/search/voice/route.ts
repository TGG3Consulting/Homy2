import { NextRequest, NextResponse } from 'next/server';
import { voiceSearchService } from '@/lib/services/voiceSearch';
import { prisma } from '@/lib/db/prisma';
import { matchScoreService } from '@/lib/services/matchScoreService';
import { adaptPrismaProperty } from '@/lib/adapters/propertyAdapter';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { transcript, lang = 'en' } = body;

  if (!transcript) {
    return NextResponse.json(
      { error: 'Transcript is required' },
      { status: 400 }
    );
  }

  // Parse transcript to search criteria
  const criteria = voiceSearchService.parseTranscript(transcript, lang);

  // Build Prisma query from criteria
  const where: any = { available: true };

  if (criteria.max_price) {
    where.price = { lte: criteria.max_price };
  }
  if (criteria.min_rooms) {
    where.OR = [
      { rooms: { gte: criteria.min_rooms } },
      { bedrooms: { gte: criteria.min_rooms } }
    ];
  }
  if (criteria.districts && criteria.districts.length > 0) {
    // district is the canonical scalar key (neighborhood holds localized JSON, not filterable).
    // Direct AND condition — must not clobber a where.OR set by another filter (e.g. min_rooms).
    where.district = { in: criteria.districts, mode: 'insensitive' };
  }
  if (criteria.property_type) {
    where.propertyType = criteria.property_type;
  }

  // Get matching properties
  const rawProperties = await prisma.property.findMany({
    where,
    take: 20,
    orderBy: { matchScore: 'desc' }
  });

  // Adapt and score
  const properties = rawProperties.map(p => {
    const adapted = adaptPrismaProperty(p);
    adapted.match_score = matchScoreService.calculateMatchScore(adapted, criteria);
    adapted.recommendation_reasons = matchScoreService.generateRecommendationReasons(adapted, criteria);
    return adapted;
  });

  // Sort by match score
  properties.sort((a, b) => b.match_score - a.match_score);

  return NextResponse.json({
    success: true,
    transcript,
    lang,
    criteria_extracted: criteria,
    properties: properties.slice(0, 10),
    total_matches: properties.length
  });
}
