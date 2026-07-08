import { POI } from '../types';
import { neighborhoods, getNeighborhoodByName } from '../neighborhoods';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const OVERPASS_BASE = 'https://overpass-api.de/api/interpreter';

// Simple in-memory cache
const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 3600000; // 1 hour

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && entry.expires > Date.now()) {
    return entry.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL });
}

export const geocodingService = {
  /**
   * Convert address to coordinates using Nominatim
   */
  async addressToCoordinates(address: string): Promise<{ lat: number; lng: number } | null> {
    const cacheKey = `geo:${address}`;
    const cached = getCached<{ lat: number; lng: number }>(cacheKey);
    if (cached) return cached;

    try {
      const query = encodeURIComponent(`${address}, Yerevan, Armenia`);
      const response = await fetch(
        `${NOMINATIM_BASE}/search?q=${query}&format=json&limit=1`,
        {
          headers: { 'User-Agent': 'Homy/1.0 (contact@homy.am)' }
        }
      );

      const data = await response.json();
      if (data.length > 0) {
        const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        setCache(cacheKey, result);
        return result;
      }

      // Fallback: try to get district center
      for (const [name, info] of Object.entries(neighborhoods)) {
        if (address.toLowerCase().includes(name.toLowerCase())) {
          const result = { lat: info.lat, lng: info.lng };
          setCache(cacheKey, result);
          return result;
        }
      }

      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  },

  /**
   * Reverse geocoding - coordinates to address
   */
  async coordinatesToAddress(lat: number, lng: number): Promise<string | null> {
    const cacheKey = `rev:${lat.toFixed(5)},${lng.toFixed(5)}`;
    const cached = getCached<string>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lng}&format=json`,
        {
          headers: { 'User-Agent': 'Homy/1.0 (contact@homy.am)' }
        }
      );

      const data = await response.json();
      if (data.display_name) {
        setCache(cacheKey, data.display_name);
        return data.display_name;
      }
      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  },

  /**
   * Find nearby POI using Overpass API
   */
  async findNearbyPOI(lat: number, lng: number, radius: number = 1000): Promise<{
    schools: POI[];
    parks: POI[];
    metro: POI[];
    supermarkets: POI[];
  }> {
    const cacheKey = `poi:${lat.toFixed(4)},${lng.toFixed(4)},${radius}`;
    const cached = getCached<any>(cacheKey);
    if (cached) return cached;

    const result = {
      schools: [] as POI[],
      parks: [] as POI[],
      metro: [] as POI[],
      supermarkets: [] as POI[],
    };

    try {
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="school"](around:${radius},${lat},${lng});
          node["leisure"="park"](around:${radius},${lat},${lng});
          node["railway"="station"](around:${radius},${lat},${lng});
          node["shop"="supermarket"](around:${radius},${lat},${lng});
        );
        out body;
      `;

      const response = await fetch(OVERPASS_BASE, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const data = await response.json();

      for (const element of data.elements || []) {
        const distance = this.calculateDistance(lat, lng, element.lat, element.lon);
        const walkTime = Math.round(distance / 80); // ~80m per minute walking

        const poi: POI = {
          name: element.tags?.name || 'Unknown',
          distance_m: Math.round(distance),
          walk_time_min: walkTime,
        };

        if (element.tags?.amenity === 'school') {
          result.schools.push(poi);
        } else if (element.tags?.leisure === 'park') {
          result.parks.push(poi);
        } else if (element.tags?.railway === 'station') {
          result.metro.push(poi);
        } else if (element.tags?.shop === 'supermarket') {
          result.supermarkets.push(poi);
        }
      }

      // Sort by distance
      for (const key of Object.keys(result) as (keyof typeof result)[]) {
        result[key].sort((a, b) => a.distance_m - b.distance_m);
        result[key] = result[key].slice(0, 5); // Max 5 per category
      }

      setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('POI lookup error:', error);
      return result;
    }
  },

  /**
   * Calculate distance between two points in meters (Haversine formula)
   */
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  /**
   * Determine district from coordinates
   */
  getDistrictFromCoordinates(lat: number, lng: number): string | null {
    let closest: { name: string; distance: number } | null = null;

    for (const [name, info] of Object.entries(neighborhoods)) {
      const distance = this.calculateDistance(lat, lng, info.lat, info.lng);
      if (distance <= info.radius && (!closest || distance < closest.distance)) {
        closest = { name, distance };
      }
    }

    return closest?.name || null;
  },
};

export default geocodingService;
