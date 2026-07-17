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

    // Real numbers only — no fabricated fallbacks (honest counts, even when small/zero).
    const metrics = {
      properties_count: propertiesCount,
      cities_count: citiesResult.length,
      deals_count: dealsCount,
    };

    // Update cache
    metricsCache = {
      data: metrics,
      expires: Date.now() + CACHE_TTL,
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Platform metrics error:', error);
    // Don't fabricate numbers on error — surface a real failure.
    return NextResponse.json({ error: 'Failed to load metrics' }, { status: 500 });
  }
}
