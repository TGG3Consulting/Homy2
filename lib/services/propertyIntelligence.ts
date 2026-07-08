import prisma from '@/lib/db/prisma';
import { neighborhoods, getNeighborhoodByName } from '../neighborhoods';
import { geocodingService } from './geocodingService';

// ============================================================================
// Type Definitions
// ============================================================================

export interface LegalAnalysis {
  developer_verified: boolean;
  developer_name: string;
  claims_count: number;
  double_sale_risk: boolean;
  ownership_status: 'clear' | 'encumbered' | 'pending';
  title_status: 'verified' | 'pending' | 'issues';
}

export interface LocationAnalysis {
  commute_am: number; // minutes to city center morning
  commute_pm: number; // minutes to city center evening
  highway_distance: number; // meters
  noise_level: 'low' | 'medium' | 'high';
  ecology_index: number; // 0-100
  parking_available: boolean;
  playgrounds_nearby: boolean;
  parks_nearby: { name: string; distance: number }[];
}

export interface InfrastructureAnalysis {
  supermarkets: { name: string; distance: number; rating?: number }[];
  pharmacies: { name: string; distance: number }[];
  banks: { name: string; distance: number }[];
  schools: { name: string; distance: number; type: string }[];
  transport: { type: string; name: string; distance: number }[];
}

