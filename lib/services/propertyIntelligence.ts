import prisma from '@/lib/db/prisma';

// ============================================================================
// Type Definitions
// ============================================================================

// NOTE (1.1): fields we cannot verify from a real source are `null` = "источник в подключении"
// (shown honestly in the UI, never fabricated). Real data (nearby POI, parking, developer name)
// is kept; legal verification / ROI / market baseline stay null until real sources are connected.
export interface LegalAnalysis {
  developer_verified: boolean | null;
  developer_name: string | null;
  claims_count: number | null;
  double_sale_risk: boolean | null;
  ownership_status: 'clear' | 'encumbered' | 'pending' | null;
  title_status: 'verified' | 'pending' | 'issues' | null;
}

export interface LocationAnalysis {
  commute_am: number | null; // minutes to city center morning
  commute_pm: number | null; // minutes to city center evening
  highway_distance: number | null; // meters
  noise_level: 'low' | 'medium' | 'high' | null;
  ecology_index: number | null; // 0-100
  parking_available: boolean | null;
  playgrounds_nearby: boolean | null;
  parks_nearby: { name: string; distance: number }[]; // real POI (may be empty)
}

export interface InfrastructureAnalysis {
  supermarkets: { name: string; distance: number; rating?: number }[]; // real POI
  pharmacies: { name: string; distance: number }[];                    // real POI (or empty — no data)
  banks: { name: string; distance: number }[];                         // real POI (or empty — no data)
  schools: { name: string; distance: number; type: string }[];         // real POI
  transport: { type: string; name: string; distance: number }[];       // real POI
}

export interface InvestmentAnalysis {
  score: number | null; // 0-100
  price_vs_market: number | null; // percentage; null until a correct baseline (currency/deal-type) exists
  demand_signals: string[]; // derived only from real facts (may be empty)
  roi_estimate: number | null; // annual percentage
  appreciation_forecast: number | null; // 5-year percentage
}

export interface PropertyIntelligence {
  legal: LegalAnalysis;
  location: LocationAnalysis;
  infrastructure: InfrastructureAnalysis;
  investment: InvestmentAnalysis;
}

// Property type expected by generateIntelligence
export interface PropertyInput {
  id: string;
  district?: string | null;
  neighborhood?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  coordinates?: { lat: number; lng: number } | null;
  developer?: string | null;
  price?: number | null;
  area?: number | null;
  size_sqm?: number | null;
  year_built?: number | null;
  has_parking?: boolean | null;
}

// ============================================================================
// Data Generation Functions (honest — no fabrication; see NOTE at top)
// ============================================================================

// ---- POI helpers: read real nearby POI from Property.nearbyPois (Overpass/Nominatim) ----
type NearbyPoi = { name?: string; distance_m?: number; distance?: number; walk_time_min?: number; rating?: number };
function poiList(nearby: unknown, key: string): NearbyPoi[] {
  const n = nearby as Record<string, unknown> | null | undefined;
  const arr = n && Array.isArray(n[key]) ? (n[key] as NearbyPoi[]) : [];
  return arr;
}
function poiDist(p: NearbyPoi): number {
  const d = p.distance_m ?? p.distance;
  return typeof d === 'number' ? Math.round(d) : 0;
}

// Legal: we have NO real verification source (registry/notary/developer DB). Every field stays
// null = "источник в подключении" — never fabricated. developer_name is real when provided.
function buildLegal(property: PropertyInput): LegalAnalysis {
  return {
    developer_verified: null,
    developer_name: property.developer || null,
    claims_count: null,
    double_sale_risk: null,
    ownership_status: null,
    title_status: null,
  };
}

// Location: real parks (from nearby POI) and real parking flag when set. Commute / highway /
// noise / ecology / playgrounds have no per-property source → null ("источник в подключении").
function buildLocation(property: PropertyInput, nearby: unknown): LocationAnalysis {
  const parks = poiList(nearby, 'parks')
    .map((p) => ({ name: p.name || 'Парк', distance: poiDist(p) }))
    .filter((p) => p.name)
    .sort((a, b) => a.distance - b.distance);

  return {
    commute_am: null,
    commute_pm: null,
    highway_distance: null,
    noise_level: null,
    ecology_index: null,
    parking_available: property.has_parking ?? null,
    playgrounds_nearby: null,
    parks_nearby: parks,
  };
}

// Infrastructure: built from REAL nearby POI (Overpass/Nominatim). Categories the POI source
// doesn't return (pharmacies/banks) stay empty — shown honestly as "нет данных", never invented.
function buildInfrastructure(nearby: unknown): InfrastructureAnalysis {
  const schools = poiList(nearby, 'schools')
    .map((p) => ({ name: p.name || 'Школа/сад', distance: poiDist(p), type: 'Образование' }))
    .sort((a, b) => a.distance - b.distance);
  const supermarkets = poiList(nearby, 'supermarkets')
    .map((p) => ({ name: p.name || 'Магазин', distance: poiDist(p), ...(typeof p.rating === 'number' ? { rating: p.rating } : {}) }))
    .sort((a, b) => a.distance - b.distance);
  const transport = poiList(nearby, 'metro')
    .map((p) => ({ type: 'metro', name: p.name || 'Метро', distance: poiDist(p) }))
    .sort((a, b) => a.distance - b.distance);

  return {
    supermarkets,
    pharmacies: [], // no real source in nearby POI yet
    banks: [],      // no real source in nearby POI yet
    schools,
    transport,
  };
}

