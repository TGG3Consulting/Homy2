import { PropertyShowcase, SearchCriteria } from '../types';
import matchScoreService from '../services/matchScoreService';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Convert Prisma Decimal to number
 */
function toNumber(value: Decimal | number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  // Prisma Decimal
  return parseFloat(value.toString()) || 0;
}

/**
 * Database property format (from Prisma)
 */
export interface DBProperty {
  id: string;
  title: string;
  address?: string;
  district?: string;
  price?: number;
  currency?: string;
  rooms?: number;
  bathrooms?: number;
  area?: number;
  floor?: number;
  totalFloors?: number;
  yearBuilt?: number;
  buildingType?: string;
  condition?: string;
  description?: string;
  features?: string[];
  images?: string[];
  latitude?: number;
  longitude?: number;
  utilitiesEstimate?: number;
  depositMonths?: number;
  minimumLeaseMonths?: number;
  petsAllowed?: boolean;
  hasParking?: boolean;
  hasBalcony?: boolean;
  propertyType?: string;
  dealType?: string;
  contact?: any;
  nearbyPois?: any;
  available?: boolean;
  verified?: boolean;
  listingDate?: Date;
}

/**
 * Adapter for converting between DB and Frontend formats
 */
export const propertyAdapter = {
  /**
   * Convert DB property to frontend format
   */
  toFrontendFormat(dbProperty: any): PropertyShowcase {
    // Convert all Decimal fields to numbers
    const price = toNumber(dbProperty.price);
    const area = toNumber(dbProperty.area) || toNumber(dbProperty.sizeSqm);
    const latitude = toNumber(dbProperty.latitude);
    const longitude = toNumber(dbProperty.longitude);
    const utilitiesEstimate = toNumber(dbProperty.utilitiesEstimate);

    return {
      id: dbProperty.id,
      name: dbProperty.title,
      title: dbProperty.title,
      address: dbProperty.address || '',
      province: dbProperty.province || '',
      city: dbProperty.city || '',
      district: dbProperty.district || '',
      neighborhood: dbProperty.neighborhood || dbProperty.district || '',
      price,
      currency: dbProperty.currency || 'AMD',
      rooms: dbProperty.rooms || 0,
      bedrooms: dbProperty.bedrooms || dbProperty.rooms || 0,
      bathrooms: dbProperty.bathrooms || 0,
      area,
      size_sqm: area,
      floor: dbProperty.floor,
      total_floors: dbProperty.totalFloors,
      year_built: dbProperty.yearBuilt,
      building_type: dbProperty.buildingType as any,
      condition: dbProperty.condition,
      description: dbProperty.description,
      features: dbProperty.features || [],
      images: dbProperty.images || [],
      image_url: dbProperty.images?.[0] || dbProperty.imageUrl || '',
      imageUrl: dbProperty.images?.[0] || dbProperty.imageUrl || '',
      latitude,
      longitude,
      coordinates: latitude && longitude
        ? { lat: latitude, lng: longitude }
        : undefined,
      utilities_estimate: utilitiesEstimate || undefined,
      deposit_months: dbProperty.depositMonths,
      minimum_lease_months: dbProperty.minimumLeaseMonths,
      pets_allowed: dbProperty.petsAllowed || false,
      has_parking: dbProperty.hasParking || false,
      has_balcony: dbProperty.hasBalcony || false,
      has_virtual_tour: dbProperty.virtual_tour_enabled || dbProperty.hasVirtualTour || false,
      property_type: dbProperty.propertyType as any,
      deal_type: dbProperty.dealType as any,
      contact: dbProperty.contact,
      owner: dbProperty.owner,
      nearby_pois: dbProperty.nearbyPois,
      available: dbProperty.available ?? true,
      verified: dbProperty.verified || false,
      listing_date: dbProperty.listingDate?.toISOString?.() || dbProperty.listingDate,
      match_score: dbProperty.matchScore || 0,
      is_top_choice: dbProperty.isTopChoice || false,
      recommendation_reasons: dbProperty.recommendationReasons || [],
      warning: dbProperty.warning || undefined,
    };
  },

  /**
   * Convert frontend property to DB format
   */
  toDBFormat(frontendProperty: Partial<PropertyShowcase>): Partial<DBProperty> {
    return {
      id: frontendProperty.id,
      title: frontendProperty.name || frontendProperty.title,
      address: frontendProperty.address,
      district: frontendProperty.neighborhood || frontendProperty.district,
      price: frontendProperty.price,
      currency: frontendProperty.currency,
      rooms: frontendProperty.bedrooms || frontendProperty.rooms,
      bathrooms: frontendProperty.bathrooms,
      area: frontendProperty.size_sqm || frontendProperty.area,
      floor: frontendProperty.floor,
      totalFloors: frontendProperty.total_floors,
      yearBuilt: frontendProperty.year_built,
      buildingType: frontendProperty.building_type,
      condition: frontendProperty.condition,
      description: frontendProperty.description,
      features: frontendProperty.features,
      images: frontendProperty.images || (frontendProperty.image_url ? [frontendProperty.image_url] : []),
      latitude: frontendProperty.latitude || frontendProperty.coordinates?.lat,
      longitude: frontendProperty.longitude || frontendProperty.coordinates?.lng,
      utilitiesEstimate: frontendProperty.utilities_estimate,
      depositMonths: frontendProperty.deposit_months,
      minimumLeaseMonths: frontendProperty.minimum_lease_months,
      petsAllowed: frontendProperty.pets_allowed,
      hasParking: frontendProperty.has_parking,
      hasBalcony: frontendProperty.has_balcony,
      propertyType: frontendProperty.property_type,
      dealType: frontendProperty.deal_type,
      contact: frontendProperty.contact,
      nearbyPois: frontendProperty.nearby_pois,
      available: frontendProperty.available,
      verified: frontendProperty.verified,
    };
  },

  /**
   * Enrich property with AI-generated fields
   */
  enrichWithAI(property: PropertyShowcase, criteria: SearchCriteria): PropertyShowcase {
    return {
      ...property,
      match_score: matchScoreService.calculateMatchScore(property, criteria, criteria.search_context),
      recommendation_reasons: matchScoreService.generateRecommendationReasons(property, criteria),
      warning: matchScoreService.generateWarning(property) || undefined,
      // "top choice" is a ranking artifact set by the ranker (not the stale DB seed column).
      is_top_choice: false,
    };
  },

  /**
   * Enrich array of properties and mark top choice
   */
  enrichArrayWithAI(properties: PropertyShowcase[], criteria: SearchCriteria): PropertyShowcase[] {
    const enriched = properties.map(p => this.enrichWithAI(p, criteria));

    // Sort by match score descending
    enriched.sort((a, b) => b.match_score - a.match_score);

    // Mark top choice
    if (enriched.length > 0) {
      enriched[0].is_top_choice = true;
    }

    return enriched;
  },
};

/**
 * Alias for voice search compatibility
 */
export function adaptPrismaProperty(dbProperty: any): PropertyShowcase {
  return propertyAdapter.toFrontendFormat(dbProperty);
}

export default propertyAdapter;