export interface InvestmentAnalysis {
  score: number; // 0-100
  price_vs_market: number; // percentage, e.g., -5 means 5% below market
  demand_signals: string[]; // ["High rental demand", "Growing neighborhood"]
  roi_estimate: number; // annual percentage
  appreciation_forecast: number; // 5-year percentage
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
// District Configuration
// ============================================================================

interface DistrictProfile {
  commuteBase: number;      // Base commute time in minutes
  ecologyBase: number;      // Base ecology score 0-100
  infrastructureLevel: 'high' | 'medium' | 'low';
  investmentPotential: number; // Base investment score
  noiseLevel: 'low' | 'medium' | 'high';
  demandLevel: 'high' | 'medium' | 'low';
}

const districtProfiles: Record<string, DistrictProfile> = {
  'Kentron': {
    commuteBase: 5,
    ecologyBase: 60,
    infrastructureLevel: 'high',
    investmentPotential: 85,
    noiseLevel: 'high',
    demandLevel: 'high',
  },
  'Arabkir': {
    commuteBase: 12,
    ecologyBase: 75,
    infrastructureLevel: 'high',
    investmentPotential: 80,
    noiseLevel: 'medium',
    demandLevel: 'high',
  },
  'Davtashen': {
    commuteBase: 18,
    ecologyBase: 85,
    infrastructureLevel: 'medium',
    investmentPotential: 75,
    noiseLevel: 'low',
    demandLevel: 'medium',
  },
  'Kanaker-Zeytun': {
    commuteBase: 15,
    ecologyBase: 70,
    infrastructureLevel: 'medium',
    investmentPotential: 70,
    noiseLevel: 'medium',
    demandLevel: 'medium',
  },
  'Avan': {
    commuteBase: 20,
    ecologyBase: 80,
    infrastructureLevel: 'medium',
    investmentPotential: 72,
    noiseLevel: 'low',
    demandLevel: 'medium',
  },
  'Erebuni': {
    commuteBase: 22,
    ecologyBase: 65,
    infrastructureLevel: 'medium',
    investmentPotential: 65,
    noiseLevel: 'medium',
    demandLevel: 'low',
  },
  'Malatia-Sebastia': {
    commuteBase: 20,
    ecologyBase: 68,
    infrastructureLevel: 'medium',
    investmentPotential: 68,
    noiseLevel: 'medium',
    demandLevel: 'medium',
  },
  'Nor-Nork': {
    commuteBase: 18,
    ecologyBase: 72,
    infrastructureLevel: 'medium',
    investmentPotential: 70,
    noiseLevel: 'medium',
    demandLevel: 'medium',
  },
  'Nork-Marash': {
    commuteBase: 15,
    ecologyBase: 82,
    infrastructureLevel: 'medium',
    investmentPotential: 78,
    noiseLevel: 'low',
    demandLevel: 'high',
  },
  'Shengavit': {
    commuteBase: 18,
    ecologyBase: 60,
    infrastructureLevel: 'low',
    investmentPotential: 60,
    noiseLevel: 'medium',
    demandLevel: 'low',
  },
  'Ajapnyak': {
    commuteBase: 20,
    ecologyBase: 70,
    infrastructureLevel: 'medium',
    investmentPotential: 65,
    noiseLevel: 'medium',
    demandLevel: 'low',
  },
  'Nubarashen': {
    commuteBase: 28,
    ecologyBase: 75,
    infrastructureLevel: 'low',
    investmentPotential: 55,
    noiseLevel: 'low',
    demandLevel: 'low',
  },
};

const defaultProfile: DistrictProfile = {
  commuteBase: 20,
  ecologyBase: 70,
  infrastructureLevel: 'medium',
  investmentPotential: 65,
  noiseLevel: 'medium',
  demandLevel: 'medium',
};

// ============================================================================
// Helper Functions
// ============================================================================

function getDistrictProfile(district: string | null | undefined): DistrictProfile {
  if (!district) return defaultProfile;
  return districtProfiles[district] || defaultProfile;
}

function randomVariation(base: number, variance: number): number {
  return Math.round(base + (Math.random() - 0.5) * 2 * variance);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function seededRandom(seed: string): () => number {
  // Simple hash function for consistent random values per property
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return () => {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    return (hash % 1000) / 1000;
  };
}

// ============================================================================
// Data Generation Functions
// ============================================================================

function generateLegalAnalysis(property: PropertyInput, random: () => number): LegalAnalysis {
  const developerName = property.developer || 'Unknown Developer';
  const isVerified = random() > 0.3; // 70% chance verified

  return {
    developer_verified: isVerified,
    developer_name: developerName,
    claims_count: random() > 0.85 ? Math.floor(random() * 3) + 1 : 0, // 15% have claims
    double_sale_risk: random() > 0.95, // 5% risk
    ownership_status: random() > 0.1 ? 'clear' : (random() > 0.5 ? 'pending' : 'encumbered'),
    title_status: isVerified ? 'verified' : (random() > 0.3 ? 'pending' : 'issues'),
  };
}

function generateLocationAnalysis(property: PropertyInput, profile: DistrictProfile, random: () => number): LocationAnalysis {
  const baseCommute = profile.commuteBase;
  const amTraffic = randomVariation(baseCommute + 5, 5); // Morning rush adds ~5 min
  const pmTraffic = randomVariation(baseCommute + 8, 6); // Evening rush adds ~8 min

  // Highway distance varies by district location
  const highwayBase = profile.commuteBase < 15 ? 500 : profile.commuteBase < 22 ? 1500 : 3000;

  // Generate parks
  const parkNames = [
    'Lovers Park', 'Victory Park', 'Circular Park', 'English Park',
    'Tumo Park', 'Children\'s Park', 'Hrazdan Gorge Park', 'Botanical Garden',
  ];
  const numParks = profile.ecologyBase > 75 ? 3 : profile.ecologyBase > 65 ? 2 : 1;
  const parks = Array.from({ length: numParks }, (_, i) => ({
    name: parkNames[Math.floor(random() * parkNames.length)],
    distance: Math.round(200 + random() * 1000),
  })).sort((a, b) => a.distance - b.distance);

  return {
    commute_am: clamp(amTraffic, 5, 45),
    commute_pm: clamp(pmTraffic, 8, 50),
    highway_distance: Math.round(highwayBase + random() * 1000),
    noise_level: profile.noiseLevel,
    ecology_index: clamp(randomVariation(profile.ecologyBase, 10), 0, 100),
    parking_available: property.has_parking ?? random() > 0.4,
    playgrounds_nearby: random() > 0.3,
    parks_nearby: parks,
  };
}

function generateInfrastructureAnalysis(profile: DistrictProfile, random: () => number): InfrastructureAnalysis {
  const infraLevel = profile.infrastructureLevel;
  const countMultiplier = infraLevel === 'high' ? 1.5 : infraLevel === 'medium' ? 1.0 : 0.6;
  const distanceMultiplier = infraLevel === 'high' ? 0.6 : infraLevel === 'medium' ? 1.0 : 1.5;

  // Supermarkets
  const supermarketNames = ['SAS', 'Yerevan City', 'Nor Zovk', 'Parma', 'Carrefour', 'Spar'];
  const supermarkets = Array.from({ length: Math.ceil(3 * countMultiplier) }, (_, i) => ({
    name: supermarketNames[i % supermarketNames.length],
    distance: Math.round((150 + random() * 500) * distanceMultiplier),
    rating: parseFloat((3.5 + random() * 1.5).toFixed(1)),
  })).sort((a, b) => a.distance - b.distance);

  // Pharmacies
  const pharmacyNames = ['Natali Pharm', 'Alfa Pharm', 'Arpimed', 'Liqvor', 'Apaven'];
  const pharmacies = Array.from({ length: Math.ceil(2 * countMultiplier) }, (_, i) => ({
    name: pharmacyNames[i % pharmacyNames.length],
    distance: Math.round((100 + random() * 600) * distanceMultiplier),
  })).sort((a, b) => a.distance - b.distance);

  // Banks
  const bankNames = ['Ameriabank', 'Ardshinbank', 'Inecobank', 'ACBA Bank', 'Amiobank', 'Armeconombank'];
  const banks = Array.from({ length: Math.ceil(2 * countMultiplier) }, (_, i) => ({
    name: bankNames[i % bankNames.length],
    distance: Math.round((200 + random() * 700) * distanceMultiplier),
  })).sort((a, b) => a.distance - b.distance);

  // Schools
  const schoolTypes = ['Public School', 'Private School', 'Gymnasium', 'Kindergarten'];
  const schools = Array.from({ length: Math.ceil(3 * countMultiplier) }, (_, i) => ({
    name: `School #${Math.floor(random() * 200) + 1}`,
    distance: Math.round((200 + random() * 800) * distanceMultiplier),
    type: schoolTypes[i % schoolTypes.length],
  })).sort((a, b) => a.distance - b.distance);

  // Transport
  const transportTypes = [
    { type: 'metro', name: 'Metro Station' },
    { type: 'bus', name: 'Bus Stop' },
    { type: 'minibus', name: 'Marshrutka Stop' },
  ];
  const transport = transportTypes.map((t, i) => ({
    type: t.type,
    name: t.name,
    distance: Math.round((50 + random() * 400 + (t.type === 'metro' ? 300 : 0)) * distanceMultiplier),
  })).sort((a, b) => a.distance - b.distance);

  return {
    supermarkets,
    pharmacies,
    banks,
    schools,
    transport,
  };
}

function generateInvestmentAnalysis(
  property: PropertyInput,
  profile: DistrictProfile,
  random: () => number
): InvestmentAnalysis {
  const district = property.district || property.neighborhood;
  const neighborhoodData = district ? getNeighborhoodByName(district) : null;
  const avgPriceSqm = neighborhoodData?.avg_price_sqm_usd || 900;

  // Calculate price vs market
  const propertyPriceSqm = property.price && (property.area || property.size_sqm)
    ? property.price / (property.area || property.size_sqm || 1)
    : avgPriceSqm;
  const priceVsMarket = Math.round(((propertyPriceSqm - avgPriceSqm) / avgPriceSqm) * 100);

  // Generate demand signals based on district profile
  const allSignals = [
    { signal: 'High rental demand', condition: profile.demandLevel === 'high' },
    { signal: 'Growing neighborhood', condition: random() > 0.5 && profile.investmentPotential > 70 },
    { signal: 'Near metro station', condition: random() > 0.6 },
    { signal: 'Good school district', condition: profile.infrastructureLevel !== 'low' },
    { signal: 'New construction zone', condition: random() > 0.7 },
    { signal: 'Expat-friendly area', condition: profile.demandLevel === 'high' && random() > 0.4 },
    { signal: 'Price appreciation trend', condition: profile.investmentPotential > 75 },
    { signal: 'Low vacancy rates', condition: profile.demandLevel !== 'low' },
  ];

  const demandSignals = allSignals
    .filter(s => s.condition)
    .map(s => s.signal)
    .slice(0, 4);

  // Calculate investment score
  let investmentScore = profile.investmentPotential;
  if (priceVsMarket < -5) investmentScore += 10; // Good deal bonus
  if (priceVsMarket > 10) investmentScore -= 10; // Overpriced penalty
  if (property.year_built && property.year_built >= 2015) investmentScore += 5;
  investmentScore = clamp(randomVariation(investmentScore, 5), 0, 100);

  // ROI estimate (annual)
  const baseRoi = profile.demandLevel === 'high' ? 8 : profile.demandLevel === 'medium' ? 6 : 4;
  const roiEstimate = parseFloat((baseRoi + random() * 3 - 1).toFixed(1));

  // Appreciation forecast (5 years)
  const baseAppreciation = profile.investmentPotential > 75 ? 25 : profile.investmentPotential > 65 ? 18 : 12;
  const appreciationForecast = Math.round(baseAppreciation + random() * 15 - 5);

  return {
    score: investmentScore,
    price_vs_market: priceVsMarket,
    demand_signals: demandSignals,
    roi_estimate: roiEstimate,
    appreciation_forecast: appreciationForecast,
  };
}

// ============================================================================
// Property Intelligence Service
// ============================================================================

export const propertyIntelligenceService = {
  /**
   * Get intelligence for a property (from DB or generate if missing)
   */
  async getIntelligence(propertyId: string): Promise<PropertyIntelligence> {
    try {
      // Try to fetch from database
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
          legal_analysis: true,
          location_analysis: true,
          infrastructure_analysis: true,
          investment_analysis: true,
        },
      });

      if (!property) {
        throw new Error(`Property not found: ${propertyId}`);
      }

      // Check if we have all analysis data in DB
      if (
        property.legal_analysis &&
        property.location_analysis &&
        property.infrastructure_analysis &&
        property.investment_analysis
      ) {
        return {
          legal: property.legal_analysis as unknown as LegalAnalysis,
          location: property.location_analysis as unknown as LocationAnalysis,
          infrastructure: property.infrastructure_analysis as unknown as InfrastructureAnalysis,
          investment: property.investment_analysis as unknown as InvestmentAnalysis,
        };
      }

      // Generate missing data - convert Decimal to number
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
      return this.generateIntelligence(propertyInput);
    } catch (error) {
      console.error('Error fetching property intelligence:', error);
      // Return generated data with default values
      return this.generateIntelligence({ id: propertyId });
    }
  },

  /**
   * Generate intelligence data for a property (uses property's lat/lng and district)
   */
  async generateIntelligence(property: PropertyInput): Promise<PropertyIntelligence> {
    // Get district from property or try to determine from coordinates
    let district = property.district || property.neighborhood;

    if (!district) {
      const lat = property.latitude || property.coordinates?.lat;
      const lng = property.longitude || property.coordinates?.lng;
      if (lat && lng) {
        district = geocodingService.getDistrictFromCoordinates(lat, lng);
      }
    }

    const profile = getDistrictProfile(district);

    // Use seeded random for consistent results per property
    const random = seededRandom(property.id);

    const intelligence: PropertyIntelligence = {
      legal: generateLegalAnalysis(property, random),
      location: generateLocationAnalysis(property, profile, random),
      infrastructure: generateInfrastructureAnalysis(profile, random),
      investment: generateInvestmentAnalysis(property, profile, random),
    };

    return intelligence;
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
