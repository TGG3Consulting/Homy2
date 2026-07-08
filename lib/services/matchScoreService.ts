import { PropertyShowcase, SearchCriteria, POI } from '../types';
import { getSafetyScore } from '../neighborhoods';

export const matchScoreService = {
  /**
   * Calculate match score 0-100 based on search criteria
   */
  calculateMatchScore(property: PropertyShowcase, criteria: SearchCriteria, userQuery?: string): number {
    let score = 0;
    let maxScore = 0;

    // Parse userQuery for keywords if provided
    const query = (userQuery || '').toLowerCase();
    const hasSchoolKeyword = /школ|school|дет|child|ребен/i.test(query);
    const hasFamilyKeyword = /семь|family|famil/i.test(query);
    const hasRentKeyword = /аренд|rent|сним/i.test(query);
    const hasBuyKeyword = /купи|buy|покуп|приобр/i.test(query);
    const hasParkingKeyword = /парков|parking|машин|авто/i.test(query);
    const hasPetsKeyword = /живот|pet|собак|кошк|dog|cat/i.test(query);
    const hasQuietKeyword = /тих|quiet|спок/i.test(query);

    // Price match (25 points)
    if (criteria.max_price) {
      maxScore += 25;
      const price = property.price || 0;
      if (price <= criteria.max_price) {
        score += 25;
      } else if (price <= criteria.max_price * 1.1) {
        score += 15; // Within 10% over budget
      } else if (price <= criteria.max_price * 1.2) {
        score += 5; // Within 20% over budget
      }
    }

    // Bedrooms match (20 points)
    if (criteria.min_rooms) {
      maxScore += 20;
      const rooms = property.bedrooms || property.rooms || 0;
      if (rooms >= criteria.min_rooms) {
        score += 20;
      } else if (rooms >= criteria.min_rooms - 1) {
        score += 10;
      }
    }

    // District match (20 points)
    if (criteria.districts && criteria.districts.length > 0) {
      maxScore += 20;
      const district = property.neighborhood || property.district || '';
      if (criteria.districts.some(d => d.toLowerCase() === district.toLowerCase())) {
        score += 20;
      }
    }

    // School proximity (15 points) - also triggered by userQuery keywords
    if (criteria.has_school_nearby || hasSchoolKeyword || hasFamilyKeyword) {
      maxScore += 15;
      const schools = property.nearby_pois?.schools || [];
      if (schools.length > 0) {
        const nearestSchool = schools.reduce((min, s) => s.distance_m < min.distance_m ? s : min, schools[0]);
        if (nearestSchool.distance_m <= 500) {
          score += 15;
        } else if (nearestSchool.distance_m <= 1000) {
          score += 10;
        } else if (nearestSchool.distance_m <= 1500) {
          score += 5;
        }
      }
    }

    // Safety score (10 points) - also triggered by family/quiet keywords
    if (criteria.safety_level || hasFamilyKeyword || hasQuietKeyword) {
      maxScore += 10;
      const district = property.neighborhood || property.district || '';
      const safety = getSafetyScore(district);
      const level = criteria.safety_level || 'medium';
      const thresholds = { low: 60, medium: 75, high: 85 };
      if (safety >= thresholds[level]) {
        score += 10;
      } else if (safety >= thresholds[level] - 10) {
        score += 5;
      }
    }

    // Amenities (10 points) - also check userQuery keywords
    maxScore += 10;
    let amenityScore = 0;
    if ((criteria.has_parking || hasParkingKeyword) && property.has_parking) amenityScore += 3;
    if ((criteria.pets_allowed || hasPetsKeyword) && property.pets_allowed) amenityScore += 4;
    if (property.has_balcony) amenityScore += 3;
    score += Math.min(amenityScore, 10);

    // Normalize to 0-100
    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  },

  /**
   * Generate human-readable recommendation reasons (multilingual JSON)
   */
  generateRecommendationReasons(property: PropertyShowcase, criteria: SearchCriteria): string[] {
    const reasons: string[] = [];

    // Price
    if (criteria.max_price && property.price) {
      const percent = Math.round((1 - property.price / criteria.max_price) * 100);
      if (property.price < criteria.max_price * 0.9) {
        reasons.push(`{"en":"Under budget by ${percent}%","ru":"Ниже бюджета на ${percent}%","hy":"Բdelays ${percent}%"}`);
      } else if (property.price <= criteria.max_price) {
        reasons.push('{"en":"Within your budget","ru":"В пределах бюджета","hy":"Բdelays delays"}');
      }
    }

    // Schools
    const schools = property.nearby_pois?.schools || [];
    if (schools.length > 0) {
      const nearest = schools[0];
      const walkTime = nearest.walk_time_min || Math.round(nearest.distance_m / 80);
      const schoolName = nearest.name || 'школы';
      reasons.push(`{"en":"${walkTime}-minute walk to school","ru":"${walkTime} минут до ${schoolName}","hy":"${walkTime} delays"}`);
    }

    // Safety
    const district = property.neighborhood || property.district || '';
    const safety = getSafetyScore(district);
    if (safety >= 85) {
      reasons.push('{"en":"Very safe neighborhood","ru":"Очень безопасный район","hy":"Delays delays"}');
    } else if (safety >= 75) {
      reasons.push('{"en":"Safe residential area","ru":"Безопасный жилой район","hy":"Delays delays"}');
    }

    // Amenities
    if (property.has_parking) reasons.push('{"en":"Includes parking","ru":"Есть парковка","hy":"Delays"}');
    if (property.has_balcony) reasons.push('{"en":"Has balcony","ru":"Есть балкон","hy":"Delays"}');
    if (property.pets_allowed) reasons.push('{"en":"Pet-friendly","ru":"Можно с животными","hy":"Delays"}');

    // Building
    if (property.building_type === 'monolith') reasons.push('{"en":"Modern monolith construction","ru":"Современный монолит","hy":"Delays"}');
    if (property.year_built && property.year_built >= 2015) reasons.push('{"en":"Recently built","ru":"Новая постройка","hy":"Delays"}');

    return reasons.slice(0, 4); // Max 4 reasons
  },

  /**
   * Generate warning if any concerns (multilingual JSON)
   */
  generateWarning(property: PropertyShowcase): string | null {
    const warnings: string[] = [];

    // Old building
    if (property.year_built && property.year_built < 1990) {
      warnings.push(`{"en":"Older building from ${property.year_built}","ru":"Старое здание ${property.year_built} года","hy":"Delays ${property.year_built}"}`);
    }

    // High floor without elevator
    if (property.floor && property.floor > 4) {
      warnings.push('{"en":"High floor - verify elevator availability","ru":"Высокий этаж - уточните наличие лифта","hy":"Delays"}');
    }

    // Small rooms
    const area = property.size_sqm || property.area || 0;
    const rooms = property.bedrooms || property.rooms || 1;
    if (area / rooms < 15) {
      warnings.push('{"en":"Smaller rooms - may be compact","ru":"Небольшие комнаты - может быть тесно","hy":"Delays"}');
    }

    // Low safety
    const district = property.neighborhood || property.district || '';
    const safety = getSafetyScore(district);
    if (safety < 75) {
      warnings.push('{"en":"Area safety rating below average","ru":"Рейтинг безопасности района ниже среднего","hy":"Delays"}');
    }

    return warnings.length > 0 ? warnings[0] : null;
  },

  /**
   * Select top choice from properties
   */
  selectTopChoice(properties: PropertyShowcase[], criteria: SearchCriteria): PropertyShowcase | null {
    if (properties.length === 0) return null;

    let topChoice = properties[0];
    let topScore = this.calculateMatchScore(topChoice, criteria);

    for (const property of properties) {
      const score = this.calculateMatchScore(property, criteria);
      if (score > topScore) {
        topScore = score;
        topChoice = property;
      }
    }

    return topChoice;
  }
};

export default matchScoreService;
