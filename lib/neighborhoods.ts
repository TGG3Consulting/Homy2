import neighborhoodsData from '../data/neighborhoods.json';

export interface Neighborhood {
  name_en: string;
  name_ru: string;
  name_hy: string;
  lat: number;
  lng: number;
  radius: number;
  safety_score: number;
  avg_price_sqm_usd: number;
  description_en: string;
}

export const neighborhoods: Record<string, Neighborhood> = neighborhoodsData;

export function getNeighborhoodByName(name: string): Neighborhood | undefined {
  return neighborhoods[name];
}

export function getAllNeighborhoods(): string[] {
  return Object.keys(neighborhoods);
}

export function getNeighborhoodCenter(name: string): { lat: number; lng: number } | undefined {
  const n = neighborhoods[name];
  return n ? { lat: n.lat, lng: n.lng } : undefined;
}

export function getSafetyScore(name: string): number {
  return neighborhoods[name]?.safety_score ?? 50;
}
