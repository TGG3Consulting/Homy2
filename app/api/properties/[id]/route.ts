import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import propertyAdapter from '@/lib/adapters/propertyAdapter';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const property = await prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    const frontendProperty = propertyAdapter.toFrontendFormat(property);

    return NextResponse.json(frontendProperty);
  } catch (error) {
    console.error('Property detail error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