// Investment: no correct market baseline yet (property price is AMD and by deal-type, while the
// only reference is a USD sale price/m² — not comparable), so price_vs_market / score / ROI /
// appreciation stay null. Demand signals are derived ONLY from real facts (real nearby POI + a
// real year_built), never invented.
function buildInvestment(property: PropertyInput, nearby: unknown): InvestmentAnalysis {
  const signals: string[] = [];
  if (poiList(nearby, 'metro').length > 0) signals.push('Рядом метро');
  if (poiList(nearby, 'schools').length > 0) signals.push('Школы рядом');
  if (property.year_built && property.year_built >= 2015) signals.push('Новая постройка');

  return {
    score: null,
    price_vs_market: null,
    demand_signals: signals,
    roi_estimate: null,
    appreciation_forecast: null,
  };
}

// ============================================================================
// Property Intelligence Service
// ============================================================================

// Assemble honest intelligence from a property + its REAL nearby POI. No fabrication:
// unverifiable fields are null ("источник в подключении"); real data is passed through.
function buildHonestIntelligence(property: PropertyInput, nearby: unknown): PropertyIntelligence {
  return {
    legal: buildLegal(property),
    location: buildLocation(property, nearby),
    infrastructure: buildInfrastructure(nearby),
    investment: buildInvestment(property, nearby),
  };
}

export const propertyIntelligenceService = {
  /**
   * Get intelligence for a property. Built from real data only (nearby POI + known facts);
   * unverifiable fields stay null. Persisted *_analysis columns are ignored while they hold
   * legacy generated values — re-enable once real analysis is written there.
   */
  async getIntelligence(propertyId: string): Promise<PropertyIntelligence> {
    try {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: {
          id: true,
          district: true,
          neighborhood: true,
          latitude: true,
          longitude: true,
          price: true,
          area: true,
          sizeSqm: true,
          yearBuilt: true,
          hasParking: true,
          nearbyPois: true,
        },
      });

      if (!property) {
        throw new Error(`Property not found: ${propertyId}`);
      }

      const propertyInput: PropertyInput = {
        id: property.id,
        district: property.district,
        neighborhood: property.neighborhood,
        latitude: property.latitude ? Number(property.latitude) : null,
        longitude: property.longitude ? Number(property.longitude) : null,
        price: property.price ? Number(property.price) : null,
        area: property.area ? Number(property.area) : (property.sizeSqm ? Number(property.sizeSqm) : null),
        year_built: property.yearBuilt,
        has_parking: property.hasParking,
      };
      return buildHonestIntelligence(propertyInput, property.nearbyPois);
    } catch (error) {
      console.error('Error fetching property intelligence:', error);
      return buildHonestIntelligence({ id: propertyId }, null);
    }
  },

  /**
   * Build intelligence for a property object (no DB read). Pass `nearby` (real POI) when available.
   */
  async generateIntelligence(property: PropertyInput, nearby: unknown = null): Promise<PropertyIntelligence> {
    return buildHonestIntelligence(property, nearby);
  },

  /**
   * Save generated intelligence to database
   */
  async saveIntelligence(propertyId: string, intelligence: PropertyIntelligence): Promise<void> {
    try {
      await prisma.property.update({
        where: { id: propertyId },
        data: {
          legal_analysis: intelligence.legal as any,
          location_analysis: intelligence.location as any,
          infrastructure_analysis: intelligence.infrastructure as any,
          investment_analysis: intelligence.investment as any,
        },
      });
    } catch (error) {
      console.error('Error saving property intelligence:', error);
    }
  },

  /**
   * Regenerate and save intelligence for a property
   */
  async refreshIntelligence(propertyId: string): Promise<PropertyIntelligence> {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        district: true,
        neighborhood: true,
        latitude: true,
        longitude: true,
        price: true,
        area: true,
        sizeSqm: true,
        yearBuilt: true,
        hasParking: true,
      },
    });

    if (!property) {
      throw new Error(`Property not found: ${propertyId}`);
    }

    const propertyInput: PropertyInput = {
      id: property.id,
      district: property.district,
      neighborhood: property.neighborhood,
      latitude: property.latitude ? Number(property.latitude) : null,
      longitude: property.longitude ? Number(property.longitude) : null,
      price: property.price ? Number(property.price) : null,
      area: property.area ? Number(property.area) : (property.sizeSqm ? Number(property.sizeSqm) : null),
      year_built: property.yearBuilt,
      has_parking: property.hasParking,
    };

    const intelligence = await this.generateIntelligence(propertyInput);
    await this.saveIntelligence(propertyId, intelligence);

    return intelligence;
  },
};

export default propertyIntelligenceService;
