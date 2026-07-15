import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { propertyIntelligenceService } from '@/lib/services/propertyIntelligence';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get property from DB
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Get or generate intelligence
    const rawIntelligence = await propertyIntelligenceService.getIntelligence(id);

    // Transform to frontend format (arrays of objects → primitive values)
    const intelligence = {
      legal: {
        developer_verified: rawIntelligence.legal.developer_verified,
        developer_name: rawIntelligence.legal.developer_name,
        claims_count: rawIntelligence.legal.claims_count,
        double_sale_risk: rawIntelligence.legal.double_sale_risk,
        ownership_status: rawIntelligence.legal.ownership_status,
        title_status: rawIntelligence.legal.title_status,
      },
      location: {
        commute_am: rawIntelligence.location.commute_am,
        commute_pm: rawIntelligence.location.commute_pm,
        highway_distance: rawIntelligence.location.highway_distance,
        noise_level: rawIntelligence.location.noise_level,
        ecology_index: typeof rawIntelligence.location.ecology_index === 'number'
          ? (rawIntelligence.location.ecology_index > 70 ? 'good' : rawIntelligence.location.ecology_index > 50 ? 'medium' : 'low')
          : rawIntelligence.location.ecology_index,
        parking_available: rawIntelligence.location.parking_available == null
          ? null
          : (rawIntelligence.location.parking_available ? 'Available' : 'Limited'),
        playgrounds_nearby: rawIntelligence.location.playgrounds_nearby == null
          ? null
          : (rawIntelligence.location.playgrounds_nearby ? 'Yes, nearby' : 'Not found'),
        parks_nearby: Array.isArray(rawIntelligence.location.parks_nearby)
          ? (rawIntelligence.location.parks_nearby.length > 0
            ? `${rawIntelligence.location.parks_nearby.length} parks (${rawIntelligence.location.parks_nearby[0]?.name || 'nearby'})`
            : 'None nearby')
          : String(rawIntelligence.location.parks_nearby || 'Unknown'),
      },
      infrastructure: {
        supermarkets: Array.isArray(rawIntelligence.infrastructure.supermarkets)
          ? rawIntelligence.infrastructure.supermarkets.length
          : rawIntelligence.infrastructure.supermarkets,
        pharmacies: Array.isArray(rawIntelligence.infrastructure.pharmacies)
          ? rawIntelligence.infrastructure.pharmacies.length
          : rawIntelligence.infrastructure.pharmacies,
        banks: Array.isArray(rawIntelligence.infrastructure.banks)
          ? rawIntelligence.infrastructure.banks.length
          : rawIntelligence.infrastructure.banks,
        schools: Array.isArray(rawIntelligence.infrastructure.schools)
          ? (rawIntelligence.infrastructure.schools.length > 0
            ? `${rawIntelligence.infrastructure.schools.length} within 1km`
            : 'None nearby')
          : String(rawIntelligence.infrastructure.schools || 'Unknown'),
        transport: Array.isArray(rawIntelligence.infrastructure.transport)
          ? (rawIntelligence.infrastructure.transport.length > 0
            ? `${rawIntelligence.infrastructure.transport[0]?.name || 'Stop'} - ${rawIntelligence.infrastructure.transport[0]?.distance || 0}m`
            : 'Limited')
          : String(rawIntelligence.infrastructure.transport || 'Unknown'),
      },
      investment: {
        score: rawIntelligence.investment.score,
        price_vs_market: rawIntelligence.investment.price_vs_market,
        demand_signals: Array.isArray(rawIntelligence.investment.demand_signals)
          ? rawIntelligence.investment.demand_signals.length
          : rawIntelligence.investment.demand_signals,
        roi_estimate: rawIntelligence.investment.roi_estimate,
        appreciation_forecast: rawIntelligence.investment.appreciation_forecast,
      },
    };

    return NextResponse.json(intelligence);
  } catch (error) {
    console.error('Property intelligence error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
