/**
 * Property Chat API
 * Uses Claude API via anthropicClient
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { propertyChat } from '@/lib/anthropicClient';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { message, conversationHistory, chatHistory } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    // Get property from DB
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Use Claude API (handle all nullable fields and Decimal types)
    const response = await propertyChat(
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
        condition: property.condition ?? undefined,
        hasParking: property.hasParking ?? undefined,
        hasBalcony: property.hasBalcony ?? undefined,
        petsAllowed: property.petsAllowed ?? undefined,
        depositMonths: property.depositMonths ?? undefined,
        utilitiesEstimate: property.utilitiesEstimate ? Number(property.utilitiesEstimate) : undefined,
      },
      conversationHistory || '',
      chatHistory || '',
      message
    );

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Property chat API error:', error);
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 });
  }
}
