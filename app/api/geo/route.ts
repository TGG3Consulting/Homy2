import { NextResponse } from 'next/server';
import { PROVINCES, CITIES, YEREVAN_DISTRICTS, YEREVAN_PROVINCE_KEY } from '@/lib/geo/armenia';

/**
 * Geography of Armenia for location selectors (province → city, + Yerevan districts).
 * Districts exist ONLY for Yerevan. Static reference data — safe to cache aggressively.
 */
export async function GET() {
  return NextResponse.json(
    {
      provinces: PROVINCES,
      cities: CITIES,
      yerevanProvinceKey: YEREVAN_PROVINCE_KEY,
      yerevanDistricts: YEREVAN_DISTRICTS,
    },
    { headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' } }
  );
}
