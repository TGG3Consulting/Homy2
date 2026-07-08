import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import geocodingService from '@/lib/services/geocodingService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const property = await prisma.property.findUnique({
      where: { id },
      select: { latitude: true, longitude: true, nearbyPois: true },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Return cached POI if available
    if (property.nearbyPois) {
      return NextResponse.json(property.nearbyPois);
    }

    // Fetch POI if coordinates available
    if (property.latitude && property.longitude) {
      const lat = Number(property.latitude);
      const lng = Number(property.longitude);
      const pois = await geocodingService.findNearbyPOI(
        lat,
        lng,
        1500 // 1.5km radius
      );

      // Cache for future requests
      await prisma.property.update({
        where: { id },
        data: { nearbyPois: JSON.parse(JSON.stringify(pois)) },
      });

      return NextResponse.json(pois);
    }

    // Return empty if no coordinates
    return NextResponse.json({
      schools: [],
      parks: [],
      metro: [],
      supermarkets: [],
    });
  } catch (error) {
    console.error('Nearby POI error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
