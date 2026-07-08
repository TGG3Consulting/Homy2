/**
 * Property Opinion API
 * Uses Claude API via anthropicClient
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { propertyOpinion } from '@/lib/anthropicClient';

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
      conversationHistory
    );

    return NextResponse.json(opinion);
  } catch (error) {
    console.error('Opinion API error:', error);
    return NextResponse.json({ summary: 'Ошибка сервера', reasons: [], warning: null });
  }
}
