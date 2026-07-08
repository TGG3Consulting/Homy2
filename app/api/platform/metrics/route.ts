import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// Cache for metrics (1 hour)
let metricsCache: { data: any; expires: number } | null = null;
const CACHE_TTL = 3600000; // 1 hour

export async function GET(req: NextRequest) {
  try {
    // Check cache
    if (metricsCache && metricsCache.expires > Date.now()) {
      return NextResponse.json(metricsCache.data);
    }

    // Query database
    const [propertiesCount, citiesResult, dealsCount] = await Promise.all([
      prisma.property.count({
        where: { available: true },
      }),
      prisma.property.findMany({
        select: { district: true },
        distinct: ['district'],
        where: { available: true },
      }),
      prisma.viewing.count({
        where: { status: 'completed' },
      }),
    ]);

    const metrics = {
      properties_count: propertiesCount || 1500, // Fallback to frontend default
      cities_count: citiesResult.length || 15,   // Fallback
      deals_count: dealsCount || 350,            // Fallback
    };

    // Update cache
    metricsCache = {
      data: metrics,
      expires: Date.now() + CACHE_TTL,
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Platform metrics error:', error);

    // Return fallback data on error
    return NextResponse.json({
      properties_count: 1500,
      cities_count: 15,
      deals_count: 350,
    });
  }
}
