/**
 * Property Opinion API
 * Uses Claude API via anthropicClient
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { propertyOpinion } from '@/lib/anthropicClient';
import { propertyIntelligenceService } from '@/lib/services/propertyIntelligence';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const conversationHistory = body.conversationHistory || '';

    // Get property from DB
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Pull verified intelligence (legal / price / location) so the opinion is grounded, not generic
    let intel: Parameters<typeof propertyOpinion>[2];
    try {
      const raw: any = await propertyIntelligenceService.getIntelligence(id);
      intel = {
        developer_verified: raw?.legal?.developer_verified,
        double_sale_risk: raw?.legal?.double_sale_risk,
        ownership_status: raw?.legal?.ownership_status,
        title_status: raw?.legal?.title_status,
        price_vs_market: raw?.investment?.price_vs_market,
        investment_score: raw?.investment?.score,
        roi_estimate: raw?.investment?.roi_estimate,
        appreciation_forecast: raw?.investment?.appreciation_forecast,
        noise_level: raw?.location?.noise_level,
        commute: raw?.location?.commute_am,
        parking: raw?.location?.parking_available == null ? undefined : (raw.location.parking_available ? 'есть' : 'ограничена'),
      };
    } catch { /* intelligence optional */ }

    // Use Claude API (handle all nullable fields and Decimal types)
    const opinion = await propertyOpinion(
      {
        address: property.address || 'Адрес не указан',
        district: property.district || 'Район не указан',
        price: property.price ? Number(property.price) : 0,
        currency: property.currency || 'AMD',
        area: property.area ? Number(property.area) : undefined,
        sizeSqm: property.sizeSqm ? Number(property.sizeSqm) : undefined,
        rooms: property.rooms ?? 0,
        floor: property.floor ?? undefined,
        totalFloors: property.totalFloors ?? undefined,
        yearBuilt: property.yearBuilt ?? undefined,
        buildingType: property.buildingType ?? undefined,
        hasParking: property.hasParking ?? undefined,
        hasBalcony: property.hasBalcony ?? undefined,
        petsAllowed: property.petsAllowed ?? undefined,
      },
      conversationHistory,
      intel
    );

    return NextResponse.json(opinion);
  } catch (error) {
    console.error('Opinion API error:', error);
    return NextResponse.json({ summary: 'Ошибка сервера', reasons: [], warning: null });
  }
}
