/**
 * Property Chat API
 * Uses Claude API via anthropicClient
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { propertyChat } from '@/lib/anthropicClient';
import { checkRateLimit, getClientIP, RATE_LIMITS, rateLimitResponse } from '@/lib/rateLimiter';

const MAX_LEN = 4000;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Paid LLM endpoint — rate-limit per IP against denial-of-wallet (VULN-001).
    const rl = checkRateLimit(`prop-chat:${getClientIP(req)}`, RATE_LIMITS.ai);
    if (!rl.success) return rateLimitResponse(rl);

    const { id } = await params;
    const body = await req.json();
    // Cap all free-text inputs (token/cost + prompt-injection bound) — VULN-001.
    const message = String(body.message || '').slice(0, MAX_LEN);
    const conversationHistory = String(body.conversationHistory || '').slice(0, MAX_LEN);
    const chatHistory = String(body.chatHistory || '').slice(0, MAX_LEN);

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
